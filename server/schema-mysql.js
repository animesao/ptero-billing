import { mysqlTable, serial, text, int, boolean, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  pteroUserId: int('ptero_user_id'),
  balance: int('balance').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const plans = mysqlTable('plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  cpu: int('cpu').notNull(),
  ramMb: int('ram_mb').notNull(),
  diskMb: int('disk_mb').notNull(),
  slots: int('slots').notNull().default(0),
  dbLimit: int('db_limit').notNull().default(0),
  backupLimit: int('backup_limit').notNull().default(0),
  priceMonthly: int('price_monthly').notNull(),
  priceQuarterly: int('price_quarterly'),
  priceYearly: int('price_yearly'),
  nestId: int('nest_id'),
  eggId: int('egg_id'),
  nodeId: int('node_id'),
  locationId: int('location_id'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  planId: int('plan_id').notNull().references(() => plans.id),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  billingPeriod: varchar('billing_period', { length: 20 }).notNull().default('monthly'),
  amount: int('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('RUB'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const servers = mysqlTable('servers', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  orderId: int('order_id').references(() => orders.id),
  pteroServerId: int('ptero_server_id'),
  pteroIdentifier: varchar('ptero_identifier', { length: 50 }),
  name: varchar('name', { length: 100 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('installing'),
  cpu: int('cpu'),
  ramMb: int('ram_mb'),
  diskMb: int('disk_mb'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = mysqlTable('payments', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').references(() => orders.id),
  userId: int('user_id').notNull().references(() => users.id),
  provider: varchar('provider', { length: 30 }).notNull(),
  amount: int('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('RUB'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  externalId: varchar('external_id', { length: 255 }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketCategories = mysqlTable('ticket_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sortOrder: int('sort_order').notNull().default(0),
});

export const tickets = mysqlTable('tickets', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  categoryId: int('category_id').references(() => ticketCategories.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('open'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketMessages = mysqlTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id),
  userId: int('user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketAttachments = mysqlTable('ticket_attachments', {
  id: serial('id').primaryKey(),
  messageId: int('message_id').notNull().references(() => ticketMessages.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: int('size'),
});

export const settings = mysqlTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  group: varchar('group', { length: 50 }).notNull().default('general'),
});

export const auditLogs = mysqlTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: int('actor_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 50 }),
  entityId: int('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
