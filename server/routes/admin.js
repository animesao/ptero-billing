import { Router } from 'express';
import { db } from '../db.js';
import { users, plans, orders, servers, payments, tickets, ticketMessages, ticketCategories, settings, auditLogs } from '../schema.js';
import { eq, desc, sql, count } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';
import * as ptero from '../services/pterodactyl.js';

const router = Router();
router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [orderCount] = await db.select({ count: count() }).from(orders);
    const [serverCount] = await db.select({ count: count() }).from(servers);
    const [ticketCount] = await db.select({ count: count() }).from(tickets);
    const [paymentSum] = await db.select({ total: sql`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, 'completed'));

    res.json({
      users: userCount.count,
      orders: orderCount.count,
      servers: serverCount.count,
      tickets: ticketCount.count,
      revenue: paymentSum.total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await db.select({
      id: users.id, email: users.email, username: users.username,
      role: users.role, status: users.status, balance: users.balance, createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, status, balance } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (balance !== undefined) updates.balance = parseInt(balance);

    const [updated] = await db.update(users).set(updates).where(eq(users.id, parseInt(req.params.id))).returning();
    await db.insert(auditLogs).values({
      actorId: req.session.userId,
      action: 'user_update',
      entity: 'user',
      entityId: updated.id,
      details: JSON.stringify(updates),
    });
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/plans', async (req, res) => {
  try {
    const result = await db.select().from(plans).orderBy(plans.sortOrder);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/plans', async (req, res) => {
  try {
    const { name, description, cpu, ramMb, diskMb, slots, dbLimit, backupLimit, priceMonthly, priceQuarterly, priceYearly, nestId, eggId, nodeId, locationId, sortOrder } = req.body;
    const [plan] = await db.insert(plans).values({
      name, description, cpu: parseInt(cpu), ramMb: parseInt(ramMb), diskMb: parseInt(diskMb),
      slots: parseInt(slots || 0), dbLimit: parseInt(dbLimit || 0), backupLimit: parseInt(backupLimit || 0),
      priceMonthly: parseInt(priceMonthly), priceQuarterly: priceQuarterly ? parseInt(priceQuarterly) : null,
      priceYearly: priceYearly ? parseInt(priceYearly) : null,
      nestId: nestId ? parseInt(nestId) : null, eggId: eggId ? parseInt(eggId) : null,
      nodeId: nodeId ? parseInt(nodeId) : null, locationId: locationId ? parseInt(locationId) : null,
      sortOrder: parseInt(sortOrder || 0),
    }).returning();
    res.json(plan);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { name, description, cpu, ramMb, diskMb, slots, dbLimit, backupLimit, priceMonthly, priceQuarterly, priceYearly, nestId, eggId, nodeId, locationId, isActive, sortOrder } = req.body;
    const [plan] = await db.update(plans).set({
      name, description, cpu: parseInt(cpu), ramMb: parseInt(ramMb), diskMb: parseInt(diskMb),
      slots: parseInt(slots || 0), dbLimit: parseInt(dbLimit || 0), backupLimit: parseInt(backupLimit || 0),
      priceMonthly: parseInt(priceMonthly), priceQuarterly: priceQuarterly ? parseInt(priceQuarterly) : null,
      priceYearly: priceYearly ? parseInt(priceYearly) : null,
      nestId: nestId ? parseInt(nestId) : null, eggId: eggId ? parseInt(eggId) : null,
      nodeId: nodeId ? parseInt(nodeId) : null, locationId: locationId ? parseInt(locationId) : null,
      isActive: isActive !== undefined ? isActive : true, sortOrder: parseInt(sortOrder || 0),
    }).where(eq(plans.id, parseInt(req.params.id))).returning();
    res.json(plan);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await db.delete(plans).where(eq(plans.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/orders', async (req, res) => {
  try {
    const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, parseInt(req.params.id))).returning();
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/servers', async (req, res) => {
  try {
    const result = await db.select().from(servers).orderBy(desc(servers.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/payments', async (req, res) => {
  try {
    const result = await db.select().from(payments).orderBy(desc(payments.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/tickets', async (req, res) => {
  try {
    const result = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/tickets/:id', async (req, res) => {
  try {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, parseInt(req.params.id)));
    if (!ticket) return res.status(404).json({ error: 'Тикет не найден' });
    const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticket.id)).orderBy(ticketMessages.createdAt);
    res.json({ ticket, messages });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { body } = req.body;
    const [msg] = await db.insert(ticketMessages).values({
      ticketId: parseInt(req.params.id),
      userId: req.session.userId,
      body,
    }).returning();
    await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, parseInt(req.params.id)));
    res.json(msg);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/tickets/:id', async (req, res) => {
  try {
    const { status, priority } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    updates.updatedAt = new Date();
    const [updated] = await db.update(tickets).set(updates).where(eq(tickets.id, parseInt(req.params.id))).returning();
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/ticket-categories', async (req, res) => {
  try {
    const result = await db.select().from(ticketCategories).orderBy(ticketCategories.sortOrder);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/ticket-categories', async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    const [cat] = await db.insert(ticketCategories).values({ name, description, sortOrder: parseInt(sortOrder || 0) }).returning();
    res.json(cat);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/ticket-categories/:id', async (req, res) => {
  try {
    await db.delete(ticketCategories).where(eq(ticketCategories.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/settings', async (req, res) => {
  try {
    const result = await db.select().from(settings);
    const map = {};
    for (const r of result) map[r.key] = r.value;
    res.json(map);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/settings', async (req, res) => {
  try {
    const entries = req.body;
    for (const [key, value] of Object.entries(entries)) {
      const group = key.startsWith('ptero_') ? 'pterodactyl' : key.startsWith('payment_') ? 'payments' : 'general';
      await db.insert(settings).values({ key, value: String(value), group })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value), group } });
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/ptero/test', async (req, res) => {
  try {
    const result = await ptero.testConnection();
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/logs', async (req, res) => {
  try {
    const result = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
