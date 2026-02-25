import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import postgres from "postgres";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env"), quiet: true });

const dbType = (process.env.DATABASE_TYPE || "sqlite").trim();

let db;
let client;

if (dbType === "mysql") {
  const connectionString = `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}`;
  client = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  db = drizzleMysql(client, { schema });
} else if (dbType === "postgres") {
  const connectionString = process.env.DATABASE_URL;
  client = postgres(connectionString);
  db = drizzlePostgres(client, { schema });
} else {
  // SQLite (libsql) by default
  const dbPath = "file:./pterobilling.db";
  client = createClient({
    url: dbPath,
  });
  db = drizzleLibsql(client, { schema });
}

export { db, client, dbType };
