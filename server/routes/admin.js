import { Router } from "express";
import { db } from "../db.js";
import {
  users,
  plans,
  orders,
  servers,
  payments,
  tickets,
  ticketMessages,
  ticketCategories,
  settings,
  auditLogs,
  games,
  kernels,
} from "../schema.js";
import { eq, desc, sql, count } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";
import * as ptero from "../services/pterodactyl.js";

const router = Router();
router.use(requireAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [orderCount] = await db.select({ count: count() }).from(orders);
    const [serverCount] = await db.select({ count: count() }).from(servers);
    const [ticketCount] = await db.select({ count: count() }).from(tickets);
    const [paymentSum] = await db
      .select({ total: sql`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "completed"));

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

router.get("/users", async (req, res) => {
  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        status: users.status,
        balance: users.balance,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { role, status, balance, balanceChange, balanceReason } = req.body;
    const userId = parseInt(req.params.id);

    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    // Обработка изменения статуса - синхронизация с Pterodactyl
    if (status && status !== user.status) {
      if (user.pteroUserId) {
        try {
          if (status === "blocked") {
            await ptero.suspendUser(user.pteroUserId);
            console.log(`User ${user.pteroUserId} suspended in Pterodactyl`);
          } else if (status === "active" && user.status === "blocked") {
            await ptero.unsuspendUser(user.pteroUserId);
            console.log(`User ${user.pteroUserId} unsuspended in Pterodactyl`);
          }
        } catch (pteroError) {
          console.error("Pterodactyl user status error:", pteroError.message);
        }
      }
    }

    // Обработка изменения баланса
    if (balanceChange !== undefined) {
      const change = parseInt(balanceChange);
      if (isNaN(change) || change === 0) {
        return res.status(400).json({ error: "Некорректная сумма изменения" });
      }
      // Проверка чтобы не уйти в минус при списании
      if (change < 0 && user.balance + change < 0) {
        return res
          .status(400)
          .json({ error: "Недостаточно средств на балансе пользователя" });
      }
      updates.balance = user.balance + change;

      // Создаём запись о платеже
      await db.insert(payments).values({
        userId: userId,
        provider: "admin_adjustment",
        amount: Math.abs(change),
        status: change > 0 ? "completed" : "refunded",
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          reason: balanceReason || "",
          actorId: req.session.userId,
        }),
      });
    }

    if (balance !== undefined) updates.balance = parseInt(balance);

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    await db.insert(auditLogs).values({
      actorId: req.session.userId,
      action: "user_update",
      entity: "user",
      entityId: updated.id,
      details: JSON.stringify({ ...updates, balanceChange, balanceReason }),
      createdAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (error) {
    console.error("Admin user update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить пользователя
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    // 1. Удаляем серверы пользователя в Pterodactyl
    const userServers = await db
      .select()
      .from(servers)
      .where(eq(servers.userId, userId));
    for (const server of userServers) {
      if (server.pteroServerId) {
        try {
          await ptero.deleteServer(server.pteroServerId);
          console.log(
            `Server ${server.pteroServerId} deleted from Pterodactyl`,
          );
        } catch (e) {
          console.error("Error deleting server:", e.message);
        }
      }
    }

    // 2. Получаем ID заказов для удаления payments
    const userOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.userId, userId));
    const orderIds = userOrders.map((o) => o.id);

    // 3. Удаляем payments по orderId (сначала - они ссылаются на orders)
    if (orderIds.length > 0) {
      for (const orderId of orderIds) {
        await db.delete(payments).where(eq(payments.orderId, orderId));
      }
    }
    // Удаляем payments по userId
    await db.delete(payments).where(eq(payments.userId, userId));

    // 4. Удаляем все серверы из БД (ссылаются на users и orders)
    await db.delete(servers).where(eq(servers.userId, userId));

    // 5. Удаляем сообщения тикетов (ссылаются на tickets и users)
    const userTickets = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.userId, userId));
    for (const ticket of userTickets) {
      await db
        .delete(ticketMessages)
        .where(eq(ticketMessages.ticketId, ticket.id));
    }

    // 6. Удаляем тикеты
    await db.delete(tickets).where(eq(tickets.userId, userId));

    // 7. Удаляем заказы (после payments и servers)
    await db.delete(orders).where(eq(orders.userId, userId));

    // 8. Удаляем пользователя в Pterodactyl
    if (user.pteroUserId) {
      try {
        await ptero.deleteUser(user.pteroUserId);
        console.log(`User ${user.pteroUserId} deleted from Pterodactyl`);
      } catch (pteroError) {
        console.error("Pterodactyl delete user error:", pteroError.message);
      }
    }

    // 9. Удаляем пользователя из БД (в конце)
    await db.delete(users).where(eq(users.id, userId));

    // 10. Создаём запись в audit log
    await db.insert(auditLogs).values({
      actorId: req.session.userId,
      action: "user_delete",
      entity: "user",
      entityId: userId,
      details: JSON.stringify({
        email: user.email,
        username: user.username,
        pteroUserId: user.pteroUserId,
      }),
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/plans", async (req, res) => {
  try {
    const result = await db.select().from(plans).orderBy(plans.sortOrder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/plans", async (req, res) => {
  try {
    const {
      name,
      description,
      cpu,
      ramMb,
      diskMb,
      slots,
      dbLimit,
      backupLimit,
      priceMonthly,
      priceQuarterly,
      priceYearly,
      isActive,
      sortOrder,
    } = req.body;
    const now = new Date().toISOString();
    const parseIntOrNull = (val) => {
      if (!val || val === "") return null;
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    };
    const [plan] = await db
      .insert(plans)
      .values({
        name,
        description,
        cpu: parseInt(cpu),
        ramMb: parseInt(ramMb),
        diskMb: parseInt(diskMb),
        slots: parseInt(slots || 0),
        dbLimit: parseInt(dbLimit || 0),
        backupLimit: parseInt(backupLimit || 0),
        priceMonthly: parseInt(priceMonthly),
        priceQuarterly: parseIntOrNull(priceQuarterly),
        priceYearly: parseIntOrNull(priceYearly),
        // nestId, eggId, nodeIds будут установлены автоматически при создании сервера
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
        createdAt: now,
      })
      .returning();
    console.log("Plan created:", JSON.stringify(plan));
    res.json(plan);
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/plans/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      cpu,
      ramMb,
      diskMb,
      slots,
      dbLimit,
      backupLimit,
      priceMonthly,
      priceQuarterly,
      priceYearly,
      nestId,
      eggId,
      nodeIds,
      allocationId,
      dockerImage,
      startup,
      environment,
      isActive,
      sortOrder,
    } = req.body;
    const parseIntOrNull = (val) => {
      if (!val || val === "") return null;
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    };
    const [plan] = await db
      .update(plans)
      .set({
        name,
        description,
        cpu: parseInt(cpu),
        ramMb: parseInt(ramMb),
        diskMb: parseInt(diskMb),
        slots: parseInt(slots || 0),
        dbLimit: parseInt(dbLimit || 0),
        backupLimit: parseInt(backupLimit || 0),
        priceMonthly: parseInt(priceMonthly),
        priceQuarterly: parseIntOrNull(priceQuarterly),
        priceYearly: parseIntOrNull(priceYearly),
        nestId: parseIntOrNull(nestId),
        eggId: parseIntOrNull(eggId),
        nodeIds: nodeIds || null,
        allocationId: parseIntOrNull(allocationId),
        dockerImage,
        startup,
        environment: environment ? JSON.stringify(environment) : null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
      })
      .where(eq(plans.id, parseInt(req.params.id)))
      .returning();
    console.log("Plan updated:", JSON.stringify(plan));
    res.json(plan);
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/plans/:id", async (req, res) => {
  try {
    await db.delete(plans).where(eq(plans.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/servers", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(servers)
      .orderBy(desc(servers.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/servers/:id", async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId));
    if (!server) return res.status(404).json({ error: "Сервер не найден" });

    // Удаляем сервер в Pterodactyl если есть pteroServerId
    if (server.pteroServerId) {
      try {
        await ptero.deleteServer(server.pteroServerId);
        console.log(`Server ${server.pteroServerId} deleted from Pterodactyl`);
      } catch (pteroError) {
        console.error(
          "Error deleting server from Pterodactyl:",
          pteroError.message,
        );
        // Продолжаем удаление из БД даже если Pterodactyl вернул ошибку
      }
    }

    // Удаляем сервер из БД
    await db.delete(servers).where(eq(servers.id, serverId));

    // Создаём запись в audit log
    await db.insert(auditLogs).values({
      actorId: req.session.userId,
      action: "server_delete",
      entity: "server",
      entityId: serverId,
      details: JSON.stringify({
        name: server.name,
        pteroServerId: server.pteroServerId,
      }),
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete server error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tickets/:id", async (req, res) => {
  try {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(req.params.id)));
    if (!ticket) return res.status(404).json({ error: "Тикет не найден" });
    const messages = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticket.id))
      .orderBy(ticketMessages.createdAt);
    res.json({ ticket, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tickets/:id/reply", async (req, res) => {
  try {
    const { body } = req.body;
    const now = new Date().toISOString();
    const [msg] = await db
      .insert(ticketMessages)
      .values({
        ticketId: parseInt(req.params.id),
        userId: req.session.userId,
        body,
        createdAt: now,
      })
      .returning();
    await db
      .update(tickets)
      .set({ updatedAt: now })
      .where(eq(tickets.id, parseInt(req.params.id)));
    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/tickets/:id", async (req, res) => {
  try {
    const { status, priority } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    updates.updatedAt = new Date();
    const [updated] = await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ticket-categories", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(ticketCategories)
      .orderBy(ticketCategories.sortOrder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/ticket-categories", async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    const [cat] = await db
      .insert(ticketCategories)
      .values({ name, description, sortOrder: parseInt(sortOrder || 0) })
      .returning();
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/ticket-categories/:id", async (req, res) => {
  try {
    await db
      .delete(ticketCategories)
      .where(eq(ticketCategories.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/settings", async (req, res) => {
  try {
    const result = await db.select().from(settings);
    const map = {};
    for (const r of result) map[r.key] = r.value;
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/settings", async (req, res) => {
  try {
    const entries = req.body;
    for (const [key, value] of Object.entries(entries)) {
      const group = key.startsWith("ptero_")
        ? "pterodactyl"
        : key.startsWith("payment_")
          ? "payments"
          : "general";
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .get();
      if (existing) {
        await db
          .update(settings)
          .set({ value: String(value), group })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: String(value), group });
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/ptero/test", async (req, res) => {
  try {
    const result = await ptero.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ptero/nodes", async (req, res) => {
  try {
    const nodes = await ptero.getNodes();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ptero/locations", async (req, res) => {
  try {
    const locations = await ptero.getLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ptero/nests", async (req, res) => {
  try {
    const nests = await ptero.getNestsWithEggs();
    res.json(nests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ptero/nodes/:nodeId/allocations", async (req, res) => {
  try {
    const allocations = await ptero.getNodeAllocations(
      parseInt(req.params.nodeId),
    );
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GAMES API ====================

router.get("/games", async (req, res) => {
  try {
    const result = await db.select().from(games).orderBy(games.sortOrder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/games", async (req, res) => {
  try {
    const { name, description, icon, pteroNestId, isActive, sortOrder } =
      req.body;
    const now = new Date().toISOString();
    const [game] = await db
      .insert(games)
      .values({
        name,
        description,
        icon,
        pteroNestId: pteroNestId ? parseInt(pteroNestId) : null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
        createdAt: now,
      })
      .returning();
    res.json(game);
  } catch (error) {
    console.error("Create game error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/games/:id", async (req, res) => {
  try {
    const { name, description, icon, pteroNestId, isActive, sortOrder } =
      req.body;
    const [game] = await db
      .update(games)
      .set({
        name,
        description,
        icon,
        pteroNestId: pteroNestId ? parseInt(pteroNestId) : null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
      })
      .where(eq(games.id, parseInt(req.params.id)))
      .returning();
    res.json(game);
  } catch (error) {
    console.error("Update game error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/games/:id", async (req, res) => {
  try {
    await db.delete(games).where(eq(games.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== KERNELS API ====================

router.get("/kernels", async (req, res) => {
  try {
    const result = await db.select().from(kernels).orderBy(kernels.sortOrder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/kernels/by-game/:gameId", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(kernels)
      .where(eq(kernels.gameId, parseInt(req.params.gameId)))
      .orderBy(kernels.sortOrder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/kernels", async (req, res) => {
  try {
    const {
      gameId,
      name,
      description,
      pteroEggId,
      pteroNestId,
      dockerImage,
      startup,
      environment,
      isActive,
      sortOrder,
    } = req.body;
    const now = new Date().toISOString();
    const parseIntOrNull = (val) => {
      if (!val || val === "") return null;
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    };
    const [kernel] = await db
      .insert(kernels)
      .values({
        gameId: parseIntOrNull(gameId),
        name,
        description,
        pteroEggId: parseIntOrNull(pteroEggId),
        pteroNestId: parseIntOrNull(pteroNestId),
        dockerImage,
        startup,
        environment: environment ? JSON.stringify(environment) : null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
        createdAt: now,
      })
      .returning();
    res.json(kernel);
  } catch (error) {
    console.error("Create kernel error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/kernels/:id", async (req, res) => {
  try {
    const {
      gameId,
      name,
      description,
      pteroEggId,
      pteroNestId,
      dockerImage,
      startup,
      environment,
      isActive,
      sortOrder,
    } = req.body;
    const parseIntOrNull = (val) => {
      if (!val || val === "") return null;
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    };
    const [kernel] = await db
      .update(kernels)
      .set({
        gameId: parseIntOrNull(gameId),
        name,
        description,
        pteroEggId: parseIntOrNull(pteroEggId),
        pteroNestId: parseIntOrNull(pteroNestId),
        dockerImage,
        startup,
        environment: environment ? JSON.stringify(environment) : null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
      })
      .where(eq(kernels.id, parseInt(req.params.id)))
      .returning();
    res.json(kernel);
  } catch (error) {
    console.error("Update kernel error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/kernels/:id", async (req, res) => {
  try {
    await db.delete(kernels).where(eq(kernels.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Синхронизация игр и ядер из Pterodactyl
router.post("/ptero/sync", async (req, res) => {
  try {
    const nests = await ptero.getNestsWithEggs();
    let gamesCreated = 0;
    let kernelsCreated = 0;

    for (const nest of nests) {
      // Создаём или обновляем игру
      const existingGame = await db
        .select()
        .from(games)
        .where(eq(games.pteroNestId, nest.id))
        .get();

      if (existingGame) {
        await db
          .update(games)
          .set({
            name: nest.name,
            description: nest.description || "",
            icon: null,
          })
          .where(eq(games.id, existingGame.id));
      } else {
        await db.insert(games).values({
          name: nest.name,
          description: nest.description || "",
          icon: null,
          pteroNestId: nest.id,
          isActive: 1,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
        });
        gamesCreated++;
      }

      // Получаем ID созданной/обновленной игры
      const game = await db
        .select()
        .from(games)
        .where(eq(games.pteroNestId, nest.id))
        .get();

      // Создаём или обновляем ядра (яйца)
      for (const egg of nest.eggs) {
        const existingKernel = await db
          .select()
          .from(kernels)
          .where(eq(kernels.pteroEggId, egg.id))
          .get();

        if (existingKernel) {
          await db
            .update(kernels)
            .set({
              gameId: game ? game.id : null,
              name: egg.name,
              description: egg.description || "",
              dockerImage: egg.dockerImage,
              startup: egg.startup,
              pteroNestId: nest.id,
              environment: null, // Переменные получаем динамически при создании сервера
            })
            .where(eq(kernels.id, existingKernel.id));
        } else {
          await db.insert(kernels).values({
            gameId: game ? game.id : null,
            name: egg.name,
            description: egg.description || "",
            pteroEggId: egg.id,
            pteroNestId: nest.id,
            dockerImage: egg.dockerImage,
            startup: egg.startup,
            environment: null,
            isActive: 1,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
          });
          kernelsCreated++;
        }
      }
    }

    res.json({
      success: true,
      message: `Синхронизировано: ${gamesCreated} игр, ${kernelsCreated} ядер`,
      gamesCreated,
      kernelsCreated,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
