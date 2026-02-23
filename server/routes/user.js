import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, client } from "../db.js";
import {
  users,
  plans,
  orders,
  servers,
  payments,
  tickets,
  ticketMessages,
  ticketCategories,
} from "../schema.js";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import * as ptero from "../services/pterodactyl.js";
import {
  createPteroServer,
  deletePteroServer,
  getServerStatus,
} from "../services/create-server.js";

const router = Router();
router.use(requireAuth);

router.get("/plans", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.sortOrder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить гнёзда с яйцами (для заказа сервера)
router.get("/pterodactyl/nests", async (req, res) => {
  try {
    const nests = await ptero.getNestsWithEggs();
    res.json(nests);
  } catch (error) {
    console.error("Error getting nests:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/servers", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(servers)
      .where(eq(servers.userId, req.session.userId))
      .orderBy(desc(servers.createdAt));

    // Синхронизируем статус для всех серверов с pteroServerId
    for (const server of result) {
      if (server.pteroServerId) {
        try {
          const pteroStatus = await getServerStatus(server.pteroServerId);
          let newStatus = server.status;

          if (pteroStatus === "running") newStatus = "running";
          else if (pteroStatus === "installing") newStatus = "installing";
          else if (pteroStatus === "reinstalling") newStatus = "reinstalling";
          else if (pteroStatus === "offline") newStatus = "offline";
          else if (pteroStatus === "starting") newStatus = "starting";
          else if (pteroStatus === "stopping") newStatus = "stopping";
          else if (pteroStatus === "restarting") newStatus = "restarting";
          else if (pteroStatus === "suspended") newStatus = "suspended";

          if (newStatus !== server.status) {
            await db
              .update(servers)
              .set({ status: newStatus })
              .where(eq(servers.id, server.id));
            console.log(
              `Server ${server.name} status synced: ${server.status} -> ${newStatus}`,
            );
          }
        } catch (e) {
          console.error(
            `Failed to sync status for server ${server.id}:`,
            e.message,
          );
        }
      }
    }

    // Добавляем информацию о заказе (срок действия)
    const serversWithOrder = [];
    for (const server of result) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, server.orderId));
      serversWithOrder.push({
        ...server,
        orderExpiresAt: order?.expiresAt || null,
        orderStatus: order?.status || null,
      });
    }

    res.json(serversWithOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить настройки сервера
router.get("/servers/:id/settings", async (req, res) => {
  try {
    const [server] = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.id, parseInt(req.params.id)),
          eq(servers.userId, req.session.userId),
        ),
      );
    if (!server) return res.status(404).json({ error: "Сервер не найден" });

    // Получаем информацию о заказе и тарифе
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, server.orderId));
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, order?.planId));

    res.json({
      server,
      order: order
        ? {
            expiresAt: order.expiresAt,
            status: order.status,
          }
        : null,
      plan: plan
        ? {
            cpu: plan.cpu,
            ramMb: plan.ramMb,
            diskMb: plan.diskMb,
            eggId: plan.eggId,
            nestId: plan.nestId,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить настройки сервера
router.put("/servers/:id/settings", async (req, res) => {
  try {
    const [server] = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.id, parseInt(req.params.id)),
          eq(servers.userId, req.session.userId),
        ),
      );
    if (!server) return res.status(404).json({ error: "Сервер не найден" });

    const { name, cpu, ramMb, diskMb } = req.body;
    const updates = {};

    if (name && name !== server.name) {
      updates.name = name;
    }

    // Получаем тариф для проверки лимитов
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, server.orderId));
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, order?.planId));

    // Можно изменить только в пределах тарифа
    if (cpu !== undefined && plan) {
      updates.cpu = Math.min(parseInt(cpu), plan.cpu);
    }
    if (ramMb !== undefined && plan) {
      updates.ramMb = Math.min(parseInt(ramMb), plan.ramMb);
    }
    if (diskMb !== undefined && plan) {
      updates.diskMb = Math.min(parseInt(diskMb), plan.diskMb);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(servers).set(updates).where(eq(servers.id, server.id));

      // Обновляем в Pterodactyl если есть сервер
      if (server.pteroServerId) {
        try {
          await ptero.updateServerBuild(server.pteroServerId, {
            cpu: updates.cpu || server.cpu,
            memory: updates.ramMb || server.ramMb,
            disk: updates.diskMb || server.diskMb,
          });
        } catch (e) {
          console.error("Error updating Pterodactyl server:", e.message);
        }
      }
    }

    res.json({ success: true, server: { ...server, ...updates } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Продлить сервер
router.post("/servers/:id/renew", async (req, res) => {
  try {
    const [server] = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.id, parseInt(req.params.id)),
          eq(servers.userId, req.session.userId),
        ),
      );
    if (!server) return res.status(404).json({ error: "Сервер не найден" });

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, server.orderId));
    if (!order) return res.status(404).json({ error: "Заказ не найден" });

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, order.planId));
    if (!plan) return res.status(404).json({ error: "Тариф не найден" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));

    // Определяем цену в зависимости от текущего периода
    let amount = plan.priceMonthly;
    let periodMonths = 1;
    if (order.billingPeriod === "quarterly") {
      amount = plan.priceQuarterly || plan.priceMonthly * 3;
      periodMonths = 3;
    } else if (order.billingPeriod === "yearly") {
      amount = plan.priceYearly || plan.priceMonthly * 12;
      periodMonths = 12;
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "Недостаточно средств на балансе" });
    }

    // Списываем средства
    await db
      .update(users)
      .set({ balance: user.balance - amount })
      .where(eq(users.id, req.session.userId));

    // Продлеваем заказ
    const newExpiresAt = new Date(order.expiresAt || new Date());
    newExpiresAt.setMonth(newExpiresAt.getMonth() + periodMonths);

    await db
      .update(orders)
      .set({
        expiresAt: newExpiresAt.toISOString(),
        status: "active",
      })
      .where(eq(orders.id, order.id));

    // Создаём запись о платеже
    await db.insert(payments).values({
      orderId: order.id,
      userId: req.session.userId,
      provider: "balance",
      amount,
      status: "completed",
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, newExpiresAt: newExpiresAt.toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить доступные яйца для сервера
router.get("/servers/:id/eggs", async (req, res) => {
  try {
    const [server] = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.id, parseInt(req.params.id)),
          eq(servers.userId, req.session.userId),
        ),
      );
    if (!server) return res.status(404).json({ error: "Сервер не найден" });

    // Получаем текущий план сервера
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, server.orderId));
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, order?.planId));

    if (!plan) return res.status(404).json({ error: "Тариф не найден" });

    // Получаем все яйца из того же гнезда (nest)
    const eggs = await ptero.getEggsInNest(plan.nestId);

    res.json({
      currentEggId: plan.eggId,
      eggs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Сменить яйцо сервера
router.post("/servers/:id/change-egg", async (req, res) => {
  try {
    const { eggId } = req.body;
    if (!eggId) return res.status(400).json({ error: "Не указано яйцо" });

    const [server] = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.id, parseInt(req.params.id)),
          eq(servers.userId, req.session.userId),
        ),
      );
    if (!server) return res.status(404).json({ error: "Сервер не найден" });

    if (!server.pteroServerId) {
      return res
        .status(400)
        .json({ error: "Сервер ещё не создан в Pterodactyl" });
    }

    // Получаем информацию о текущем заказе
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, server.orderId));
    if (!order) return res.status(404).json({ error: "Заказ не найден" });

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, order.planId));
    if (!plan) return res.status(404).json({ error: "Тариф не найден" });

    // Получаем информацию о новом яйце
    const egg = await ptero.getEgg(plan.nestId, eggId);
    if (!egg) return res.status(404).json({ error: "Яйцо не найдено" });

    // Получаем ID пользователя в Pterodactyl
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));
    const pteroUserId = user.pteroUserId || 1;

    // Запускаем переустановку сервера в Pterodactyl с новым яйцом (удаление + создание)
    // Используем allocationId из базы данных
    const result = await ptero.reinstallServerWithEgg(server.pteroServerId, {
      egg: eggId,
      dockerImage: egg.attributes?.docker_image || plan.dockerImage,
      startup: egg.attributes?.startup || plan.startup,
      serverName: server.name,
      userId: pteroUserId,
      nodeId: plan.nodeId,
      allocationId: server.pteroAllocationId || plan.allocationId, // Берём из БД сервера
      limits: {
        memory: plan.ramMb || server.ramMb,
        swap: 0,
        disk: plan.diskMb || server.diskMb,
        io: 500,
        cpu: plan.cpu || server.cpu,
      },
      featureLimits: {
        databases: plan.dbLimit || 0,
        backups: plan.backupLimit || 0,
        allocations: plan.slots || 1,
      },
    });

    // Обновляем pteroServerId и identifier в БД
    await db
      .update(servers)
      .set({
        pteroServerId: result.pteroServerId,
        pteroIdentifier: result.identifier,
        pteroAllocationId: result.allocationId || server.pteroAllocationId,
        status: "installing",
      })
      .where(eq(servers.id, server.id));

    // Обновляем план в БД с новыми настройками яйца
    await db
      .update(plans)
      .set({
        eggId: eggId,
        dockerImage: egg.attributes?.docker_image || plan.dockerImage,
        startup: egg.attributes?.startup || plan.startup,
      })
      .where(eq(plans.id, plan.id));

    res.json({
      success: true,
      message: "Сервер переустановлен с новым ядром. Все данные удалены.",
    });
  } catch (error) {
    console.error("Change egg error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.session.userId))
      .orderBy(desc(orders.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { planId, billingPeriod, serverName, eggId } = req.body;
    let [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, parseInt(planId)));
    if (!plan) return res.status(404).json({ error: "Тариф не найден" });

    // Если указано яйцо, используем его для создания сервера
    let planToUse = plan;
    if (eggId && eggId !== plan.eggId) {
      planToUse = { ...plan, eggId };
    }

    let amount = plan.priceMonthly;
    if (billingPeriod === "quarterly" && plan.priceQuarterly)
      amount = plan.priceQuarterly;
    if (billingPeriod === "yearly" && plan.priceYearly)
      amount = plan.priceYearly;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));
    if (user.balance < amount) {
      return res.status(400).json({ error: "Недостаточно средств на балансе" });
    }

    const periodMonths =
      billingPeriod === "yearly" ? 12 : billingPeriod === "quarterly" ? 3 : 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + periodMonths);

    // Update user balance
    await db
      .update(users)
      .set({ balance: user.balance - amount })
      .where(eq(users.id, req.session.userId));

    const now = new Date().toISOString();
    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        userId: req.session.userId,
        planId: plan.id,
        status: "active",
        billingPeriod: billingPeriod || "monthly",
        amount,
        expiresAt: expiresAt.toISOString(),
        createdAt: now,
      })
      .returning();

    // Create payment record
    await db.insert(payments).values({
      orderId: order.id,
      userId: req.session.userId,
      provider: "balance",
      amount,
      status: "completed",
      createdAt: now,
    });

    // Create server
    const sName = serverName || `${plan.name}-${order.id}`;
    let serverRecord;
    try {
      const pteroResult = await createPteroServer({
        name: sName,
        userId: req.session.userId,
        plan: planToUse,
        pteroUserId: user.pteroUserId || 1,
      });

      const pteroServerId = pteroResult.attributes?.id || null;
      const pteroIdentifier = pteroResult.attributes?.identifier || null;

      // Получаем allocation ID из ответа Pterodactyl
      const pteroAllocationId =
        pteroResult.relationships?.allocations?.data?.[0]?.id || null;

      // Получаем статус сервера из Pterodactyl
      let status = "installing";
      try {
        const pteroStatus = await getServerStatus(pteroServerId);
        console.log("Pterodactyl server status:", pteroStatus);
        if (pteroStatus === "installing") status = "installing";
        else if (pteroStatus === "running") status = "running";
        else if (pteroStatus === "offline") status = "offline";
        else if (pteroStatus === "suspended") status = "suspended";
      } catch (e) {
        console.error("Error getting server status:", e.message);
      }

      serverRecord = await db
        .insert(servers)
        .values({
          userId: req.session.userId,
          orderId: order.id,
          pteroServerId,
          pteroIdentifier,
          pteroAllocationId, // Сохраняем ID аллокации
          name: sName,
          status,
          cpu: plan.cpu,
          ramMb: plan.ramMb,
          diskMb: plan.diskMb,
          createdAt: now,
        })
        .returning();
    } catch (pteroError) {
      console.error("Pterodactyl error:", pteroError);
      serverRecord = await db
        .insert(servers)
        .values({
          userId: req.session.userId,
          orderId: order.id,
          name: sName,
          status: "pending_setup",
          cpu: plan.cpu,
          ramMb: plan.ramMb,
          diskMb: plan.diskMb,
          createdAt: now,
        })
        .returning();
    }

    res.json({ order, server: serverRecord[0] });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, req.session.userId))
      .orderBy(desc(payments.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/balance/add", async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = parseInt(amount);
    if (!amt || amt <= 0)
      return res.status(400).json({ error: "Некорректная сумма" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));
    await db
      .update(users)
      .set({ balance: user.balance + amt })
      .where(eq(users.id, req.session.userId));

    await db.insert(payments).values({
      userId: req.session.userId,
      provider: "manual",
      amount: amt,
      status: "completed",
      createdAt: new Date().toISOString(),
    });

    res.json({ balance: user.balance + amt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, req.session.userId))
      .orderBy(desc(tickets.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tickets", async (req, res) => {
  try {
    const { subject, categoryId, body, priority } = req.body;
    if (!subject || !body)
      return res.status(400).json({ error: "Тема и сообщение обязательны" });

    const now = new Date().toISOString();
    const [ticket] = await db
      .insert(tickets)
      .values({
        userId: req.session.userId,
        categoryId: categoryId ? parseInt(categoryId) : null,
        subject,
        priority: priority || "normal",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      userId: req.session.userId,
      body,
      createdAt: now,
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tickets/:id", async (req, res) => {
  try {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, parseInt(req.params.id)),
          eq(tickets.userId, req.session.userId),
        ),
      );
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
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, parseInt(req.params.id)),
          eq(tickets.userId, req.session.userId),
        ),
      );
    if (!ticket) return res.status(404).json({ error: "Тикет не найден" });

    const now = new Date().toISOString();
    const [msg] = await db
      .insert(ticketMessages)
      .values({
        ticketId: ticket.id,
        userId: req.session.userId,
        body,
        createdAt: now,
      })
      .returning();
    await db
      .update(tickets)
      .set({ updatedAt: now, status: "open" })
      .where(eq(tickets.id, ticket.id));
    res.json(msg);
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

router.put("/profile", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));

    const updates = {};
    if (username && username !== user.username) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      if (existing.length > 0)
        return res.status(400).json({ error: "Имя пользователя занято" });
      updates.username = username;
    }

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ error: "Введите текущий пароль" });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid)
        return res.status(400).json({ error: "Неверный текущий пароль" });
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(users)
        .set(updates)
        .where(eq(users.id, req.session.userId));
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
