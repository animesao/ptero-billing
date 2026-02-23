import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
import * as ptero from "../services/pterodactyl-users.js";

const router = Router();

// Санитизация username: оставляем только буквы, цифры, тире, подчёркивания, точки
// Username должен начинаться и заканчиваться на букву или цифру
function sanitizeUsername(username) {
  if (!username) return "";
  // Удаляем все недопустимые символы
  let sanitized = username.replace(/[^a-zA-Z0-9._-]/g, "");
  // Удаляем недопустимые символы с начала и конца
  sanitized = sanitized.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
  return sanitized;
}

// Валидация email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Пароль минимум 6 символов" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Некорректный email" });
    }

    // Санитизируем username
    const sanitizedUsername = sanitizeUsername(username);
    if (sanitizedUsername.length < 2) {
      return res.status(400).json({
        error:
          "Имя пользователя должно содержать минимум 2 допустимых символа (буквы, цифры, тире, подчёркивания, точки)",
        originalUsername: username,
        sanitizedUsername: sanitizedUsername || "(пусто)",
      });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email уже зарегистрирован" });
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, sanitizedUsername))
      .limit(1);
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: "Имя пользователя занято" });
    }

    // Проверяем подключение к Pterodactyl перед регистрацией
    let pteroConfigured = false;
    try {
      await ptero.testConnection();
      pteroConfigured = true;
      console.log("Pterodactyl connection test passed");
    } catch (pteroConnError) {
      console.log(
        "Pterodactyl not configured or connection failed, skipping Ptero user creation",
      );
    }

    // Создаём пользователя в Pterodactyl если он настроен
    let pteroUserId = null;
    if (pteroConfigured) {
      try {
        const pteroUser = await ptero.createPteroUser({
          email,
          username: sanitizedUsername,
          firstName: sanitizedUsername,
          lastName: "User",
          password,
        });
        pteroUserId = pteroUser.attributes?.id;
        console.log("Pterodactyl user created:", pteroUserId);
      } catch (pteroError) {
        const pteroData = pteroError.response?.data;
        const pteroErrors = pteroData?.errors || [];
        const pteroMessage = pteroError.message || "";

        console.error(
          "Pterodactyl registration error:",
          JSON.stringify(pteroData, null, 2),
        );

        // Проверяем на дубликаты email/username
        const isDuplicateEmail =
          pteroErrors.some(
            (e) =>
              e.detail
                ?.toLowerCase()
                .includes("email has already been taken") ||
              e.detail?.toLowerCase().includes("email уже") ||
              e.detail?.toLowerCase().includes("email must be unique"),
          ) ||
          (pteroMessage.toLowerCase().includes("email") &&
            pteroMessage.toLowerCase().includes("taken"));

        const isDuplicateUsername =
          pteroErrors.some(
            (e) =>
              e.detail
                ?.toLowerCase()
                .includes("username has already been taken") ||
              e.detail?.toLowerCase().includes("username уже") ||
              e.detail?.toLowerCase().includes("username must be unique"),
          ) ||
          (pteroMessage.toLowerCase().includes("username") &&
            pteroMessage.toLowerCase().includes("taken"));

        const isInvalidUsername =
          pteroErrors.some(
            (e) =>
              e.detail?.toLowerCase().includes("username must start") ||
              (e.detail?.toLowerCase().includes("username") &&
                e.detail?.toLowerCase().includes("contain only")),
          ) ||
          (pteroMessage.toLowerCase().includes("username") &&
            pteroMessage.toLowerCase().includes("invalid"));

        if (isDuplicateEmail) {
          return res
            .status(400)
            .json({ error: "Email уже зарегистрирован в Pterodactyl" });
        }
        if (isDuplicateUsername) {
          return res
            .status(400)
            .json({ error: "Имя пользователя уже занято в Pterodactyl" });
        }
        if (isInvalidUsername) {
          return res.status(400).json({
            error:
              "Имя пользователя содержит недопустимые символы. Разрешены только буквы, цифры, тире, подчёркивания и точки.",
            suggestion: sanitizedUsername + "_user",
          });
        }

        // Для других ошибок - возвращаем детальное сообщение
        const errorDetails =
          pteroErrors.map((e) => e.detail).join(", ") || pteroMessage;
        return res.status(400).json({
          error: "Ошибка при создании пользователя в Pterodactyl",
          details: errorDetails,
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
        role: "user",
        status: "active",
        pteroUserId: pteroUserId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ error: "Аккаунт заблокирован" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Ошибка входа" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Ошибка выхода" });
    res.json({ success: true });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Не авторизован" });
  }
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);
    if (!user) return res.status(401).json({ error: "Пользователь не найден" });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        balance: user.balance,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
