import axios from "axios";
import https from "https";
import { db } from "../db.js";
import { settings, kernels } from "../schema.js";
import { eq } from "drizzle-orm";
import { getConfig, getClient, getKernelEnvironment } from "./pterodactyl-api.js";

const clientCache = new Map();

/**
 * Создать сервер Pterodactyl
 */
export async function createPteroServer({
  name,
  userId,
  plan,
  pteroUserId,
  serverNameOverride,
  pteroInstanceId = null,
  kernelId = null,
}) {
  console.log("\n=== CREATE SERVER START ===");
  console.log("Plan:", JSON.stringify(plan, null, 2));
  console.log("Kernel ID:", kernelId);

  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);

  // 1. Определяем nestId и eggId из плана или ядра
  let actualNestId = plan.nestId;
  let actualEggId = plan.eggId;
  let dockerImage = plan.dockerImage;
  let startup = plan.startup;

  if (kernelId) {
    const [kernel] = await db
      .select()
      .from(kernels)
      .where(eq(kernels.id, parseInt(kernelId)));

    if (kernel) {
      console.log("✅ Using kernel from DB:", kernel.name);
      if (!actualNestId) actualNestId = kernel.pteroNestId;
      if (!actualEggId) actualEggId = kernel.pteroEggId;
      if (!dockerImage) dockerImage = kernel.dockerImage;
      if (!startup) startup = kernel.startup;
    }
  }

  console.log("Final values:");
  console.log("  nestId:", actualNestId);
  console.log("  eggId:", actualEggId);
  console.log("  dockerImage:", dockerImage);

  if (!actualNestId || !actualEggId) {
    throw new Error(`Не указаны nestId (${actualNestId}) или eggId (${actualEggId})`);
  }

  // 2. Получаем переменные окружения
  let finalEnvironment = {};

  if (kernelId) {
    finalEnvironment = await getKernelEnvironment(kernelId, actualNestId, actualEggId);
  }

  // Если не получилось из ядра, пробуем из плана
  if (Object.keys(finalEnvironment).length === 0 && plan.environment) {
    try {
      finalEnvironment = typeof plan.environment === 'string'
        ? JSON.parse(plan.environment)
        : plan.environment;
      console.log("✅ Loaded environment from plan:", finalEnvironment);
    } catch (e) {
      console.log("Failed to parse plan environment");
    }
  }

  // Если всё ещё пусто, используем дефолтные
  if (Object.keys(finalEnvironment).length === 0) {
    console.log("⚠️ Using default environment");
    finalEnvironment = {
      SERVER_JARFILE: "server.jar",
      BUILD_NUMBER: "latest",
    };
  }

  console.log("✅ Final environment:", JSON.stringify(finalEnvironment));

  // 3. Выбираем ноду
  const selectedNodeId = await selectNode(client, plan);
  if (!selectedNodeId) {
    throw new Error("No available nodes");
  }
  console.log("Selected node:", selectedNodeId);

  // 4. Получаем аллокацию
  let allocationId = plan.allocationId;
  if (!allocationId) {
    allocationId = await getFreeAllocation(client, parseInt(selectedNodeId));
    if (allocationId) {
      console.log("Auto-selected allocation:", allocationId);
    }
  }

  // 5. Формируем payload
  const payload = {
    name: serverNameOverride || name,
    user: parseInt(pteroUserId),
    egg: parseInt(actualEggId),
    docker_image: dockerImage || "ghcr.io/parkervcp/yolks:java_21",
    startup: startup || "java -Xms128M -Xmx${SERVER_MEMORY}M -jar ${SERVER_JARFILE}",
    environment: finalEnvironment,
    limits: {
      memory: parseInt(plan.ramMb) || 1024,
      swap: 0,
      disk: parseInt(plan.diskMb) || 5120,
      io: 500,
      cpu: parseInt(plan.cpu) || 100,
    },
    feature_limits: {
      databases: parseInt(plan.dbLimit) || 0,
      backups: parseInt(plan.backupLimit) || 0,
      allocations: parseInt(plan.slots) || 1,
    },
  };

  if (allocationId) {
    payload.allocation = {
      default: parseInt(allocationId),
    };
    console.log("Using allocation:", allocationId);
  } else {
    payload.deploy = {
      locations: [parseInt(selectedNodeId)],
      dedicated_ip: false,
      port_range: ["60000-60100"],
    };
    console.log("Using deploy mode");
  }

  console.log("\nFinal payload:");
  console.log(JSON.stringify({
    ...payload,
    environment: `{${Object.keys(payload.environment).length} vars}`,
  }, null, 2));

  // 6. Создаём сервер
  try {
    const response = await client.post("/servers", payload);
    const serverId = response.data.attributes?.id;
    const identifier = response.data.attributes?.identifier;

    console.log("\n✅ SERVER CREATED SUCCESSFULLY!");
    console.log("  Server ID:", serverId);
    console.log("  Identifier:", identifier);

    return response.data;
  } catch (error) {
    console.error("\n❌ FAILED TO CREATE SERVER");
    if (error.response?.data) {
      console.error("Pterodactyl error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

/**
 * Выбрать ноду для развёртывания
 */
async function selectNode(client, plan) {
  // Если в плане указаны ноды
  if (plan.nodeIds) {
    try {
      const nodeIdsArray = JSON.parse(plan.nodeIds);
      if (Array.isArray(nodeIdsArray) && nodeIdsArray.length > 0) {
        return nodeIdsArray[Math.floor(Math.random() * nodeIdsArray.length)];
      }
    } catch (e) {
      console.error("Failed to parse nodeIds:", e);
    }
  }

  // Если указана одна нода
  if (plan.nodeId) {
    return plan.nodeId;
  }

  // Выбираем наименее загруженную
  try {
    const nodesResponse = await client.get("/nodes", { params: { per_page: 100 } });
    const nodes = nodesResponse.data.data || [];

    const nodesWithLoad = await Promise.all(
      nodes.map(async (node) => {
        try {
          const nodeId = node.attributes.id;
          const serversResponse = await client.get(
            `/nodes/${nodeId}/servers`,
            { params: { per_page: 1 } }
          );
          const totalServers = serversResponse.data.meta?.pagination?.total || 0;

          return {
            id: nodeId,
            name: node.attributes.name,
            load: totalServers,
            isUnderMaintenance: node.attributes.is_under_maintenance || false,
          };
        } catch (e) {
          return {
            id: node.attributes.id,
            name: node.attributes.name,
            load: 999999,
            isUnderMaintenance: node.attributes.is_under_maintenance || false,
          };
        }
      }),
    );

    const availableNodes = nodesWithLoad.filter(n => !n.isUnderMaintenance);
    availableNodes.sort((a, b) => a.load - b.load);

    if (availableNodes.length > 0) {
      return availableNodes[0].id;
    }
  } catch (error) {
    console.error("Error selecting node:", error.message);
  }

  return null;
}

/**
 * Получить свободную аллокацию
 */
async function getFreeAllocation(client, nodeId) {
  try {
    const allocationsResponse = await client.get(
      `/nodes/${nodeId}/allocations`,
      { params: { per_page: 500 } }
    );
    const allocations = allocationsResponse.data.data || [];
    const free = allocations.filter((a) => a.attributes?.assigned === false);

    if (free.length === 0) return null;

    const random = free[Math.floor(Math.random() * free.length)];
    return random.attributes.id;
  } catch (error) {
    console.error("Error getting allocation:", error.message);
    return null;
  }
}

/**
 * Удалить сервер
 */
export async function deletePteroServer(pteroServerId, pteroInstanceId = null) {
  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);
  await client.delete(`/servers/${pteroServerId}`);
}

/**
 * Получить статус сервера
 */
export async function getServerStatus(pteroServerId, pteroInstanceId = null) {
  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);

  try {
    const response = await client.get(
      `/servers/${pteroServerId}?include=resources`,
    );
    const attrs = response.data.attributes || {};

    if (attrs.isInstalling) return "installing";
    if (attrs.isReinstalling) return "reinstalling";
    if (attrs.state === "running") return "running";
    if (attrs.state === "offline") return "offline";
    if (attrs.status === "suspended") return "suspended";

    return "running";
  } catch (error) {
    console.error("Error getting server status:", error.message);
    return "offline";
  }
}
