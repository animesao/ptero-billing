import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { db, client, dbType } from "./db.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS setup for development
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5000'],
  credentials: true,
}));

// Session store setup depends on DB type
let sessionStore;
if (dbType === "postgres") {
  const PgSession = connectPgSimple(session);
  sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  });
} else {
  // For MySQL and SQLite, use memory store for simplicity
  const sessionMemoryStore = new session.MemoryStore();
  sessionStore = sessionMemoryStore;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(express.static(path.join(__dirname, "..", "client", "dist")));

app.get("/{*path}", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});

async function initDatabaseSQLite() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        ptero_user_id INTEGER,
        balance INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        cpu INTEGER NOT NULL,
        ram_mb INTEGER NOT NULL,
        disk_mb INTEGER NOT NULL,
        slots INTEGER NOT NULL DEFAULT 0,
        db_limit INTEGER NOT NULL DEFAULT 0,
        backup_limit INTEGER NOT NULL DEFAULT 0,
        price_monthly INTEGER NOT NULL,
        price_quarterly INTEGER,
        price_yearly INTEGER,
        nest_id INTEGER,
        egg_id INTEGER,
        node_ids TEXT,
        allocation_id INTEGER,
        docker_image TEXT,
        startup TEXT,
        environment TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);
    // Добавить колонки если не существуют
    try { await client.execute(`ALTER TABLE plans ADD COLUMN node_ids TEXT`); } catch (e) { /* уже есть */ }
    try { await client.execute(`ALTER TABLE plans ADD COLUMN docker_image TEXT`); } catch (e) { /* уже есть */ }
    try { await client.execute(`ALTER TABLE plans ADD COLUMN startup TEXT`); } catch (e) { /* уже есть */ }
    try { await client.execute(`ALTER TABLE plans ADD COLUMN environment TEXT`); } catch (e) { /* уже есть */ }
    try { await client.execute(`ALTER TABLE plans ADD COLUMN ptero_instance_id TEXT`); } catch (e) { /* уже есть */ }
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        billing_period TEXT NOT NULL DEFAULT 'monthly',
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'RUB',
        expires_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES plans(id)
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_id INTEGER,
        ptero_server_id INTEGER,
        ptero_identifier TEXT,
        ptero_allocation_id INTEGER,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'installing',
        cpu INTEGER,
        ram_mb INTEGER,
        disk_mb INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);
    // Добавить колонку ptero_allocation_id если не существует
    try { await client.execute(`ALTER TABLE servers ADD COLUMN ptero_allocation_id INTEGER`); } catch (e) { /* уже есть */ }
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'RUB',
        status TEXT NOT NULL DEFAULT 'pending',
        external_id TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ticket_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'normal',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES ticket_categories(id)
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        FOREIGN KEY (message_id) REFERENCES ticket_messages(id)
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        "group" TEXT NOT NULL DEFAULT 'general'
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER,
        action TEXT NOT NULL,
        entity TEXT,
        entity_id INTEGER,
        details TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (actor_id) REFERENCES users(id)
      )
    `);

    const adminCheck = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    if (adminCheck.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        email: "admin@pterobilling.local",
        username: "admin",
        passwordHash: hash,
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
      });
      console.log("Admin created: admin@pterobilling.local / admin123");
    }

    console.log("SQLite database initialized");
  } catch (error) {
    console.error("SQLite database init error:", error);
  }
}

async function initDatabaseMySQL() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        balance INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cpu INT NOT NULL,
        ram_mb INT NOT NULL,
        disk_mb INT NOT NULL,
        slots INT NOT NULL DEFAULT 0,
        db_limit INT NOT NULL DEFAULT 0,
        backup_limit INT NOT NULL DEFAULT 0,
        price_monthly INT NOT NULL,
        price_quarterly INT,
        price_yearly INT,
        nest_id INT,
        egg_id INT,
        node_id INT,
        allocation_id INT,
        docker_image TEXT,
        startup TEXT,
        environment TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        plan_id INT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
        amount INT NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES plans(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS servers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_id INT,
        ptero_server_id INT,
        ptero_identifier VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'installing',
        cpu INT,
        ram_mb INT,
        disk_mb INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        user_id INT NOT NULL,
        provider VARCHAR(30) NOT NULL,
        amount INT NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        external_id VARCHAR(255),
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sort_order INT NOT NULL DEFAULT 0
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES ticket_categories(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100),
        size INT,
        FOREIGN KEY (message_id) REFERENCES ticket_messages(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        group VARCHAR(50) NOT NULL DEFAULT 'general'
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor_id INT,
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(50),
        entity_id INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (actor_id) REFERENCES users(id)
      )
    `);

    const adminCheck = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    if (adminCheck.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        email: "admin@pterobilling.local",
        username: "admin",
        passwordHash: hash,
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
      });
      console.log("Admin created: admin@pterobilling.local / admin123");
    }

    console.log("MySQL database initialized");
  } catch (error) {
    console.error("MySQL database init error:", error);
  }
}

