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
 * Получить данные яйца с переменными через API
 * Использует несколько методов для получения переменных
 */
async function getEggWithVariables(client, nestId, eggId) {
  try {
    console.log(`      Fetching egg ${eggId} variables...`);

    // 1. Пробуем получить переменные через отдельный endpoint /variables
    let variables = [];

    try {
      const varsResponse = await client.get(
        `/nests/${nestId}/eggs/${eggId}/variables`,
        { params: { per_page: 100 } },
      );

      if (varsResponse.data && Array.isArray(varsResponse.data)) {
        variables = varsResponse.data;
        console.log(
          `      ✅ Got ${variables.length} variables from /variables endpoint`,
        );
      }
    } catch (e) {
      console.log(`      ⚠️ /variables endpoint not available: ${e.message}`);
    }

    // 2. Если не получилось, получаем яйцо с include=eggVariables
    if (variables.length === 0) {
      try {
        const response = await client.get(
          `/nests/${nestId}/eggs/${eggId}?include=eggVariables`,
          { params: { per_page: 100 } },
        );

        const egg = response.data;

        if (egg.included && Array.isArray(egg.included)) {
          variables = egg.included
            .filter((item) => item.type === "egg_variable")
            .map((item) => ({
              env_variable:
                item.attributes?.environment_variable ||
                item.attributes?.env_variable,
              default_value:
                item.attributes?.default_value ||
                item.attributes?.default ||
                "latest",
            }))
            .filter((v) => v.env_variable);

          if (variables.length > 0) {
            console.log(
              `      ✅ Got ${variables.length} variables from include=eggVariables`,
            );
          }
        }
      } catch (e) {
        console.log(
          `      ⚠️ include=eggVariables not available: ${e.message}`,
        );
      }
    }

    // 3. Если всё ещё нет, пробуем attributes.variables
    if (variables.length === 0) {
      try {
        const response = await client.get(`/nests/${nestId}/eggs/${eggId}`, {
          params: { per_page: 100 },
        });

        const attrs = response.data.attributes || {};

        if (attrs.variables && Array.isArray(attrs.variables)) {
          variables = attrs.variables.map((v) => ({
            env_variable: v.env_variable || v.environment_variable,
            default_value: v.default_value || v.default || "latest",
          }));

          if (variables.length > 0) {
            console.log(
              `      ✅ Got ${variables.length} variables from attributes.variables`,
            );
          }
        }
      } catch (e) {
        console.log(
          `      ⚠️ attributes.variables not available: ${e.message}`,
        );
      }
    }

    // Формируем итоговые переменные
    const environmentVars = {};
    for (const v of variables) {
      if (v.env_variable) {
        environmentVars[v.env_variable] = v.default_value || "latest";
      }
    }

    // Получаем данные яйца
    const eggResponse = await client.get(`/nests/${nestId}/eggs/${eggId}`, {
      params: { per_page: 100 },
    });
    const attrs = eggResponse.data.attributes || {};

    console.log(
      `      📦 Total variables: ${Object.keys(environmentVars).length}`,
    );
    console.log(
      `      🚀 Startup: ${attrs.startup?.substring(0, 80) || "N/A"}...`,
    );

    return {
      id: eggId,
      name: attrs.name || "",
      description: attrs.description || "",
      docker_image: attrs.docker_image,
      startup: attrs.startup,
      variables: environmentVars,
    };
  } catch (error) {
    console.error(`Error getting egg ${eggId}:`, error.message);
    return null;
  }
}

/**
 * Синхронизировать игры и ядра из Pterodactyl
 * Проходит по каждому гнезду и каждому яйцу, получает ВСЕ данные
 */
export async function syncGamesAndKernels() {
  try {
    const config = await getConfig();
    const client = getClient(config);

    console.log("\n=== STARTING FULL SYNC (CTRL Panel style) ===\n");

    // Получаем все гнёзда
    const nestsResponse = await client.get("/nests?per_page=100");
    const nests = nestsResponse.data.data || [];

    console.log(`📦 Found ${nests.length} nests`);

    let gamesCreated = 0;
    let kernelsCreated = 0;
    let environmentsSaved = 0;

    for (const nest of nests) {
      const nestId = nest.attributes.id;
      const nestName = nest.attributes.name;
      const nestDescription = nest.attributes.description || "";

      console.log(`\n🎮 Processing nest: ${nestName} (id: ${nestId})`);

      // Создаём или обновляем игру (гнездо)
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
        console.log(`  ✅ Updated game in DB`);
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
        console.log(`  ✅ Created game in DB`);
      }

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

      console.log(`  🥚 Found ${eggs.length} eggs`);

      // Для КАЖДОГО яйца получаем ПОЛНЫЕ данные
      for (const egg of eggs) {
        const eggId = egg.attributes.id;
        const eggName = egg.attributes.name;

        console.log(
          `    \n    Getting FULL data for egg: ${eggName} (id: ${eggId})`,
        );

        // Получаем полные данные яйца через API
        const eggData = await getEggWithVariables(client, nestId, eggId);

        if (!eggData) {
          console.log(`    ❌ Failed to get egg data`);
          continue;
        }

        // Создаём или обновляем ядро (яйцо)
        const existingKernel = await db
          .select()
          .from(kernels)
          .where(eq(kernels.pteroEggId, eggId))
          .get();

        const kernelData = {
          gameId: game ? game.id : null,
          name: eggData.name,
          description: eggData.description,
          pteroEggId: eggId,
          pteroNestId: nestId,
          dockerImage: eggData.docker_image,
          startup: eggData.startup,
          environment:
            Object.keys(eggData.variables).length > 0
              ? JSON.stringify(eggData.variables)
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
          console.log(`    ✅ Updated kernel in DB`);
        } else {
          await db.insert(kernels).values(kernelData);
          kernelsCreated++;
          console.log(`    ✅ Created kernel in DB`);
        }

        if (eggData.variables && Object.keys(eggData.variables).length > 0) {
          environmentsSaved++;
          console.log(
            `    💾 Saved ${Object.keys(eggData.variables).length} variables to DB`,
          );
        } else {
          console.log(`    ⚠️ No variables found for this egg`);
        }
      }
    }

    console.log("\n=== SYNC COMPLETE ===");
    console.log(`📊 Total nests: ${nests.length}`);
    console.log(`🎮 Games created/updated: ${gamesCreated}`);
    console.log(`🥚 Kernels created/updated: ${kernelsCreated}`);
    console.log(`💾 Environments saved: ${environmentsSaved}`);

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
 * Получить переменные окружения для ядра из БД или API
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

      const eggData = await getEggWithVariables(
        client,
        pteroNestId,
        pteroEggId,
      );

      if (eggData && Object.keys(eggData.variables).length > 0) {
        console.log(
          "✅ Loaded environment from Pterodactyl API:",
          eggData.variables,
        );

        // Сохраняем в БД
        if (kernelId) {
          await db
            .update(kernels)
            .set({ environment: JSON.stringify(eggData.variables) })
            .where(eq(kernels.id, parseInt(kernelId)));
        }

        return eggData.variables;
      }
    } catch (error) {
      console.error(
        "Failed to get environment from Pterodactyl:",
        error.message,
      );
    }
  }

  console.log("⚠️ Using empty environment");
  return {};
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
