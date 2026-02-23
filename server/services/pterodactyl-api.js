import axios from "axios";
import https from "https";
import { db } from "../db.js";
import { settings, kernels, games } from "../schema.js";
import { eq } from "drizzle-orm";

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
 * Получить все гнёзда с полными данными о яйцах и переменных
 */
export async function getAllNestsWithEggsAndVariables() {
  try {
    const config = await getConfig();
    const client = getClient(config);

    console.log("=== FETCHING ALL NESTS WITH EGGS ===");

    // Получаем все гнёзда
    const nestsResponse = await client.get("/nests?per_page=100");
    const nests = nestsResponse.data.data || [];

    console.log(`Found ${nests.length} nests`);

    const result = [];

    for (const nest of nests) {
      const nestId = nest.attributes.id;
      const nestName = nest.attributes.name;

      console.log(`\nProcessing nest: ${nestName} (id: ${nestId})`);

      // Получаем все яйца из гнезда
      const eggsResponse = await client.get(
        `/nests/${nestId}/eggs?per_page=100`,
      );
      const eggs = eggsResponse.data.data || [];

      console.log(`  Found ${eggs.length} eggs`);

      const eggsWithVars = [];

      for (const egg of eggs) {
        const eggId = egg.attributes.id;
        const eggName = egg.attributes.name;

        console.log(`  \n  Getting egg details: ${eggName} (id: ${eggId})`);

        // Получаем полное яйцо с переменными через include (как в CTRL Panel)
        const eggDetailResponse = await client.get(
          `/nests/${nestId}/eggs/${eggId}?include=eggVariables`,
        );
        const eggDetail = eggDetailResponse.data;
        const attrs = eggDetail.attributes || {};

        console.log(
          `    Startup: ${attrs.startup?.substring(0, 100) || "N/A"}...`,
        );
        console.log(`    Docker: ${attrs.docker_image || "N/A"}`);

        // Получаем переменные из разных источников
        const environmentVars = {};

        // 1. Пробуем получить через include (Pterodactyl 1.x - как в CTRL Panel)
        if (eggDetail.included && Array.isArray(eggDetail.included)) {
          console.log(
            `    ✅ Got ${eggDetail.included.length} variables from include=eggVariables`,
          );
          for (const item of eggDetail.included) {
            if (item.type === "egg_variable") {
              const envVar =
                item.attributes?.environment_variable ||
                item.attributes?.env_variable;
              const defaultValue =
                item.attributes?.default_value ||
                item.attributes?.default ||
                "latest";
              const required = item.attributes?.required || false;
              if (envVar) {
                environmentVars[envVar] = defaultValue;
                console.log(
                  `      ${envVar} = ${defaultValue}${required ? " (required)" : ""}`,
                );
              }
            }
          }
        }

        // 2. attributes.variables (прямой ответ)
        if (
          Object.keys(environmentVars).length === 0 &&
          attrs.variables &&
          Array.isArray(attrs.variables)
        ) {
          console.log(
            `    Got ${attrs.variables.length} variables from attributes.variables`,
          );
          for (const v of attrs.variables) {
            const envVar = v.env_variable || v.environment_variable;
            const defaultValue = v.default_value || v.default || "latest";
            if (envVar) {
              environmentVars[envVar] = defaultValue;
            }
          }
        }

        // 3. attributes.meta.variables (Pterodactyl 2.x)
        if (
          Object.keys(environmentVars).length === 0 &&
          attrs.meta?.variables
        ) {
          console.log(`    Got variables from meta.variables`);
          for (const v of attrs.meta.variables) {
            const envVar = v.env_variable || v.environment_variable;
            const defaultValue = v.default_value || v.default || "latest";
            if (envVar) {
              environmentVars[envVar] = defaultValue;
            }
          }
        }

        // 4. Извлекаем из startup строки если ничего не нашли
        if (Object.keys(environmentVars).length === 0 && attrs.startup) {
          const matches = attrs.startup.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/gi);
          if (matches) {
            console.log(
              `    Extracted ${matches.length} variables from startup`,
            );
            for (const match of matches) {
              const varName = match.replace("{{", "").replace("}}", "");
              environmentVars[varName] = getDefaultValueForVariable(varName);
            }
          }
        }

        // Добавляем недостающие переменные для известных яиц
        addMissingVariablesForEgg(eggName, environmentVars);

        console.log(
          `    📦 Final variables (${Object.keys(environmentVars).length}):`,
          Object.keys(environmentVars).join(", "),
        );

        eggsWithVars.push({
          id: eggId,
          name: eggName,
          description: attrs.description || "",
          docker_image: attrs.docker_image,
          startup: attrs.startup,
          variables: environmentVars,
        });
      }

      result.push({
        id: nestId,
        name: nestName,
        description: nest.attributes.description || "",
        eggs: eggsWithVars,
      });
    }

    console.log(`\n=== SYNC COMPLETE ===`);
    console.log(`Total nests: ${result.length}`);
    console.log(
      `Total eggs: ${result.reduce((sum, n) => sum + n.eggs.length, 0)}`,
    );

    return result;
  } catch (error) {
    console.error("Error fetching nests:", error.message);
    return [];
  }
}

