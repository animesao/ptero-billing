import axios from "axios";
import https from "https";
import { db } from "../db.js";
import { settings, kernels } from "../schema.js";
import { eq } from "drizzle-orm";

// Кэш для клиентов
const clientCache = new Map();

/**
 * Получить конфигурацию Pterodactyl
 */
export async function getConfig() {
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
export function getClient(config, instanceId = null) {
  const cacheKey = instanceId || "default";

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }

  let url = config["ptero_url"] || "";
  let key = config["ptero_api_key"] || "";

  if (instanceId) {
    const instanceUrl = config[`ptero_url_${instanceId}`];
    const instanceKey = config[`ptero_api_key_${instanceId}`];
    if (instanceUrl) url = instanceUrl;
    if (instanceKey) key = instanceKey;
  }

  const client = axios.create({
    baseURL: url.replace(/\/+$/, "") + "/api/application",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 60000,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

  clientCache.set(cacheKey, client);
  return client;
}

export function clearClientCache() {
  clientCache.clear();
}

/**
 * Получить дефолтное значение для переменной окружения
 */
function getDefaultValueForVariable(varName) {
  const upper = varName.toUpperCase();
  const lower = varName.toLowerCase();

  // Файлы
  if (upper.match(/^(SERVER_)?JARFILE$|JAR_FILE$/)) return "server.jar";
  if (upper.match(/^(SERVER_)?PY_FILE$|PYTHON_FILE$/)) return "main.py";
  if (upper.match(/^(SERVER_)?JS_FILE$|NODE_FILE$/)) return "index.js";
  if (upper === "REQUIREMENTS_FILE") return "requirements.txt";
  if (upper === "CONFIG_FILE") return "config.json";
  if (upper === "GIT_REPOSITORY") return "https://github.com/user/repo.git";
  if (upper === "GIT_BRANCH") return "main";

  // Версии
  if (upper === "BUILD_NUMBER") return "latest";
  if (upper === "VANILLA_VERSION") return "latest";
  if (upper === "SPONGE_VERSION") return "latest";
  if (upper === "MINECRAFT_VERSION" || upper === "MC_VERSION") return "1.20.4";
  if (upper === "PAPER_VERSION") return "latest";
  if (upper === "SPIGOT_VERSION") return "latest";
  if (upper === "FORGE_VERSION") return "latest";
  if (upper === "FABRIC_VERSION") return "latest";
  if (upper === "VELOCITY_VERSION") return "latest";
  if (upper === "BUNGEE_VERSION") return "latest";
  if (upper === "JAVA_VERSION") return "21";
  if (upper === "PYTHON_VERSION") return "3.13";
  if (upper === "PHP_VERSION") return "8.3";
  if (upper === "NODE_VERSION") return "20";
  if (lower.includes("version")) return "latest";

  // Флаги
  if (upper.includes("STATUS")) return "1";
  if (upper.includes("ENABLE") || upper.includes("USE")) return "0";
  if (upper.includes("AUTOUPDATE")) return "1";
  if (upper.includes("DEBUG")) return "0";

  // Сеть
  if (upper.includes("PORT")) return "25565";
  if (upper.includes("IP") || upper.includes("HOST")) return "0.0.0.0";
  if (
    upper.includes("TOKEN") ||
    upper.includes("KEY") ||
    upper.includes("SECRET")
  )
    return "";
  if (upper.includes("EMAIL")) return "admin@example.com";

  // Ресурсы
  if (upper.includes("MEMORY") || upper.includes("RAM")) return "1024";
  if (upper.includes("CPU")) return "100";
  if (upper.includes("DISK")) return "5120";

  // Общее
  if (upper.includes("MAP") || upper.includes("WORLD")) return "latest";
  if (
    upper.includes("NAME") ||
    upper.includes("TITLE") ||
    upper.includes("SESSION")
  )
    return "Server";
  if (upper.includes("PASSWORD") || upper.includes("PASSWD")) return "";

  return "latest";
}

/**
 * Извлечь переменные из startup строки
 */
function extractVariablesFromStartup(startup) {
  if (!startup) return [];

  const variables = new Set();
  const matches1 = startup.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/gi);
  const matches2 = startup.match(/\$\{([A-Z_][A-Z0-9_]*)\}/gi);

  if (matches1)
    matches1.forEach((m) =>
      variables.add(m.replace("{{", "").replace("}}", "")),
    );
  if (matches2)
    matches2.forEach((m) =>
      variables.add(m.replace("${", "").replace("}", "")),
    );

  return Array.from(variables).map((name) => ({
    env_variable: name,
    default_value: getDefaultValueForVariable(name),
  }));
}

/**
 * Построить переменные окружения из БД или startup
 */
async function buildEnvironment(kernelId, startup) {
  const environment = {};

  // Пытаемся получить из БД
  if (kernelId) {
    try {
      const [kernel] = await db
        .select()
        .from(kernels)
        .where(eq(kernels.id, parseInt(kernelId)));

      if (kernel && kernel.environment) {
        try {
          const parsed =
            typeof kernel.environment === "string"
              ? JSON.parse(kernel.environment)
              : kernel.environment;

          if (parsed && typeof parsed === "object") {
            Object.assign(environment, parsed);
            console.log("Loaded environment from kernel DB:", environment);
            return environment;
          }
        } catch (e) {
          console.log("Failed to parse kernel environment, using startup");
        }
      }
    } catch (error) {
      console.error("Error loading kernel from DB:", error.message);
    }
  }

  // Генерируем из startup
  if (startup) {
    const extractedVars = extractVariablesFromStartup(startup);
    for (const variable of extractedVars) {
      environment[variable.env_variable] =
        variable.default_value ||
        getDefaultValueForVariable(variable.env_variable);
    }
    console.log("Generated environment from startup:", environment);
  }

  return environment;
}

/**
 * Получить переменные окружения из Pterodactyl API
 */
async function getEggVariablesFromPterodactyl(client, nestId, eggId) {
  try {
    // Получаем яйцо с переменными
    const response = await client.get(`/nests/${nestId}/eggs/${eggId}`);
    const attributes = response.data.attributes || {};

    // Переменные могут быть в attributes.variables
    const variables = attributes.variables || [];

    console.log("Pterodactyl egg variables raw:", JSON.stringify(variables));

    const envVars = {};
    for (const v of variables) {
      const envVar = v.env_variable || v.environment_variable;
      const defaultValue = v.default_value || v.default || "latest";
      const required = v.required || false;

      if (envVar) {
        // Для required переменных используем значение по умолчанию
        if (required) {
          envVars[envVar] = defaultValue;
        } else {
          envVars[envVar] = defaultValue || "";
        }
      }
    }

    // Если переменных нет в attributes.variables, пробуем извлечь из startup
    if (Object.keys(envVars).length === 0 && attributes.startup) {
      const startup = attributes.startup;
      const matches = startup.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/gi);
      if (matches) {
        for (const match of matches) {
          const varName = match.replace("{{", "").replace("}}", "");
          envVars[varName] = getDefaultValueForVariable(varName);
        }
      }
    }

    console.log("✅ Got egg variables from Pterodactyl:", envVars);
    return envVars;
  } catch (error) {
    console.error("Failed to get egg variables:", error.message);
    return null;
  }
}

