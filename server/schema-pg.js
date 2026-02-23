import { pgTable, serial, text, integer, boolean, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  pteroUserId: integer('ptero_user_id'),
  balance: integer('balance').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  cpu: integer('cpu').notNull(),
  ramMb: integer('ram_mb').notNull(),
  diskMb: integer('disk_mb').notNull(),
  slots: integer('slots').notNull().default(0),
  dbLimit: integer('db_limit').notNull().default(0),
  backupLimit: integer('backup_limit').notNull().default(0),
  priceMonthly: integer('price_monthly').notNull(),
  priceQuarterly: integer('price_quarterly'),
  priceYearly: integer('price_yearly'),
  nestId: integer('nest_id'),
  eggId: integer('egg_id'),
  nodeIds: text('node_ids'), // JSON массив ID нод для случайного выбора
  allocationId: integer('allocation_id'),
  dockerImage: varchar('docker_image', { length: 255 }),
  startup: text('startup'),
  environment: text('environment'),
  pteroInstanceId: varchar('ptero_instance_id', { length: 50 }), // ID инстанса Pterodactyl
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  planId: integer('plan_id').notNull().references(() => plans.id),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  billingPeriod: varchar('billing_period', { length: 20 }).notNull().default('monthly'),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('RUB'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const servers = pgTable('servers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  orderId: integer('order_id').references(() => orders.id),
  pteroServerId: integer('ptero_server_id'),
  pteroIdentifier: varchar('ptero_identifier', { length: 50 }),
  name: varchar('name', { length: 100 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('installing'),
  cpu: integer('cpu'),
  ramMb: integer('ram_mb'),
  diskMb: integer('disk_mb'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  userId: integer('user_id').notNull().references(() => users.id),
  provider: varchar('provider', { length: 30 }).notNull(),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('RUB'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  externalId: varchar('external_id', { length: 255 }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketCategories = pgTable('ticket_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').references(() => ticketCategories.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('open'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketMessages = pgTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  userId: integer('user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketAttachments = pgTable('ticket_attachments', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull().references(() => ticketMessages.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  group: varchar('group', { length: 50 }).notNull().default('general'),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 50 }),
  entityId: integer('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
