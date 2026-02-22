import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import * as ptero from '../services/pterodactyl.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Имя пользователя занято' });
    }

    // Try to create user in Pterodactyl first if configured
    let pteroUserId = null;
    try {
      const pteroUser = await ptero.createPteroUser({
        email,
        username,
        firstName: username,
        lastName: 'User'
      });
      pteroUserId = pteroUser.attributes.id;
    } catch (pteroError) {
      console.error('Pterodactyl registration error:', pteroError.response?.data || pteroError.message);
      // We continue even if Ptero fails, but log it
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      email,
      username,
      passwordHash,
      role: 'user',
      status: 'active',
      pteroUserId: pteroUserId,
    }).returning();

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role, balance: user.balance } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Ошибка выхода' });
    res.json({ success: true });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role, balance: user.balance, status: user.status, createdAt: user.createdAt } });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
