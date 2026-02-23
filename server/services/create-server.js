import axios from "axios";
import { db } from "../db.js";
import { settings } from "../schema.js";
import { eq } from "drizzle-orm";

/**
 * Получить конфигурацию Pterodactyl
 */
async function getConfig() {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.group, "pterodactyl"));
  const config = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

/**
 * Создать HTTP клиент для Pterodactyl API
 */
function getClient(config) {
  const url = config["ptero_url"] || "";
  const key = config["ptero_api_key"] || "";
  return axios.create({
    baseURL: url.replace(/\/+$/, "") + "/api/application",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 30000,
  });
}

/**
 * Получить все переменные яйца из Pterodactyl
 */
async function getEggVariables(client, nestId, eggId) {
  try {
    // Пробуем получить через relationships
    const response = await client.get(
      `/nests/${nestId}/eggs/${eggId}?include=eggVariables`,
    );

    if (response.data.included && Array.isArray(response.data.included)) {
      return response.data.included
        .filter((item) => item.type === "egg_variable")
        .map((item) => ({
          env_variable:
            item.attributes?.environment_variable ||
            item.attributes?.env_variable,
          default_value: item.attributes?.default_value || "",
          required: item.attributes?.required || false,
        }))
        .filter((v) => v.env_variable);
    }

    // Пробуем получить напрямую через отдельный endpoint
    try {
      const varsResponse = await client.get(
        `/nests/${nestId}/eggs/${eggId}/variables`,
      );
      if (varsResponse.data.data) {
        return varsResponse.data.data.map((item) => ({
          env_variable:
            item.attributes?.environment_variable ||
            item.attributes?.env_variable,
          default_value: item.attributes?.default_value || "",
          required: item.attributes?.required || false,
        }));
      }
    } catch (e) {
      // Endpoint не доступен
    }

    // Получаем яйцо и пробуем извлечь переменные из attributes
    const eggResponse = await client.get(`/nests/${nestId}/eggs/${eggId}`);
    if (eggResponse.data.attributes?.variables) {
      return eggResponse.data.attributes.variables.map((v) => ({
        env_variable: v.env_variable || v.environment_variable,
        default_value: v.default_value || v.default || "",
        required: v.required || false,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error getting egg variables:", error.message);
    return [];
  }
}

/**
 * Извлечь переменные из startup строки (формат {{VAR_NAME}} или ${VAR_NAME})
 */
function extractVariablesFromStartup(startup) {
  if (!startup) return [];

  const variables = new Set();

  // Находим {{VAR_NAME}}
  const matches1 = startup.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/gi);
  if (matches1) {
    matches1.forEach((m) =>
      variables.add(m.replace("{{", "").replace("}}", "")),
    );
  }

  // Находим ${VAR_NAME}
  const matches2 = startup.match(/\$\{([A-Z_][A-Z0-9_]*)\}/gi);
  if (matches2) {
    matches2.forEach((m) =>
      variables.add(m.replace("${", "").replace("}", "")),
    );
  }

  // Преобразуем в массив переменных с дефолтными значениями
  return Array.from(variables).map((name) => ({
    env_variable: name,
    default_value: getDefaultValueForVariable(name),
    required: true,
  }));
}

/**
 * Получить дефолтное значение для переменной
 */
function getDefaultValueForVariable(varName) {
  const upper = varName.toUpperCase();
  const lower = varName.toLowerCase();

  // Файлы - проверяем в первую очередь
  if (upper === "SERVER_JARFILE" || upper === "JARFILE" || upper === "JAR_FILE")
    return "server.jar";
  if (upper === "PY_FILE" || upper === "PYTHON_FILE") return "main.py";
  if (upper === "JS_FILE" || upper === "NODE_FILE") return "index.js";
  if (upper === "REQUIREMENTS_FILE") return "requirements.txt";
  if (upper === "CONFIG_FILE") return "config.json";
  if (upper === "BUILD_NUMBER") return "latest";
  if (upper === "BUILD_TYPE") return "release";
  if (upper === "USER_UPLOAD") return "0";
  if (upper === "AUTO_UPDATE") return "1";
  if (upper === "PY_PACKAGES") return "";

  // Версии - специфичные
  if (upper === "MC_VERSION" || upper === "MINECRAFT_VERSION") return "1.20.4";
  if (upper === "PAPER_VERSION") return "latest";
  if (upper === "SPIGOT_VERSION") return "latest";
  if (upper === "FORGE_VERSION") return "latest";
  if (upper === "FABRIC_VERSION") return "latest";
  if (upper === "SPONGE_VERSION") return "latest";
  if (upper === "VELOCITY_VERSION") return "latest";
  if (upper === "BUNGEE_VERSION") return "latest";
  if (upper === "WATERFALL_VERSION") return "latest";
  if (upper === "JAVA_VERSION") return "21";
  if (upper === "PYTHON_VERSION") return "3.13";
  if (upper === "NODE_VERSION") return "20";

  // Версии - общее правило
  if (lower.includes("version")) return "latest";

  // Флаги
  if (upper.includes("UPDATE")) return "1";
  if (upper.includes("UPLOAD")) return "0";
  if (upper.includes("AUTO")) return "1";
  if (upper.includes("DEBUG")) return "0";

  // Пакеты
  if (upper.includes("PACKAGES") || upper.includes("DEPENDENCIES")) return "";
  if (upper.includes("PIP") || upper.includes("NPM") || upper.includes("YARN"))
    return "";

  // Сеть
  if (upper.includes("PORT")) return "25565";
  if (upper.includes("IP") || upper.includes("HOST")) return "0.0.0.0";

  // Ресурсы
  if (upper.includes("MEMORY") || upper.includes("RAM")) return "1024";
  if (upper.includes("CPU")) return "100";
  if (upper.includes("DISK")) return "5120";

  // Дефолтное значение
  return "latest";
}

/**
 * Найти nestId по eggId
 */
async function findNestId(client, eggId) {
  try {
    const nestsResponse = await client.get("/nests?per_page=100");
    const nests = nestsResponse.data.data || [];

    for (const nest of nests) {
      try {
        const eggResponse = await client.get(
          `/nests/${nest.attributes.id}/eggs/${eggId}`,
        );
        if (eggResponse.data) {
          return nest.attributes.id;
        }
      } catch (e) {
        // Яйцо не найдено в этом гнезде
      }
    }
  } catch (error) {
    console.error("Error finding nestId:", error.message);
  }
  return null;
}

/**
 * Получить свободную аллокацию на ноде
 */
async function getFreeAllocation(client, nodeId) {
  try {
    const allocationsResponse = await client.get(
      `/nodes/${nodeId}/allocations?per_page=100`,
    );
    const allocations = allocationsResponse.data.data || [];
    const free = allocations.filter((a) => a.attributes?.assigned === false);

    if (free.length === 0) return null;

    const random = free[Math.floor(Math.random() * free.length)];
    return random.attributes.id;
  } catch (error) {
    console.error("Error getting free allocation:", error.message);
    return null;
  }
}

/**
 * Получить наименее загруженную ноду
 */
async function getLeastLoadedNode(client) {
  try {
    const nodesResponse = await client.get("/nodes?per_page=100");
    const nodes = nodesResponse.data.data || [];

    const nodesWithLoad = await Promise.all(
      nodes.map(async (node) => {
        try {
          const nodeId = node.attributes.id;
          const serversResponse = await client.get(
            `/nodes/${nodeId}/servers?per_page=1`,
          );
          const totalServers =
            serversResponse.data.meta?.pagination?.total || 0;

          return {
            id: nodeId,
            name: node.attributes.name,
            load: totalServers,
          };
        } catch (e) {
          return {
            id: node.attributes.id,
            name: node.attributes.name,
            load: 999999,
          };
        }
      }),
    );

    nodesWithLoad.sort((a, b) => a.load - b.load);

    if (nodesWithLoad.length > 0) {
      const leastLoaded = nodesWithLoad[0];
      console.log(
        `Selected least loaded node: ${leastLoaded.name} (load: ${leastLoaded.load})`,
      );
      return leastLoaded.id;
    }

    return null;
  } catch (error) {
    console.error("Error getting least loaded node:", error.message);
    return null;
  }
}

/**
 * Построить переменные окружения для сервера
 */
function buildEnvironment(eggVariables, startup, dockerImage) {
  const environment = {};

  // Если есть переменные из API, используем их
  if (eggVariables && eggVariables.length > 0) {
    for (const variable of eggVariables) {
      if (variable.env_variable) {
        environment[variable.env_variable] = variable.default_value || "latest";
      }
    }
    return environment;
  }

  // Если переменных нет, извлекаем из startup
  const extractedVars = extractVariablesFromStartup(startup);
  if (extractedVars.length > 0) {
    for (const variable of extractedVars) {
      environment[variable.env_variable] = variable.default_value || "";
    }
    return environment;
  }

  // Если всё ещё нет, определяем тип сервера и добавляем стандартные переменные
  const startupLower = (startup || "").toLowerCase();
  const dockerLower = (dockerImage || "").toLowerCase();

  if (startupLower.includes("bungee") || dockerLower.includes("bungee")) {
    environment.BUNGEE_VERSION = "latest";
    environment.SERVER_JARFILE = "bungeecord.jar";
  } else if (
    startupLower.includes("velocity") ||
    dockerLower.includes("velocity")
  ) {
    environment.VELOCITY_VERSION = "latest";
    environment.SERVER_JARFILE = "velocity.jar";
  } else if (startupLower.includes("forge") || dockerLower.includes("forge")) {
    environment.FORGE_VERSION = "latest";
    environment.MINECRAFT_VERSION = "latest";
    environment.SERVER_JARFILE = "server.jar";
  } else if (
    startupLower.includes("fabric") ||
    dockerLower.includes("fabric")
  ) {
    environment.FABRIC_VERSION = "latest";
    environment.MINECRAFT_VERSION = "latest";
    environment.SERVER_JARFILE = "server.jar";
  } else if (startupLower.includes("paper") || dockerLower.includes("paper")) {
    environment.PAPER_VERSION = "latest";
    environment.SERVER_JARFILE = "server.jar";
    environment.MINECRAFT_VERSION = "latest";
  } else if (
    startupLower.includes("python") ||
    dockerLower.includes("python")
  ) {
    environment.AUTO_UPDATE = "1";
    environment.PY_FILE = "main.py";
    environment.REQUIREMENTS_FILE = "requirements.txt";
    environment.PY_PACKAGES = "";
    environment.USER_UPLOAD = "0";
  } else {
    // Дефолтные значения
    environment.SERVER_JARFILE = "server.jar";
    environment.MINECRAFT_VERSION = "latest";
  }

  return environment;
}

/**
 * Создать сервер Pterodactyl
 */
export async function createPteroServer({ name, userId, plan, pteroUserId }) {
  const config = await getConfig();
  const client = getClient(config);

  console.log(
    "Creating server with plan:",
    JSON.stringify({
      id: plan.id,
      name: plan.name,
      eggId: plan.eggId,
      nestId: plan.nestId,
    }),
  );

  // 1. Определяем nestId
  let actualNestId = plan.nestId;
  if (!actualNestId && plan.eggId) {
    actualNestId = await findNestId(client, plan.eggId);
    if (actualNestId) {
      console.log("Found nestId for egg:", actualNestId);
    }
  }

  // 2. Получаем информацию о яйце
  let eggStartup = plan.startup;
  let eggDockerImage = plan.dockerImage;
  let eggVariables = [];

  if (actualNestId && plan.eggId) {
    console.log(
      "Getting egg variables for nest:",
      actualNestId,
      "egg:",
      plan.eggId,
    );

    // Получаем яйцо для startup и docker_image
    try {
      const eggResponse = await client.get(
        `/nests/${actualNestId}/eggs/${plan.eggId}`,
      );
      if (eggResponse.data.attributes) {
        eggStartup = eggResponse.data.attributes.startup || eggStartup;
        eggDockerImage =
          eggResponse.data.attributes.docker_image || eggDockerImage;
      }
    } catch (e) {
      console.error("Error getting egg info:", e.message);
    }

    // Получаем переменные
    eggVariables = await getEggVariables(client, actualNestId, plan.eggId);
    console.log("Got egg variables:", JSON.stringify(eggVariables));
  }

  // 3. Строим переменные окружения
  const environment = buildEnvironment(
    eggVariables,
    eggStartup,
    eggDockerImage,
  );
  console.log("Environment variables:", JSON.stringify(environment));

  // 4. Используем дефолтные startup/docker_image если не получены
  let finalStartup = eggStartup;
  let finalDockerImage = eggDockerImage;

  if (!finalStartup) {
    finalStartup = "java -Xms128M -Xmx${SERVER_MEMORY}M -jar ${SERVER_JARFILE}";
    console.log("Using default startup:", finalStartup);
  }

  if (!finalDockerImage) {
    finalDockerImage = "ghcr.io/parkervcp/yolks:java_21";
    console.log("Using default docker_image:", finalDockerImage);
  }

  // 5. Выбираем ноду
  let selectedNodeId = null;

  if (plan.nodeIds) {
    try {
      const nodeIdsArray = JSON.parse(plan.nodeIds);
      if (Array.isArray(nodeIdsArray) && nodeIdsArray.length > 0) {
        selectedNodeId =
          nodeIdsArray[Math.floor(Math.random() * nodeIdsArray.length)];
        console.log("Selected random node from nodeIds:", selectedNodeId);
      }
    } catch (e) {
      console.error("Failed to parse nodeIds:", e);
    }
  }

  if (!selectedNodeId && plan.nodeId) {
    selectedNodeId = plan.nodeId;
    console.log("Using nodeId from plan:", selectedNodeId);
  }

  if (!selectedNodeId) {
    selectedNodeId = await getLeastLoadedNode(client);
  }

  // 6. Получаем аллокацию
  let allocationId = plan.allocationId;
  if (!allocationId && selectedNodeId) {
    allocationId = await getFreeAllocation(client, parseInt(selectedNodeId));
    console.log("Auto-selected allocation ID:", allocationId);
  }

  // 7. Формируем payload
  const payload = {
    name: name,
    user: pteroUserId,
    egg: plan.eggId,
    docker_image: finalDockerImage,
    startup: finalStartup,
    environment: environment,
    limits: {
      memory: plan.ramMb || 1024,
      swap: 0,
      disk: plan.diskMb || 5120,
      io: 500,
      cpu: plan.cpu || 100,
    },
    feature_limits: {
      databases: plan.dbLimit || 0,
      backups: plan.backupLimit || 0,
      allocations: plan.slots || 1,
    },
  };

  if (actualNestId) payload.nest = actualNestId;

  if (allocationId) {
    payload.allocation = {
      default: parseInt(allocationId),
    };
  } else if (selectedNodeId) {
    payload.deploy = {
      locations: [parseInt(selectedNodeId)],
      dedicated_ip: false,
      port_range: ["60000-60100"],
    };
  }

  console.log(
    "Creating server with payload:",
    JSON.stringify(payload, null, 2),
  );

  try {
    const response = await client.post("/servers", payload);
    console.log("Server created successfully:", response.data.attributes?.id);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      console.error(
        "Pterodactyl API error details:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw error;
  }
}

/**
 * Удалить сервер
 */
export async function deletePteroServer(pteroServerId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.delete(`/servers/${pteroServerId}`);
}

/**
 * Получить статус сервера
 */
export async function getServerStatus(pteroServerId) {
  const config = await getConfig();
  const client = getClient(config);

  try {
    const response = await client.get(
      `/servers/${pteroServerId}?include=resources`,
    );
    const attrs = response.data.attributes || {};

    if (attrs.isInstalling) return "installing";
    if (attrs.isReinstalling) return "reinstalling";
    if (attrs.state === "running") return "running";
    if (attrs.state === "offline") return "offline";

    return "offline";
  } catch (error) {
    return "offline";
  }
}