/**
 * Добавить недостающие переменные для известных яиц
 */
function addMissingVariablesForEgg(eggName, environmentVars) {
  const name = eggName.toLowerCase();

  // SERVER_JARFILE всегда должен быть server.jar
  if (environmentVars["SERVER_JARFILE"] === "latest") {
    environmentVars["SERVER_JARFILE"] = "server.jar";
  }

  // Vanilla Minecraft
  if (name.includes("vanilla") && name.includes("minecraft")) {
    if (!environmentVars["VANILLA_VERSION"]) {
      environmentVars["VANILLA_VERSION"] = "1.20.4";
    }
  }

  // Paper
  if (name.includes("paper")) {
    if (!environmentVars["PAPER_VERSION"]) {
      environmentVars["PAPER_VERSION"] = "latest";
    }
    if (!environmentVars["BUILD_NUMBER"]) {
      environmentVars["BUILD_NUMBER"] = "latest";
    }
  }

  // Forge
  if (name.includes("forge")) {
    if (!environmentVars["MC_VERSION"]) {
      environmentVars["MC_VERSION"] = "1.20.4";
    }
    if (!environmentVars["BUILD_TYPE"]) {
      environmentVars["BUILD_TYPE"] = "recommended";
    }
    if (!environmentVars["FORGE_VERSION"]) {
      environmentVars["FORGE_VERSION"] = "latest";
    }
  }

  // Fabric
  if (name.includes("fabric")) {
    if (!environmentVars["MC_VERSION"]) {
      environmentVars["MC_VERSION"] = "1.20.4";
    }
    if (!environmentVars["FABRIC_VERSION"]) {
      environmentVars["FABRIC_VERSION"] = "latest";
    }
  }

  // Bungeecord
  if (name.includes("bungee")) {
    if (!environmentVars["BUNGEE_VERSION"]) {
      environmentVars["BUNGEE_VERSION"] = "latest";
    }
  }

  // Velocity
  if (name.includes("velocity")) {
    if (!environmentVars["VELOCITY_VERSION"]) {
      environmentVars["VELOCITY_VERSION"] = "latest";
    }
  }

  // Sponge
  if (name.includes("sponge")) {
    if (!environmentVars["SPONGE_VERSION"]) {
      environmentVars["SPONGE_VERSION"] = "latest";
    }
  }

  // Garrys Mod
  if (name.includes("garry") || name.includes("mod")) {
    if (!environmentVars["SRCDS_APPID"]) {
      environmentVars["SRCDS_APPID"] = "4020";
    }
    if (!environmentVars["LUA_REFRESH"]) {
      environmentVars["LUA_REFRESH"] = "1";
    }
    // Пустые значения для этих полей
    if (environmentVars["WORKSHOP_ID"] === "latest") {
      environmentVars["WORKSHOP_ID"] = "";
    }
    if (environmentVars["TICKRATE"] === "latest") {
      environmentVars["TICKRATE"] = "66";
    }
    if (environmentVars["STEAM_ACC"] === "latest") {
      environmentVars["STEAM_ACC"] = "";
    }
  }

  // Source Engine игры (TF2, CS:GO, Insurgency и т.д.)
  if (
    name.includes("team fortress") ||
    name.includes("counter-strike") ||
    name.includes("cs:go") ||
    name.includes("csgo") ||
    name.includes("insurgency")
  ) {
    if (!environmentVars["SRCDS_APPID"]) {
      // Определяем AppID по названию игры
      if (name.includes("team fortress")) {
        environmentVars["SRCDS_APPID"] = "232250";
      } else if (name.includes("counter-strike") || name.includes("csgo")) {
        environmentVars["SRCDS_APPID"] = "740";
      } else if (name.includes("insurgency")) {
        environmentVars["SRCDS_APPID"] = "237410";
      }
    }
    // Пустое значение для STEAM_ACC
    if (environmentVars["STEAM_ACC"] === "latest") {
      environmentVars["STEAM_ACC"] = "";
    }
  }

  // Spigot
  if (name.includes("spigot")) {
    if (!environmentVars["SPIGOT_VERSION"]) {
      environmentVars["SPIGOT_VERSION"] = "latest";
    }
  }

  // Bukkit
  if (name.includes("bukkit")) {
    if (!environmentVars["BUKKIT_VERSION"]) {
      environmentVars["BUKKIT_VERSION"] = "latest";
    }
  }

  // Waterfall
  if (name.includes("waterfall")) {
    if (!environmentVars["WATERFALL_VERSION"]) {
      environmentVars["WATERFALL_VERSION"] = "latest";
    }
  }

  console.log(
    `    Added missing variables for ${eggName}:`,
    Object.keys(environmentVars)
      .filter((k) => !["SERVER_JARFILE"].includes(k))
      .join(", "),
  );
}

