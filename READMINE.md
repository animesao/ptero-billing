# PteroBilling - Биллинг-панель для Pterodactyl

## Overview
Биллинг-панель для управления игровыми серверами через Pterodactyl Panel API. Включает регистрацию/авторизацию, каталог тарифов, систему заказов, управление серверами, тикеты поддержки и полноценную админ-панель.

## Tech Stack
- **Backend:** Node.js + Express 5 (ESM modules)
- **Frontend:** React 19 + Tailwind CSS 3.4 + React Router 7
- **Database:** PostgreSQL (Replit built-in)
- **ORM:** Drizzle ORM
- **Auth:** express-session + connect-pg-simple
- **API Integration:** Axios (Pterodactyl API)

## Project Structure
```
server/
  index.js          - Express server, DB init, static file serving
  db.js             - Database connection (Drizzle + postgres.js)
  schema.js         - Drizzle schema definitions
  routes/
    auth.js         - Registration, login, logout, session check
    admin.js        - Admin CRUD for users, plans, orders, tickets, settings
    user.js         - User dashboard, orders, payments, tickets, profile
  services/
    pterodactyl.js  - Pterodactyl Panel API integration
  middleware/
    auth.js         - requireAuth, requireAdmin middleware
client/
  src/
    App.jsx         - Main app with routing, sidebar, theme toggle
    api.js          - API client wrapper
    components/     - Shared components (StatusBadge)
    pages/
      LoginPage.jsx, RegisterPage.jsx
      user/         - Dashboard, Servers, Plans, Orders, Payments, Tickets, Profile
      admin/        - AdminDashboard, Users, Plans, Orders, Servers, Payments, Tickets, Settings, Logs
```

## Default Admin Account
- Email: admin@pterobilling.local
- Password: admin123

## Key Features
- User registration/login with sessions
- Admin panel with full CRUD for all entities
- Plan management (CPU, RAM, disk, slots, DB limit, backups, pricing periods)
- Order system with balance-based payments
- Pterodactyl API integration (server create/delete/suspend)
- Ticket support system with categories and priorities
- Dark/light theme toggle
- Audit logs
- Settings management (Pterodactyl config, payment providers, site settings)

## Database Tables
users, plans, orders, servers, payments, ticket_categories, tickets, ticket_messages, ticket_attachments, settings, audit_logs

## Running
- Development: `node server/index.js` (serves built React app on port 5000)
- Build client: `npm run build:client`
- Port: 5000

## Recent Changes
- Initial build: full billing panel MVP with all modules
