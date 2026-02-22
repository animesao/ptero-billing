import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  pteroUserId: integer("ptero_user_id"),
  balance: integer("balance").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  cpu: integer("cpu").notNull(),
  ramMb: integer("ram_mb").notNull(),
  diskMb: integer("disk_mb").notNull(),
  slots: integer("slots").notNull().default(0),
  dbLimit: integer("db_limit").notNull().default(0),
  backupLimit: integer("backup_limit").notNull().default(0),
  priceMonthly: integer("price_monthly").notNull(),
  priceQuarterly: integer("price_quarterly"),
  priceYearly: integer("price_yearly"),
  nestId: integer("nest_id"),
  eggId: integer("egg_id"),
  nodeId: integer("node_id"),
  allocationId: integer("allocation_id"),
  dockerImage: text("docker_image"),
  startup: text("startup"),
  environment: text("environment"),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  planId: integer("plan_id")
    .notNull()
    .references(() => plans.id),
  status: text("status").notNull().default("pending"),
  billingPeriod: text("billing_period").notNull().default("monthly"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("RUB"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
});

export const servers = sqliteTable("servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  pteroServerId: integer("ptero_server_id"),
  pteroIdentifier: text("ptero_identifier"),
  name: text("name").notNull(),
  status: text("status").notNull().default("installing"),
  cpu: integer("cpu"),
  ramMb: integer("ram_mb"),
  diskMb: integer("disk_mb"),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  provider: text("provider").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("RUB"),
  status: text("status").notNull().default("pending"),
  externalId: text("external_id"),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull(),
});

export const ticketCategories = sqliteTable("ticket_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  categoryId: integer("category_id").references(() => ticketCategories.id),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

export const ticketAttachments = sqliteTable("ticket_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: integer("message_id")
    .notNull()
    .references(() => ticketMessages.id),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  group: text("group").notNull().default("general"),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: text("created_at").notNull(),
});
