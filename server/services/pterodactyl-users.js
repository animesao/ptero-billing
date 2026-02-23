import axios from "axios";
import https from "https";
import { db } from "../db.js";
import { settings } from "../schema.js";
import { eq } from "drizzle-orm";

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
 * Создать HTTP клиент для Pterodactyl API
 */
function getClient(config) {
  const cacheKey = "default";

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }

  const url = config["ptero_url"] || "";
  const key = config["ptero_api_key"] || "";

  const client = axios.create({
    baseURL: url.replace(/\/+$/, "") + "/api/application",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 30000,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Создать пользователя в Pterodactyl
 */
export async function createPteroUser({
  email,
  username,
  firstName,
  lastName,
  password,
}) {
  const config = await getConfig();
  const client = getClient(config);

  const baseURL = client.defaults.baseURL;
  if (!baseURL || !baseURL.startsWith("http")) {
    console.error("Invalid Pterodactyl URL:", baseURL);
    throw new Error("Pterodactyl URL не настроен");
  }

  try {
    const response = await client.post("/users", {
      email,
      username,
      first_name: firstName || username,
      last_name: lastName || "User",
      password,
    });
    console.log("Pterodactyl user created:", response.data.attributes?.id);
    return response.data;
  } catch (error) {
    console.error(
      "Pterodactyl create user error:",
      JSON.stringify(error.response?.data, null, 2) || error.message,
    );

    const errorData = error.response?.data;
    const errors = errorData?.errors || [];

    if (errors.length > 0) {
      const errorMessages = errors.map((e) => e.detail || e.message).join(", ");
      const formattedError = new Error(errorMessages);
      formattedError.response = error.response;
      throw formattedError;
    }

    throw error;
  }
}

/**
 * Удалить пользователя
 */
export async function deleteUser(pteroUserId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.delete(`/users/${pteroUserId}`);
}

/**
 * Заморозить пользователя
 */
export async function suspendUser(pteroUserId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.post(`/users/${pteroUserId}/suspend`);
}

/**
 * Разморозить пользователя
 */
export async function unsuspendUser(pteroUserId) {
  const config = await getConfig();
  const client = getClient(config);
  await client.post(`/users/${pteroUserId}/unsuspend`);
}

/**
 * Тест подключения
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