/**
 * Синхронизировать игры и ядра из Pterodactyl
 */
export async function syncGamesAndKernels() {
  const nests = await getAllNestsWithEggsAndVariables();

  let gamesCreated = 0;
  let kernelsCreated = 0;
  let environmentsSaved = 0;

  for (const nest of nests) {
    // Создаём или обновляем игру
    const existingGame = await db
      .select()
      .from(games)
      .where(eq(games.pteroNestId, nest.id))
      .get();

    if (existingGame) {
      await db
        .update(games)
        .set({
          name: nest.name,
          description: nest.description,
        })
        .where(eq(games.id, existingGame.id));
    } else {
      await db.insert(games).values({
        name: nest.name,
        description: nest.description,
        pteroNestId: nest.id,
        isActive: 1,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      });
      gamesCreated++;
    }

    const game = await db
      .select()
      .from(games)
      .where(eq(games.pteroNestId, nest.id))
      .get();

    // Создаём или обновляем ядра
    for (const egg of nest.eggs) {
      const existingKernel = await db
        .select()
        .from(kernels)
        .where(eq(kernels.pteroEggId, egg.id))
        .get();

      const kernelData = {
        gameId: game ? game.id : null,
        name: egg.name,
        description: egg.description,
        pteroEggId: egg.id,
        pteroNestId: nest.id,
        dockerImage: egg.docker_image,
        startup: egg.startup,
        environment:
          Object.keys(egg.variables).length > 0
            ? JSON.stringify(egg.variables)
            : null,
        isActive: 1,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      };

      if (existingKernel) {
        await db
          .update(kernels)
          .set(kernelData)
          .where(eq(kernels.id, existingKernel.id));
      } else {
        await db.insert(kernels).values(kernelData);
        kernelsCreated++;
      }

      if (egg.variables && Object.keys(egg.variables).length > 0) {
        environmentsSaved++;
      }
    }
  }

  return {
    success: true,
    gamesCreated,
    kernelsCreated,
    environmentsSaved,
  };
}