async function initDatabasePostgres() {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        balance INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cpu INTEGER NOT NULL,
        ram_mb INTEGER NOT NULL,
        disk_mb INTEGER NOT NULL,
        slots INTEGER NOT NULL DEFAULT 0,
        db_limit INTEGER NOT NULL DEFAULT 0,
        backup_limit INTEGER NOT NULL DEFAULT 0,
        price_monthly INTEGER NOT NULL,
        price_quarterly INTEGER,
        price_yearly INTEGER,
        nest_id INTEGER,
        egg_id INTEGER,
        node_id INTEGER,
        allocation_id INTEGER,
        docker_image TEXT,
        startup TEXT,
        environment TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES plans(id),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
        amount INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS servers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        order_id INTEGER REFERENCES orders(id),
        ptero_server_id INTEGER,
        ptero_identifier VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'installing',
        cpu INTEGER,
        ram_mb INTEGER,
        disk_mb INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        provider VARCHAR(30) NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        external_id VARCHAR(255),
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS ticket_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER REFERENCES ticket_categories(id),
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES ticket_messages(id),
        filename VARCHAR(255) NOT NULL,
        path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100),
        size INTEGER
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        "group" VARCHAR(50) NOT NULL DEFAULT 'general'
      )
    `;
    await client`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(50),
        entity_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    const adminCheck = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    if (adminCheck.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        email: "admin@pterobilling.local",
        username: "admin",
        passwordHash: hash,
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
      });
      console.log("Admin created: admin@pterobilling.local / admin123");
    }

    console.log("PostgreSQL database initialized");
  } catch (error) {
    console.error("PostgreSQL database init error:", error);
  }
}

async function initDatabase() {
  if (dbType === "mysql") {
    await initDatabaseMySQL();
  } else if (dbType === "postgres") {
    await initDatabasePostgres();
  } else {
    await initDatabaseSQLite();
  }
}

// Синхронизация статусов серверов каждые 30 секунд
async function syncServerStatuses() {
  try {
    const { db } = await import('./db.js');
    const { servers } = await import('./schema.js');
    const { eq } = await import('drizzle-orm');
    const ptero = await import('./services/pterodactyl.js');

    const allServers = await db.select().from(servers);
    for (const server of allServers) {
      if (server.pteroServerId) {
        try {
          const pteroStatus = await ptero.getServerStatus(server.pteroServerId);
          let newStatus = server.status;

          // Синхронизируем статусы
          if (pteroStatus === 'running') newStatus = 'running';
          else if (pteroStatus === 'installing') newStatus = 'installing';
          else if (pteroStatus === 'reinstalling') newStatus = 'reinstalling';
          else if (pteroStatus === 'offline') newStatus = 'offline';
          else if (pteroStatus === 'starting') newStatus = 'starting';
          else if (pteroStatus === 'stopping') newStatus = 'stopping';
          else if (pteroStatus === 'restarting') newStatus = 'restarting';
          else if (pteroStatus === 'suspended') newStatus = 'suspended';

          if (newStatus !== server.status) {
            await db.update(servers)
              .set({ status: newStatus })
              .where(eq(servers.id, server.id));
            console.log(`Server ${server.name} status updated: ${server.status} -> ${newStatus}`);
          }
        } catch (e) {
          // Игнорируем ошибки
        }
      }
    }
  } catch (error) {
    // Игнорируем ошибки синхронизации
  }
}

initDatabase().then(() => {
  app.listen(5000, "0.0.0.0", () => {
    console.log(`PteroBilling server running on port 5000 (using ${dbType})`);
    // Запускаем синхронизацию статусов каждые 5 секунд
    setInterval(syncServerStatuses, 5000);
  });
});
