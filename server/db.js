import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2/promise";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import postgres from "postgres";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import * as schema from "./schema.js";

const dbType = process.env.DATABASE_TYPE || "sqlite";

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
  // SQLite by default
  const dbPath = process.env.SQLITE_DB_PATH || "./pterobilling.db";
  client = new Database(dbPath);
  db = drizzleSqlite(client, { schema });
}

export { db, client, dbType };