/**
 * Получить переменные окружения для ядра
 * Приоритет: 1) БД, 2) Pterodactyl API, 3) генерация из startup
 */
export async function getKernelEnvironment(kernelId, pteroNestId, pteroEggId) {
  // 1. Пробуем получить из БД
  if (kernelId) {
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

        if (parsed && Object.keys(parsed).length > 0) {
          console.log("✅ Loaded environment from DB:", parsed);
          return parsed;
        }
      } catch (e) {
        console.log("Failed to parse environment from DB");
      }
    }
  }

  // 2. Получаем из Pterodactyl API
  if (pteroNestId && pteroEggId) {
    try {
      const config = await getConfig();
      const client = getClient(config);

      const response = await client.get(
        `/nests/${pteroNestId}/eggs/${pteroEggId}`,
      );
      const attrs = response.data.attributes || {};

      let variables = attrs.variables || [];

      // Пробуем meta.variables
      if (variables.length === 0 && attrs.meta?.variables) {
        variables = attrs.meta.variables;
      }

      const environmentVars = {};
      for (const v of variables) {
        const envVar = v.env_variable || v.environment_variable;
        const defaultValue = v.default_value || v.default || "latest";
        if (envVar) {
          environmentVars[envVar] = defaultValue;
        }
      }

      // Добавляем недостающие переменные
      if (Object.keys(environmentVars).length === 0 && attrs.startup) {
        const matches = attrs.startup.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/gi);
        if (matches) {
          for (const match of matches) {
            const varName = match.replace("{{", "").replace("}}", "");
            environmentVars[varName] = getDefaultValueForVariable(varName);
          }
        }
      }

      addMissingVariablesForEgg(attrs.name || "", environmentVars);

      if (Object.keys(environmentVars).length > 0) {
        console.log(
          "✅ Loaded environment from Pterodactyl API:",
          environmentVars,
        );

        // Сохраняем в БД
        if (kernelId) {
          await db
            .update(kernels)
            .set({ environment: JSON.stringify(environmentVars) })
            .where(eq(kernels.id, parseInt(kernelId)));
        }

        return environmentVars;
      }
    } catch (error) {
      console.error(
        "Failed to get environment from Pterodactyl:",
        error.message,
      );
    }
  }

  // 3. Возвращаем пустой объект
  console.log("⚠️ Using empty environment");
  return {};
}

/**
 * Получить дефолтное значение для переменной
 */
function getDefaultValueForVariable(varName) {
  const upper = varName.toUpperCase();

  if (upper.includes("JARFILE")) return "server.jar";
  if (upper.includes("PY_FILE")) return "main.py";
  if (upper.includes("JS_FILE")) return "index.js";
  if (upper.includes("VERSION")) return "latest";
  if (upper.includes("BUILD_NUMBER")) return "latest";
  if (upper.includes("MAP") || upper.includes("WORLD")) return "world";
  if (upper.includes("PORT")) return "25565";
  if (upper.includes("MEMORY") || upper.includes("RAM")) return "1024";
  if (upper.includes("CPU")) return "100";
  if (upper.includes("DISK")) return "5120";
  if (upper.includes("NAME") || upper.includes("SESSION")) return "Server";
  if (upper.includes("PASSWORD") || upper.includes("PASSWD")) return "";
  if (upper.includes("MAX_PLAYERS")) return "20";

  return "latest";
}

/**
 * Тест подключения к Pterodactyl
 */
export async function testConnection() {
  try {
    const config = await getConfig();
    const client = getClient(config);
    const response = await client.get("/servers?per_page=1");
    return { success: true, message: "Подключение успешно" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
