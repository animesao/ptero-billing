import axios from "axios";
import https from "https";
import { db } from "../db.js";
import { settings } from "../schema.js";
import { eq } from "drizzle-orm";

// Кэш для клиентов (один клиент на инстанс Pterodactyl)
const clientCache = new Map();

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
 * Создать или получить HTTP клиент для Pterodactyl API
 * Поддерживает мульти-инстансы через ptero_instance_id в плане
 */
function getClient(config, instanceId = null) {
  const cacheKey = instanceId || "default";

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }

  let url = config["ptero_url"] || "";
  let key = config["ptero_api_key"] || "";

  // Если указан instanceId, пробуем получить специфичные настройки
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
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Очистить кэш клиентов (для обновления настроек)
 */
export function clearClientCache() {
  clientCache.clear();
}

/**
 * Получить все переменные яйца из Pterodactyl API
 */
async function getEggVariables(client, nestId, eggId) {
  const allVariables = [];

  try {
    // Метод 1: Прямой endpoint /variables (Pterodactyl 2.x)
    try {
      const varsResponse = await client.get(
        `/nests/${nestId}/eggs/${eggId}/variables`,
      );
      console.log(
        "Variables endpoint response:",
        JSON.stringify({
          status: varsResponse.status,
          hasData: !!varsResponse.data,
          dataIsArray: Array.isArray(varsResponse.data),
          dataLength: varsResponse.data?.length,
        }),
      );

      if (varsResponse.data && Array.isArray(varsResponse.data)) {
        for (const item of varsResponse.data) {
          // Pterodactyl 2.x возвращает плоский массив
          const envVar = item.environment_variable || item.env_variable;
          if (envVar) {
            allVariables.push({
              env_variable: envVar,
              default_value: item.default_value ?? item.default ?? "",
              required: item.required ?? false,
            });
          }
        }
        console.log(
          `Got ${allVariables.length} variables from /variables endpoint (v2)`,
        );
      } else if (
        varsResponse.data?.data &&
        Array.isArray(varsResponse.data.data)
      ) {
        // Pterodactyl 1.x возвращает { data: [...] }
        for (const item of varsResponse.data.data) {
          const attrs = item.attributes || {};
          const envVar = attrs.environment_variable || attrs.env_variable;
          if (envVar) {
            allVariables.push({
              env_variable: envVar,
              default_value: attrs.default_value ?? attrs.default ?? "",
              required: attrs.required ?? false,
            });
          }
        }
        console.log(
          `Got ${allVariables.length} variables from /variables endpoint (v1)`,
        );
      }
    } catch (e) {
      console.log(`Variables endpoint not available: ${e.message}`);
    }

    // Метод 2: Получаем яйцо с полными relationships
    if (allVariables.length === 0) {
      try {
        const response = await client.get(
          `/nests/${nestId}/eggs/${eggId}?include=eggVariables`,
          { params: { per_page: 100 } },
        );
        console.log(
          "Egg response with include:",
          JSON.stringify({
            hasIncluded: !!response.data.included,
            includedCount: response.data.included?.length,
            hasRelationships: !!response.data.relationships,
            relationships: response.data.relationships
              ? Object.keys(response.data.relationships)
              : [],
          }),
        );

        // Проверяем included
        if (response.data.included && Array.isArray(response.data.included)) {
          for (const item of response.data.included) {
            if (item.type === "egg_variable") {
              const envVar =
                item.attributes?.environment_variable ||
                item.attributes?.env_variable;
              if (envVar) {
                allVariables.push({
                  env_variable: envVar,
                  default_value: item.attributes?.default_value ?? "",
                  required: item.attributes?.required ?? false,
                });
              }
            }
          }
        }

        // Проверяем relationships.eggVariables
        if (response.data.relationships?.eggVariables?.data) {
          for (const ref of response.data.relationships.eggVariables.data) {
            const varItem = response.data.included?.find(
              (inc) => inc.type === "egg_variable" && inc.id === ref.id,
            );
            if (varItem?.attributes) {
              const envVar =
                varItem.attributes?.environment_variable ||
                varItem.attributes?.env_variable;
              if (envVar) {
                allVariables.push({
                  env_variable: envVar,
                  default_value: varItem.attributes?.default_value ?? "",
                  required: varItem.attributes?.required ?? false,
                });
              }
            }
          }
        }

        if (allVariables.length > 0) {
          console.log(
            `Got ${allVariables.length} variables from include=eggVariables`,
          );
        }
      } catch (e) {
        console.log(`Include eggVariables not available: ${e.message}`);
      }
    }

    // Метод 3: attributes.variables (старый формат)
    if (allVariables.length === 0) {
      const eggResponse = await client.get(`/nests/${nestId}/eggs/${eggId}`);
      if (
        eggResponse.data.attributes?.variables &&
        Array.isArray(eggResponse.data.attributes.variables)
      ) {
        for (const v of eggResponse.data.attributes.variables) {
          const envVar = v.env_variable || v.environment_variable;
          if (envVar) {
            allVariables.push({
              env_variable: envVar,
              default_value: v.default_value ?? v.default ?? "",
              required: v.required ?? false,
            });
          }
        }
        console.log(
          `Got ${allVariables.length} variables from attributes.variables`,
        );
      }
    }

    // Метод 4: Извлечение из startup
    if (allVariables.length === 0) {
      const eggResponse = await client.get(`/nests/${nestId}/eggs/${eggId}`);
      const startup = eggResponse.data.attributes?.startup;
      if (startup) {
        const extracted = extractVariablesFromStartup(startup);
        allVariables.push(...extracted);
        console.log(`Extracted ${allVariables.length} variables from startup`);
      }
    }

    // Метод 5: Для известных яиц ДОБАВЛЯЕМ недостающие переменные
    // Получаем имя яйца если ещё не получили
    let eggName = "";
    if (allVariables.length > 0) {
      // Уже есть переменные, но нужно проверить имя яйца для добавления недостающих
      try {
        const eggResponse = await client.get(`/nests/${nestId}/eggs/${eggId}`);
        eggName = eggResponse.data.attributes?.name?.toLowerCase() || "";
      } catch (e) {
        // Игнорируем ошибку
      }
    }

    // Добавляем специфичные переменные для известных яиц
    const existingVarNames = allVariables.map((v) => v.env_variable);

    if (eggName.includes("sponge")) {
      if (!existingVarNames.includes("SPONGE_VERSION")) {
        allVariables.push({
          env_variable: "SPONGE_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added SPONGE_VERSION for Sponge egg");
      }
      if (!existingVarNames.includes("SERVER_JARFILE")) {
        allVariables.push({
          env_variable: "SERVER_JARFILE",
          default_value: "server.jar",
          required: true,
        });
      }
    } else if (eggName.includes("paper")) {
      if (!existingVarNames.includes("PAPER_VERSION")) {
        allVariables.push({
          env_variable: "PAPER_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added PAPER_VERSION for Paper egg");
      }
      if (!existingVarNames.includes("BUILD_NUMBER")) {
        allVariables.push({
          env_variable: "BUILD_NUMBER",
          default_value: "latest",
          required: true,
        });
        console.log("Added BUILD_NUMBER for Paper egg");
      }
    } else if (eggName.includes("spigot")) {
      if (!existingVarNames.includes("SPIGOT_VERSION")) {
        allVariables.push({
          env_variable: "SPIGOT_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added SPIGOT_VERSION for Spigot egg");
      }
      if (!existingVarNames.includes("BUILD_NUMBER")) {
        allVariables.push({
          env_variable: "BUILD_NUMBER",
          default_value: "latest",
          required: true,
        });
      }
    } else if (eggName.includes("forge")) {
      if (!existingVarNames.includes("FORGE_VERSION")) {
        allVariables.push({
          env_variable: "FORGE_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added FORGE_VERSION for Forge egg");
      }
      if (!existingVarNames.includes("MINECRAFT_VERSION")) {
        allVariables.push({
          env_variable: "MINECRAFT_VERSION",
          default_value: "latest",
          required: true,
        });
      }
    } else if (eggName.includes("fabric")) {
      if (!existingVarNames.includes("FABRIC_VERSION")) {
        allVariables.push({
          env_variable: "FABRIC_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added FABRIC_VERSION for Fabric egg");
      }
      if (!existingVarNames.includes("MINECRAFT_VERSION")) {
        allVariables.push({
          env_variable: "MINECRAFT_VERSION",
          default_value: "latest",
          required: true,
        });
      }
    } else if (eggName.includes("bungee")) {
      if (!existingVarNames.includes("BUNGEE_VERSION")) {
        allVariables.push({
          env_variable: "BUNGEE_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added BUNGEE_VERSION for Bungee egg");
      }
      if (!existingVarNames.includes("BUILD_NUMBER")) {
        allVariables.push({
          env_variable: "BUILD_NUMBER",
          default_value: "latest",
          required: true,
        });
      }
    } else if (eggName.includes("velocity")) {
      if (!existingVarNames.includes("VELOCITY_VERSION")) {
        allVariables.push({
          env_variable: "VELOCITY_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added VELOCITY_VERSION for Velocity egg");
      }
    } else if (eggName.includes("vanilla")) {
      if (!existingVarNames.includes("VANILLA_VERSION")) {
        allVariables.push({
          env_variable: "VANILLA_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added VANILLA_VERSION for Vanilla egg");
      }
    } else if (eggName.includes("bukkit")) {
      if (!existingVarNames.includes("BUKKIT_VERSION")) {
        allVariables.push({
          env_variable: "BUKKIT_VERSION",
          default_value: "latest",
          required: true,
        });
        console.log("Added BUKKIT_VERSION for Bukkit egg");
      }
    }

    // Логирование всех найденных переменных
    if (allVariables.length > 0) {
      console.log(
        "All variables found:",
        JSON.stringify(allVariables, null, 2),
      );
    }
  } catch (error) {
    console.error("Error getting egg variables:", error.message);
  }

  return allVariables;
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
    required: true,
  }));
}

/**
 * Получить дефолтное значение для переменной
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
  if (upper === "COMPOSER_FILE") return "composer.json";
  if (upper === "GIT_REPOSITORY") return "https://github.com/user/repo.git";
  if (upper === "GIT_BRANCH") return "main";
  if (upper === "CRON_CONFIG_FILE") return "crontab.txt";

  // Версии ПО
  if (upper === "BUILD_NUMBER") return "latest";
  if (upper === "BUILD_TYPE") return "release";
  if (upper === "VANILLA_VERSION") return "latest";
  if (upper === "SPONGE_VERSION") return "latest";
  if (upper === "MINECRAFT_VERSION" || upper === "MC_VERSION") return "1.20.4";
  if (upper === "PAPER_VERSION") return "latest";
  if (upper === "SPIGOT_VERSION") return "latest";
  if (upper === "FORGE_VERSION") return "latest";
  if (upper === "FABRIC_VERSION") return "latest";
  if (upper === "VELOCITY_VERSION") return "latest";
  if (upper === "BUNGEE_VERSION") return "latest";
  if (upper === "WATERFALL_VERSION") return "latest";
  if (upper === "JAVA_VERSION") return "21";
  if (upper === "PYTHON_VERSION") return "3.13";
  if (upper === "PHP_VERSION") return "8.3";
  if (upper === "NODE_VERSION") return "20";
  if (upper === "WORDPRESS") return "latest";
  if (upper === "NGINX_VERSION") return "latest";
  if (upper === "MYSQL_VERSION") return "8.0";
  if (upper === "POSTGRES_VERSION") return "15";
  if (upper === "REDIS_VERSION") return "7";
  if (upper === "MONGODB_VERSION") return "7";
  if (lower.includes("version")) return "latest";

  // Флаги и статусы (AUTOUPDATE, ENABLE и т.д.)
  if (upper.includes("AUTOUPDATE_STATUS") || upper === "AUTOUPDATE_STATUS")
    return "1";
  if (upper.includes("AUTOUPDATE_FORCE") || upper === "AUTOUPDATE_FORCE")
    return "0";
  if (upper.includes("LOGCLEANER_STATUS") || upper === "LOGCLEANER_STATUS")
    return "0";
  if (upper.includes("GIT_STATUS") || upper === "GIT_STATUS") return "0";
  if (upper.includes("CLOUDFLARED_STATUS") || upper === "CLOUDFLARED_STATUS")
    return "0";
  if (upper.includes("COMPOSER_STATUS") || upper === "COMPOSER_STATUS")
    return "0";
  if (upper.includes("CRON_STATUS") || upper === "CRON_STATUS") return "0";
  if (upper.includes("CERTBOT_STATUS") || upper === "CERTBOT_STATUS")
    return "0";
  if (upper.includes("CERTBOT_STAGING") || upper === "CERTBOT_STAGING")
    return "0";
  if (
    upper.includes("CERTBOT_FORCE_RENEWAL") ||
    upper === "CERTBOT_FORCE_RENEWAL"
  )
    return "0";

  // USER_UPLOAD - файлы загружаются пользователем (0 = нет, 1 = да)
  if (upper === "USER_UPLOAD" || upper.includes("USER_UPLOAD")) return "0";

  if (upper.includes("UPDATE") || upper.includes("AUTO")) return "1";
  if (upper.includes("UPLOAD") || upper.includes("USER")) return "0";
  if (upper.includes("DEBUG")) return "0";
  if (
    upper.includes("ENABLE") ||
    upper.includes("USE") ||
    upper.includes("STATUS")
  )
    return "0";
  if (upper === "BATTLE_EYE") return "0";
  if (upper.includes("STAGING")) return "0";
  if (upper.includes("FORCE")) return "0";

  // Пакеты
  if (upper.includes("PACKAGES") || upper.includes("DEPENDENCIES")) return "";
  if (upper.includes("PIP") || upper.includes("NPM") || upper.includes("YARN"))
    return "";
  if (upper.includes("EXTENSIONS") || upper.includes("MODS")) return "";

  // Сеть
  if (upper.includes("PORT")) return "25565";
  if (upper.includes("IP") || upper.includes("HOST")) return "0.0.0.0";
  if (upper.includes("URL")) return "";
  if (
    upper.includes("TOKEN") ||
    upper.includes("KEY") ||
    upper.includes("SECRET")
  )
    return "";
  if (upper.includes("EMAIL")) return "admin@example.com";
  if (upper.includes("DOMAIN")) return "example.com";

  // Ресурсы
  if (upper.includes("MEMORY") || upper.includes("RAM")) return "1024";
  if (upper.includes("CPU")) return "100";
  if (upper.includes("DISK")) return "5120";

  // Ark
  if (upper === "SERVER_MAP") return "TheIsland";
  if (upper === "SESSION_NAME") return "Ark Server";
  if (upper === "ARK_PASSWORD") return "";
  if (upper === "ARK_ADMIN_PASSWORD") return "admin123";
  if (upper === "RCON_PORT") return "27015";
  if (upper === "QUERY_PORT") return "27016";

  // Общее
  if (upper.includes("MAP") || upper.includes("WORLD")) return "latest";
  if (
    upper.includes("NAME") ||
    upper.includes("TITLE") ||
    upper.includes("SESSION")
  )
    return "Server";
  if (upper.includes("PASSWORD") || upper.includes("PASSWD")) return "";
  if (upper.includes("ADMIN") || upper.includes("OWNER")) return "admin";

  return "latest";
}

/**
 * Найти nestId по eggId
 */
async function findNestId(client, eggId) {
  try {
    const nestsResponse = await client.get("/nests", {
      params: { per_page: 100 },
    });
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
        // Яйцо не в этом гнезде
      }
    }
  } catch (error) {
    console.error("Error finding nestId:", error.message);
  }
  return null;
}

/**
 * Получить все ноды с информацией о загрузке
 */
async function getAllNodesWithLoad(client) {
  try {
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
            memory: node.attributes.memory || 0,
            memoryOverallocate: node.attributes.memory_overallocate || 0,
            disk: node.attributes.disk || 0,
            diskOverallocate: node.attributes.disk_overallocate || 0,
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

    // Фильтруем ноды на обслуживании
    const availableNodes = nodesWithLoad.filter((n) => !n.isUnderMaintenance);

    // Сортируем по загрузке
    availableNodes.sort((a, b) => a.load - b.load);

    return availableNodes;
  } catch (error) {
    console.error("Error getting nodes:", error.message);
    return [];
  }
}

/**
 * Выбрать ноду для развёртывания
 * Приоритет: 1) nodeIds из плана, 2) наименее загруженная
 */
async function selectNode(client, plan) {
  // Если в плане указаны конкретные ноды
  if (plan.nodeIds) {
    try {
      const nodeIdsArray = JSON.parse(plan.nodeIds);
      if (Array.isArray(nodeIdsArray) && nodeIdsArray.length > 0) {
        // Проверяем доступность нод
        const allNodes = await getAllNodesWithLoad(client);
        const availableIds = allNodes
          .filter((n) => nodeIdsArray.includes(String(n.id)))
          .map((n) => n.id);

        if (availableIds.length > 0) {
          // Выбираем случайную из доступных
          const selectedId =
            availableIds[Math.floor(Math.random() * availableIds.length)];
          const node = allNodes.find((n) => n.id === selectedId);
          console.log(
            `Selected node from nodeIds: ${node?.name} (id: ${selectedId})`,
          );
          return selectedId;
        }

        // Если все ноды из списка недоступны, берём первую доступную
        if (allNodes.length > 0) {
          console.log(
            `All specified nodeIds unavailable, using least loaded: ${allNodes[0].name}`,
          );
          return allNodes[0].id;
        }
      }
    } catch (e) {
      console.error("Failed to parse nodeIds:", e);
    }
  }

  // Если указана одна нода
  if (plan.nodeId) {
    console.log(`Using nodeId from plan: ${plan.nodeId}`);
    return plan.nodeId;
  }

  // Выбираем наименее загруженную
  const allNodes = await getAllNodesWithLoad(client);
  if (allNodes.length > 0) {
    const leastLoaded = allNodes[0];
    console.log(
      `Selected least loaded node: ${leastLoaded.name} (load: ${leastLoaded.load})`,
    );
    return leastLoaded.id;
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

    // Выбираем случайную свободную аллокацию
    const random = free[Math.floor(Math.random() * free.length)];
    return random.attributes.id;
  } catch (error) {
    console.error("Error getting free allocation:", error.message);
    return null;
  }
}

/**
 * Построить переменные окружения для сервера
 */
function buildEnvironment(eggVariables, startup) {
  const environment = {};
  const processedVars = new Set();

  // Сначала используем переменные из яйца
  if (eggVariables && eggVariables.length > 0) {
    for (const variable of eggVariables) {
      if (variable.env_variable) {
        let defaultValue = variable.default_value;

        // Если значения по умолчанию нет, генерируем умное значение
        if (
          defaultValue === "" ||
          defaultValue === null ||
          defaultValue === undefined
        ) {
          defaultValue = getDefaultValueForVariable(variable.env_variable);
        }

        // Для required переменных всегда используем значение по умолчанию
        if (variable.required && !defaultValue) {
          defaultValue = getDefaultValueForVariable(variable.env_variable);
        }

        environment[variable.env_variable] = defaultValue;
        processedVars.add(variable.env_variable);
      }
    }
    console.log(
      `Built environment with ${Object.keys(environment).length} variables from egg`,
    );
  }

  // Извлекаем переменные из startup и добавляем недостающие
  if (startup) {
    const extractedVars = extractVariablesFromStartup(startup);
    for (const variable of extractedVars) {
      // Добавляем только если переменная ещё не обработана
      if (!processedVars.has(variable.env_variable)) {
        environment[variable.env_variable] =
          variable.default_value ||
          getDefaultValueForVariable(variable.env_variable);
        processedVars.add(variable.env_variable);
      }
    }
    console.log(
      `Built environment with ${Object.keys(environment).length} total variables (startup added ${extractedVars.filter((v) => !processedVars.has(v.env_variable)).length})`,
    );
  }

  console.log("Final environment:", JSON.stringify(environment));
  return environment;
}

/**
 * Получить информацию о яйце (startup, docker_image, name)
 */
async function getEggInfo(client, nestId, eggId) {
  try {
    const eggResponse = await client.get(`/nests/${nestId}/eggs/${eggId}`);
    const attrs = eggResponse.data.attributes || {};
    return {
      name: attrs.name || "",
      startup: attrs.startup || "",
      docker_image: attrs.docker_image || "",
    };
  } catch (error) {
    console.error("Error getting egg info:", error.message);
    return { name: "", startup: "", docker_image: "" };
  }
}

/**
 * Создать сервер Pterodactyl
 * Поддерживает мульти-ноды и мульти-инстансы Pterodactyl
 */
export async function createPteroServer({
  name,
  userId,
  plan,
  pteroUserId,
  serverNameOverride,
  pteroInstanceId = null, // ID инстанса Pterodactyl (для мульти-панели)
}) {
  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);

  console.log(
    "Creating server with plan:",
    JSON.stringify({
      id: plan.id,
      name: plan.name,
      eggId: plan.eggId,
      nestId: plan.nestId,
      nodeIds: plan.nodeIds,
      pteroInstanceId,
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

  if (!actualNestId) {
    throw new Error("Could not determine nestId for egg");
  }

  if (!plan.eggId) {
    throw new Error("eggId is required");
  }

  // 2. Получаем информацию о яйце
  const eggInfo = await getEggInfo(client, actualNestId, plan.eggId);
  console.log("Got egg info:", JSON.stringify(eggInfo));

  // 3. Получаем переменные яйца
  const eggVariables = await getEggVariables(client, actualNestId, plan.eggId);
  console.log("Got egg variables:", JSON.stringify(eggVariables));

  // 4. Строим переменные окружения
  const environment = buildEnvironment(eggVariables, eggInfo.startup);
  console.log("Environment variables:", JSON.stringify(environment));

  // 5. Выбираем ноду
  const selectedNodeId = await selectNode(client, plan);
  if (!selectedNodeId) {
    throw new Error("No available nodes for server deployment");
  }

  // 6. Получаем аллокацию
  let allocationId = plan.allocationId;
  if (!allocationId) {
    allocationId = await getFreeAllocation(client, parseInt(selectedNodeId));
    if (allocationId) {
      console.log("Auto-selected allocation ID:", allocationId);
    }
  }

  // 7. Формируем payload
  const payload = {
    name: serverNameOverride || name,
    user: parseInt(pteroUserId),
    egg: parseInt(plan.eggId),
    docker_image: eggInfo.docker_image || "ghcr.io/parkervcp/yolks:java_21",
    startup: eggInfo.startup,
    environment: environment,
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
  } else {
    payload.deploy = {
      locations: [parseInt(selectedNodeId)],
      dedicated_ip: false,
      port_range: ["60000-60100"],
    };
  }

  console.log(
    "Creating server with payload:",
    JSON.stringify(
      {
        ...payload,
        environment: `{${Object.keys(payload.environment).length} variables}`,
      },
      null,
      2,
    ),
  );

  try {
    const response = await client.post("/servers", payload);
    const serverId = response.data.attributes?.id;
    console.log("Server created successfully:", serverId);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      console.error(
        "Pterodactyl API error:",
        JSON.stringify(error.response.data, null, 2),
      );
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

    return "offline";
  } catch (error) {
    return "offline";
  }
}

/**
 * Получить список всех нод (для админки)
 */
export async function getAllNodes(pteroInstanceId = null) {
  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);
  return await getAllNodesWithLoad(client);
}

/**
 * Получить список всех яиц (для админки)
 */
export async function getAllEggs(pteroInstanceId = null) {
  const config = await getConfig();
  const client = getClient(config, pteroInstanceId);

  try {
    const nestsResponse = await client.get("/nests", {
      params: { per_page: 100 },
    });
    const nests = nestsResponse.data.data || [];

    const allEggs = [];
    for (const nest of nests) {
      try {
        const eggsResponse = await client.get(
          `/nests/${nest.attributes.id}/eggs`,
          { params: { per_page: 100 } },
        );
        const eggs = eggsResponse.data.data || [];
        for (const egg of eggs) {
          allEggs.push({
            id: egg.attributes.id,
            nestId: nest.attributes.id,
            name: egg.attributes.name,
            docker_image: egg.attributes.docker_image,
          });
        }
      } catch (e) {
        // Ошибка получения яиц для этого гнезда
      }
    }

    return allEggs;
  } catch (error) {
    console.error("Error getting eggs:", error.message);
    return [];
  }
}
