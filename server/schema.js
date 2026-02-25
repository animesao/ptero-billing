// Универсальная схема - экспортирует нужную в зависимости от DATABASE_TYPE
const dbType = process.env.DATABASE_TYPE || "sqlite";

let schema;
if (dbType === "mysql") {
  schema = await import("./schema-mysql.js");
} else if (dbType === "postgres") {
  schema = await import("./schema-pg.js");
} else {
  // SQLite (libsql) by default
  schema = await import("./schema-sqlite.js");
}

export const users = schema.users;
export const plans = schema.plans;
export const orders = schema.orders;
export const servers = schema.servers;
export const payments = schema.payments;
export const ticketCategories = schema.ticketCategories;
export const tickets = schema.tickets;
export const ticketMessages = schema.ticketMessages;
export const ticketAttachments = schema.ticketAttachments;
export const settings = schema.settings;
export const auditLogs = schema.auditLogs;
export const games = schema.games;
export const kernels = schema.kernels;
