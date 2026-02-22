import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { users, plans, orders, servers, payments, tickets, ticketMessages, ticketCategories } from '../schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import * as ptero from '../services/pterodactyl.js';

const router = Router();
router.use(requireAuth);

router.get('/plans', async (req, res) => {
  try {
    const result = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/servers', async (req, res) => {
  try {
    const result = await db.select().from(servers).where(eq(servers.userId, req.session.userId)).orderBy(desc(servers.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/orders', async (req, res) => {
  try {
    const result = await db.select().from(orders).where(eq(orders.userId, req.session.userId)).orderBy(desc(orders.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/orders', async (req, res) => {
  try {
    const { planId, billingPeriod, serverName } = req.body;
    const [plan] = await db.select().from(plans).where(eq(plans.id, parseInt(planId)));
    if (!plan) return res.status(404).json({ error: 'Тариф не найден' });

    let amount = plan.priceMonthly;
    if (billingPeriod === 'quarterly' && plan.priceQuarterly) amount = plan.priceQuarterly;
    if (billingPeriod === 'yearly' && plan.priceYearly) amount = plan.priceYearly;

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Недостаточно средств на балансе' });
    }

    const periodMonths = billingPeriod === 'yearly' ? 12 : billingPeriod === 'quarterly' ? 3 : 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + periodMonths);

    const [order] = await db.insert(orders).values({
      userId: req.session.userId,
      planId: plan.id,
      status: 'active',
      billingPeriod: billingPeriod || 'monthly',
      amount,
      expiresAt,
    }).returning();

    await db.update(users).set({ balance: user.balance - amount }).where(eq(users.id, req.session.userId));

    await db.insert(payments).values({
      orderId: order.id,
      userId: req.session.userId,
      provider: 'balance',
      amount,
      status: 'completed',
    });

    let serverRecord;
    try {
      const pteroResult = await ptero.createServer({
        name: serverName || `${plan.name}-${order.id}`,
        userId: req.session.userId,
        plan,
        pteroUserId: 1,
      });

      [serverRecord] = await db.insert(servers).values({
        userId: req.session.userId,
        orderId: order.id,
        pteroServerId: pteroResult.attributes?.id,
        pteroIdentifier: pteroResult.attributes?.identifier,
        name: serverName || `${plan.name}-${order.id}`,
        status: 'installing',
        cpu: plan.cpu,
        ramMb: plan.ramMb,
        diskMb: plan.diskMb,
      }).returning();
    } catch (pteroError) {
      [serverRecord] = await db.insert(servers).values({
        userId: req.session.userId,
        orderId: order.id,
        name: serverName || `${plan.name}-${order.id}`,
        status: 'pending_setup',
        cpu: plan.cpu,
        ramMb: plan.ramMb,
        diskMb: plan.diskMb,
      }).returning();
    }

    res.json({ order, server: serverRecord });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const result = await db.select().from(payments).where(eq(payments.userId, req.session.userId)).orderBy(desc(payments.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/balance/add', async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = parseInt(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Некорректная сумма' });

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
    await db.update(users).set({ balance: user.balance + amt }).where(eq(users.id, req.session.userId));

    await db.insert(payments).values({
      userId: req.session.userId,
      provider: 'manual',
      amount: amt,
      status: 'completed',
    });

    res.json({ balance: user.balance + amt });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/tickets', async (req, res) => {
  try {
    const result = await db.select().from(tickets).where(eq(tickets.userId, req.session.userId)).orderBy(desc(tickets.createdAt));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/tickets', async (req, res) => {
  try {
    const { subject, categoryId, body, priority } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Тема и сообщение обязательны' });

    const [ticket] = await db.insert(tickets).values({
      userId: req.session.userId,
      categoryId: categoryId ? parseInt(categoryId) : null,
      subject,
      priority: priority || 'normal',
    }).returning();

    await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      userId: req.session.userId,
      body,
    });

    res.json(ticket);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/tickets/:id', async (req, res) => {
  try {
    const [ticket] = await db.select().from(tickets).where(
      and(eq(tickets.id, parseInt(req.params.id)), eq(tickets.userId, req.session.userId))
    );
    if (!ticket) return res.status(404).json({ error: 'Тикет не найден' });
    const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticket.id)).orderBy(ticketMessages.createdAt);
    res.json({ ticket, messages });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { body } = req.body;
    const [ticket] = await db.select().from(tickets).where(
      and(eq(tickets.id, parseInt(req.params.id)), eq(tickets.userId, req.session.userId))
    );
    if (!ticket) return res.status(404).json({ error: 'Тикет не найден' });

    const [msg] = await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      userId: req.session.userId,
      body,
    }).returning();
    await db.update(tickets).set({ updatedAt: new Date(), status: 'open' }).where(eq(tickets.id, ticket.id));
    res.json(msg);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/ticket-categories', async (req, res) => {
  try {
    const result = await db.select().from(ticketCategories).orderBy(ticketCategories.sortOrder);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/profile', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));

    const updates = {};
    if (username && username !== user.username) {
      const existing = await db.select().from(users).where(eq(users.username, username));
      if (existing.length > 0) return res.status(400).json({ error: 'Имя пользователя занято' });
      updates.username = username;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Введите текущий пароль' });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'Неверный текущий пароль' });
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, req.session.userId));
    }

    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
