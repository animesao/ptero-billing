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
 * Синхронизировать игры и ядра из Pterodactyl с сохранением всех переменных
 */
export async function syncGamesAndKernels() {
  try {
    const config = await getConfig();
    const client = getClient(config);

    // Получаем все гнёзда
    const nestsResponse = await client.get("/nests?per_page=100");
    const nests = nestsResponse.data.data || [];

    let gamesCreated = 0;
    let kernelsCreated = 0;
    let environmentsSaved = 0;

    for (const nest of nests) {
      const nestId = nest.attributes.id;
      const nestName = nest.attributes.name;
      const nestDescription = nest.attributes.description || "";

      console.log(`Processing nest: ${nestName} (id: ${nestId})`);

      // Создаём или обновляем игру
      const existingGame = await db
        .select()
        .from(games)
        .where(eq(games.pteroNestId, nestId))
        .get();

      if (existingGame) {
        await db
          .update(games)
          .set({
            name: nestName,
            description: nestDescription,
          })
          .where(eq(games.id, existingGame.id));
        console.log(`Updated game: ${nestName}`);
      } else {
        await db.insert(games).values({
          name: nestName,
          description: nestDescription,
          pteroNestId: nestId,
          isActive: 1,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
        });
        gamesCreated++;
        console.log(`Created game: ${nestName}`);
      }

      // Получаем игру
      const game = await db
        .select()
        .from(games)
        .where(eq(games.pteroNestId, nestId))
        .get();

      // Получаем все яйца из гнезда
      const eggsResponse = await client.get(
        `/nests/${nestId}/eggs?per_page=100`,
      );
      const eggs = eggsResponse.data.data || [];

      for (const egg of eggs) {
        const eggId = egg.attributes.id;
        const eggName = egg.attributes.name;
        const eggDescription = egg.attributes.description || "";
        const dockerImage = egg.attributes.docker_image;
        const startup = egg.attributes.startup;

        // Получаем переменные из яйца - пробуем разные форматы
        const environmentVars = {};

        // Формат 1: attributes.variables (массив объектов)
        let variables = egg.attributes.variables || [];

        // Формат 2: attributes.relationships.eggVariables (ссылки)
        if (variables.length === 0 && egg.relationships?.eggVariables?.data) {
          console.log(
            `  Trying to get variables from relationships for ${eggName}`,
          );
          // Нужно получить яйцо с include
        }

        // Если переменных нет, получаем яйцо напрямую с полным ответом
        if (variables.length === 0) {
          try {
            const eggDetailResponse = await client.get(
              `/nests/${nestId}/eggs/${eggId}`,
            );
            const eggDetail = eggDetailResponse.data;

            // Пробуем разные пути к переменным
            variables = eggDetail.attributes?.variables || [];

            // Если всё ещё нет, извлекаем из startup строки и добавляем известные переменные
            if (variables.length === 0 && eggDetail.attributes?.startup) {
              const startupStr = eggDetail.attributes.startup;
              const startupVars = startupStr.match(
                /\{\{([A-Z_][A-Z0-9_]*)\}\}/gi,
              );

              console.log(`  Extracting variables from startup for ${eggName}`);

              if (startupVars) {
                for (const match of startupVars) {
                  const varName = match.replace("{{", "").replace("}}", "");
                  const defaultValue = getDefaultValueForVariable(varName);
                  environmentVars[varName] = defaultValue;
                  console.log(
                    `    ${varName} = ${defaultValue} (from startup)`,
                  );
                }
              }

              // Добавляем известные переменные для популярных яиц
              const eggNameLower = eggName.toLowerCase();

              if (eggNameLower.includes("vanilla")) {
                if (!environmentVars["VANILLA_VERSION"]) {
                  environmentVars["VANILLA_VERSION"] = "1.20.4";
                  console.log(
                    `    VANILLA_VERSION = 1.20.4 (added for Vanilla)`,
                  );
                }
              }

              if (eggNameLower.includes("paper")) {
                if (!environmentVars["PAPER_VERSION"]) {
                  environmentVars["PAPER_VERSION"] = "latest";
                  console.log(`    PAPER_VERSION = latest (added for Paper)`);
                }
                if (!environmentVars["BUILD_NUMBER"]) {
                  environmentVars["BUILD_NUMBER"] = "latest";
                  console.log(`    BUILD_NUMBER = latest (added for Paper)`);
                }
              }

              if (eggNameLower.includes("forge")) {
                if (!environmentVars["FORGE_VERSION"]) {
                  environmentVars["FORGE_VERSION"] = "latest";
                  console.log(`    FORGE_VERSION = latest (added for Forge)`);
                }
                if (!environmentVars["MINECRAFT_VERSION"]) {
                  environmentVars["MINECRAFT_VERSION"] = "1.20.4";
                  console.log(
                    `    MINECRAFT_VERSION = 1.20.4 (added for Forge)`,
                  );
                }
              }

              if (eggNameLower.includes("fabric")) {
                if (!environmentVars["FABRIC_VERSION"]) {
                  environmentVars["FABRIC_VERSION"] = "latest";
                  console.log(`    FABRIC_VERSION = latest (added for Fabric)`);
                }
                if (!environmentVars["MINECRAFT_VERSION"]) {
                  environmentVars["MINECRAFT_VERSION"] = "1.20.4";
                  console.log(
                    `    MINECRAFT_VERSION = 1.20.4 (added for Fabric)`,
                  );
                }
              }

              if (eggNameLower.includes("bungee")) {
                if (!environmentVars["BUNGEE_VERSION"]) {
                  environmentVars["BUNGEE_VERSION"] = "latest";
                  console.log(`    BUNGEE_VERSION = latest (added for Bungee)`);
                }
              }

              if (eggNameLower.includes("velocity")) {
                if (!environmentVars["VELOCITY_VERSION"]) {
                  environmentVars["VELOCITY_VERSION"] = "latest";
                  console.log(
                    `    VELOCITY_VERSION = latest (added for Velocity)`,
                  );
                }
              }

              if (eggNameLower.includes("sponge")) {
                if (!environmentVars["SPONGE_VERSION"]) {
                  environmentVars["SPONGE_VERSION"] = "latest";
                  console.log(`    SPONGE_VERSION = latest (added for Sponge)`);
                }
              }
            }
          } catch (e) {
            console.log(
              `  Failed to get egg details for ${eggName}: ${e.message}`,
            );
          }
        }

        console.log(`  Processing egg: ${eggName} (id: ${eggId})`);
        console.log(`  Variables count: ${variables.length}`);

        for (const v of variables) {
          const envVar = v.env_variable || v.environment_variable;
          const defaultValue = v.default_value || v.default || "latest";
          const required = v.required || false;

          if (envVar) {
            environmentVars[envVar] = defaultValue;
            console.log(
              `    ${envVar} = ${defaultValue}${required ? " (required)" : ""}`,
            );
          }
        }

        // Создаём или обновляем ядро
        const existingKernel = await db
          .select()
          .from(kernels)
          .where(eq(kernels.pteroEggId, eggId))
          .get();

        if (existingKernel) {
          const updateData = {
            gameId: game ? game.id : null,
            name: eggName,
            description: eggDescription,
            dockerImage,
            startup,
            pteroNestId: nestId,
          };

          if (Object.keys(environmentVars).length > 0) {
            updateData.environment = JSON.stringify(environmentVars);
            environmentsSaved++;
          }

          await db
            .update(kernels)
            .set(updateData)
            .where(eq(kernels.id, existingKernel.id));
          console.log(`  Updated kernel: ${eggName}`);
        } else {
          await db.insert(kernels).values({
            gameId: game ? game.id : null,
            name: eggName,
            description: eggDescription,
            pteroEggId: eggId,
            pteroNestId: nestId,
            dockerImage,
            startup,
            environment:
              Object.keys(environmentVars).length > 0
                ? JSON.stringify(environmentVars)
                : null,
            isActive: 1,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
          });
          kernelsCreated++;
          if (Object.keys(environmentVars).length > 0) {
            environmentsSaved++;
          }
          console.log(`  Created kernel: ${eggName}`);
        }
      }
    }

    return {
      success: true,
      gamesCreated,
      kernelsCreated,
      environmentsSaved,
    };
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
}

/**
 * Получить переменные окружения для ядра из БД
 */
export async function getKernelEnvironment(kernelId) {
  try {
    const [kernel] = await db
      .select()
      .from(kernels)
      .where(eq(kernels.id, parseInt(kernelId)));

    if (!kernel) {
      console.error(`Kernel not found: ${kernelId}`);
      return {};
    }

    // Если есть сохранённые переменные в БД
    if (kernel.environment) {
      try {
        const parsed =
          typeof kernel.environment === "string"
            ? JSON.parse(kernel.environment)
            : kernel.environment;

        if (
          parsed &&
          typeof parsed === "object" &&
          Object.keys(parsed).length > 0
        ) {
          console.log(`Loaded environment from DB for ${kernel.name}:`, parsed);
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse kernel environment:", e.message);
      }
    }

    // Если нет в БД, получаем из Pterodactyl API
    if (kernel.pteroNestId && kernel.pteroEggId) {
      const config = await getConfig();
      const client = getClient(config);

      try {
        const response = await client.get(
          `/nests/${kernel.pteroNestId}/eggs/${kernel.pteroEggId}`,
        );
        const variables = response.data.attributes?.variables || [];

        const envVars = {};
        for (const v of variables) {
          const envVar = v.env_variable || v.environment_variable;
          const defaultValue = v.default_value || v.default || "latest";

          if (envVar) {
            envVars[envVar] = defaultValue;
          }
        }

        if (Object.keys(envVars).length > 0) {
          console.log(
            `Loaded environment from Pterodactyl for ${kernel.name}:`,
            envVars,
          );

          // Сохраняем в БД для будущего использования
          await db
            .update(kernels)
            .set({ environment: JSON.stringify(envVars) })
            .where(eq(kernels.id, kernel.id));

          return envVars;
        }
      } catch (e) {
        console.error("Failed to get environment from Pterodactyl:", e.message);
      }
    }

    // Если ничего не получилось, генерируем из startup
    if (kernel.startup) {
      const matches = kernel.startup.match(/\{\{([A-Z_][A-Z0-9_]*)\}\}/gi);
      if (matches) {
        const envVars = {};
        for (const match of matches) {
          const varName = match.replace("{{", "").replace("}}", "");
          envVars[varName] = getDefaultValueForVariable(varName);
        }
        console.log(
          `Generated environment from startup for ${kernel.name}:`,
          envVars,
        );
        return envVars;
      }
    }

    console.log(`No environment found for kernel: ${kernel.name}`);
    return {};
  } catch (error) {
    console.error("Error getting kernel environment:", error.message);
    return {};
  }
}

/**
 * Получить дефолтное значение для переменной
 */
function getDefaultValueForVariable(varName) {
  const upper = varName.toUpperCase();

  // Файлы
  if (upper.includes("JARFILE")) return "server.jar";
  if (upper.includes("PY_FILE")) return "main.py";
  if (upper.includes("JS_FILE")) return "index.js";

  // Версии
  if (upper === "VANILLA_VERSION") return "1.20.4";
  if (upper === "PAPER_VERSION") return "latest";
  if (upper === "SPIGOT_VERSION") return "latest";
  if (upper === "FORGE_VERSION") return "latest";
  if (upper === "FABRIC_VERSION") return "latest";
  if (upper === "BUKKIT_VERSION") return "latest";
  if (upper === "SPONGE_VERSION") return "latest";
  if (upper === "BUNGEE_VERSION") return "latest";
  if (upper === "VELOCITY_VERSION") return "latest";
  if (upper === "MINECRAFT_VERSION" || upper === "MC_VERSION") return "1.20.4";
  if (upper === "JAVA_VERSION") return "21";
  if (upper === "PYTHON_VERSION") return "3.13";
  if (upper === "PHP_VERSION") return "8.3";
  if (upper === "NODE_VERSION") return "20";
  if (upper.includes("VERSION")) return "latest";

  // Флаги
  if (upper.includes("BUILD_NUMBER")) return "latest";
  if (upper.includes("BUILD_TYPE")) return "release";
  if (upper.includes("STATUS")) return "1";
  if (upper.includes("ENABLE") || upper.includes("USE")) return "0";
  if (upper.includes("AUTOUPDATE")) return "1";
  if (upper.includes("DEBUG")) return "0";
  if (upper.includes("ONLINE_MODE")) return "true";
  if (upper.includes("PVP")) return "true";
  if (upper.includes("WHITELIST")) return "false";
  if (upper.includes("DIFFICULTY")) return "normal";
  if (upper.includes("MODE")) return "survival";
  if (upper.includes("HARDCORE")) return "false";

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
  if (upper.includes("DOMAIN")) return "example.com";

  // Ресурсы
  if (upper.includes("MEMORY") || upper.includes("RAM")) return "1024";
  if (upper.includes("CPU")) return "100";
  if (upper.includes("DISK")) return "5120";

  // Общее
  if (upper.includes("MAP") || upper.includes("WORLD")) return "world";
  if (
    upper.includes("NAME") ||
    upper.includes("TITLE") ||
    upper.includes("SESSION")
  )
    return "Server";
  if (upper.includes("PASSWORD") || upper.includes("PASSWD")) return "";
  if (upper.includes("MOTD")) return "Welcome";
  if (upper.includes("MAX_PLAYERS")) return "20";

  return "latest";
}