/**
 * Найти ноду для развёртывания
 */
async function selectNode(client, plan) {
  try {
    // Если в плане указаны конкретные ноды
    if (plan.nodeIds) {
      try {
        const nodeIdsArray = JSON.parse(plan.nodeIds);
        if (Array.isArray(nodeIdsArray) && nodeIdsArray.length > 0) {
          const selectedId =
            nodeIdsArray[Math.floor(Math.random() * nodeIdsArray.length)];
          console.log("Selected random node from nodeIds:", selectedId);
          return selectedId;
        }
      } catch (e) {
        console.error("Failed to parse nodeIds:", e);
      }
    }

    // Если указана одна нода
    if (plan.nodeId) {
      console.log("Using nodeId from plan:", plan.nodeId);
      return plan.nodeId;
    }

    // Выбираем наименее загруженную
    const nodesResponse = await client.get("/nodes", {
      params: { per_page: 100 },
    });
    const nodes = nodesResponse.data.data || [];

    const nodesWithLoad = await Promise.all(
      nodes.map(async (node) => {
        try {
          const nodeId = node.attributes.id;
          const serversResponse = await client.get(`/nodes/${nodeId}/servers`, {
            params: { per_page: 1 },
          });
          const totalServers =
            serversResponse.data.meta?.pagination?.total || 0;

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

    const availableNodes = nodesWithLoad.filter((n) => !n.isUnderMaintenance);
    availableNodes.sort((a, b) => a.load - b.load);

    if (availableNodes.length > 0) {
      const leastLoaded = availableNodes[0];
      console.log(
        `Selected least loaded node: ${leastLoaded.name} (load: ${leastLoaded.load})`,
      );
      return leastLoaded.id;
    }
  } catch (error) {
    console.error("Error selecting node:", error.message);
  }

  return null;
}

/**
 * Получить свободную аллокацию на ноде
 */
async function getFreeAllocation(client, nodeId) {
  try {
    const allocationsResponse = await client.get(
      `/nodes/${nodeId}/allocations`,
      { params: { per_page: 500 } },
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
 * Создать сервер Pterodactyl
 * Использует данные из БД (games/kernels) вместо обращения к Pterodactyl API
 */
export async function createPteroServer({
  name,
  userId,
  plan,
  pteroUserId,
  serverNameOverride,
  pteroInstanceId = null,
  kernelId = null, // ID ядра из БД
}) {
  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);

  console.log("=== CREATING SERVER ===");
  console.log("Plan:", JSON.stringify(plan, null, 2));
  console.log("Kernel ID:", kernelId);
  console.log("Ptero User ID:", pteroUserId);

  // 1. Определяем nestId и eggId
  let actualNestId = plan.nestId;
  let actualEggId = plan.eggId;
  let dockerImage = plan.dockerImage;
  let startup = plan.startup;
  let environment = plan.environment;

  // Если указан kernelId, получаем данные из БД
  if (kernelId) {
    try {
      const [kernel] = await db
        .select()
        .from(kernels)
        .where(eq(kernels.id, parseInt(kernelId)));

      if (kernel) {
        console.log("Using kernel from DB:", kernel.name);
        console.log("Kernel data:", JSON.stringify(kernel, null, 2));

        // Используем данные ядра если они не указаны в плане
        if (!actualNestId) actualNestId = kernel.pteroNestId;
        if (!actualEggId) actualEggId = kernel.pteroEggId;
        if (!dockerImage) dockerImage = kernel.dockerImage;
        if (!startup) startup = kernel.startup;
        if (!environment) environment = kernel.environment;
      } else {
        console.log("Kernel not found in DB for ID:", kernelId);
      }
    } catch (error) {
      console.error("Error loading kernel from DB:", error.message);
    }
  }

  console.log("Final values:");
  console.log("  nestId:", actualNestId);
  console.log("  eggId:", actualEggId);
  console.log("  dockerImage:", dockerImage);
  console.log("  startup:", startup);

  // Проверяем что все данные есть
  if (!actualNestId || !actualEggId) {
    const errorMsg = `Не указаны nestId или eggId. nestId=${actualNestId}, eggId=${actualEggId}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 2. Строим переменные окружения
  let finalEnvironment = {};

  // Пытаемся получить из БД (из плана или ядра)
  if (environment) {
    try {
      const parsed =
        typeof environment === "string" ? JSON.parse(environment) : environment;

      if (
        parsed &&
        typeof parsed === "object" &&
        Object.keys(parsed).length > 0
      ) {
        finalEnvironment = parsed;
        console.log("✅ Loaded environment from DB:", finalEnvironment);
      }
    } catch (e) {
      console.log("Failed to parse environment from DB:", e.message);
    }
  }

  // Если нет переменных из БД, получаем из Pterodactyl API
  if (Object.keys(finalEnvironment).length === 0) {
    console.log("⚙️ Getting variables from Pterodactyl API...");
    const pteroVars = await getEggVariablesFromPterodactyl(
      client,
      actualNestId,
      actualEggId,
    );
    if (pteroVars && Object.keys(pteroVars).length > 0) {
      finalEnvironment = pteroVars;
      console.log("✅ Got environment from Pterodactyl:", finalEnvironment);
    }
  }

  // Если всё ещё нет, генерируем из startup
  if (Object.keys(finalEnvironment).length === 0 && startup) {
    console.log("⚙️ Generating environment from startup...");
    finalEnvironment = await buildEnvironment(null, startup);
  }

  // Если всё ещё нет, используем дефолтные для Java
  if (Object.keys(finalEnvironment).length === 0) {
    console.log("⚙️ Using default Java environment");
    finalEnvironment = {
      SERVER_JARFILE: "server.jar",
      BUILD_NUMBER: "latest",
    };
  }

  console.log("✅ Final environment:", JSON.stringify(finalEnvironment));

  // 3. Выбираем ноду
  const selectedNodeId = await selectNode(client, plan);
  if (!selectedNodeId) {
    throw new Error("No available nodes for server deployment");
  }

  console.log("Selected node ID:", selectedNodeId);

  // 4. Получаем аллокацию
  let allocationId = plan.allocationId;
  if (!allocationId) {
    allocationId = await getFreeAllocation(client, parseInt(selectedNodeId));
    if (allocationId) {
      console.log("Auto-selected allocation ID:", allocationId);
    }
  }

  // 5. Формируем payload
  const payload = {
    name: serverNameOverride || name,
    user: parseInt(pteroUserId),
    egg: parseInt(actualEggId),
    docker_image: dockerImage || "ghcr.io/parkervcp/yolks:java_21",
    startup:
      startup || "java -Xms128M -Xmx${SERVER_MEMORY}M -jar ${SERVER_JARFILE}",
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

  // Добавляем аллокацию или deploy конфигурацию
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
    console.log("Using deploy mode with node:", selectedNodeId);
  }

  console.log("Final payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await client.post("/servers", payload);
    const serverId = response.data.attributes?.id;
    const identifier = response.data.attributes?.identifier;
    console.log("✅ Server created successfully!");
    console.log("  Server ID:", serverId);
    console.log("  Identifier:", identifier);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to create server:");
    if (error.response?.data) {
      console.error(
        "Pterodactyl API error:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.error("Error:", error.message);
    }
    throw error;
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
