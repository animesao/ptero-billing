# 🚀 PteroBilling

Современная биллинг-панель для управления серверами Pterodactyl с красивым UI и поддержкой SQLite/PostgreSQL/MySQL.

![Версия](https://img.shields.io/badge/version-1.0.3-blue.svg)
![Лицензия](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Содержание

- [Возможности](#-возможности)
- [Технологии](#-технологии)
- [Требования](#-требования)
- [Установка](#-установка)
- [Настройка](#-настройка)
- [Запуск](#-запуск)
- [Настройка Pterodactyl](#-настройка-pterodactyl)
- [Использование](#-использование)
- [Структура проекта](#-структура-проекта)
- [API](#-api)
- [Устранение проблем](#-устранение-проблем)

---

## ✨ Возможности

### Для пользователей:
- 📦 Просмотр и заказ тарифов
- 🎮 Выбор игры и ядра сервера
- 💳 Управление балансом
- 🖥️ Управление серверами (просмотр, продление, смена ядра)
- 🎫 Система тикетов поддержки
- 👤 Личный кабинет

### Для администраторов:
- 📊 Статистика и аналитика
- 👥 Управление пользователями
- 📦 Управление тарифами
- 🖥️ Управление серверами
- 💰 Управление платежами
- 🎫 Управление тикетами
- ⚙️ Настройки Pterodactyl
- 📝 Audit logs

---

## 🛠 Технологии

| Компонент | Технология |
|-----------|------------|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | Node.js + Express 5 |
| База данных | SQLite / PostgreSQL / MySQL |
| ORM | Drizzle ORM |
| Авторизация | express-session |
| Pterodactyl | REST API |

---

## 📋 Требования

- **Node.js** версии 18.x или выше
- **npm** или **yarn**
- **Pterodactyl Panel** (версия 1.x)
- **База данных** (SQLite по умолчанию, опционально PostgreSQL/MySQL)

---

## 📦 Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/animesao/ptero-billing.git
cd ptero-billing
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Скопируйте файл `.env` и настройте его:

```bash
cp .env .env.local
```

---

## ⚙️ Настройка

### Базовая настройка (.env)

```env
# Тип базы данных (sqlite, postgres, mysql)
DATABASE_TYPE=sqlite

# Для PostgreSQL раскомментируйте и настройте:
# DATABASE_TYPE=postgres
# DATABASE_URL=postgresql://user:password@localhost:5432/pterobilling

# Для MySQL раскомментируйте и настройте:
# DATABASE_TYPE=mysql
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_USER=root
# MYSQL_PASSWORD=your_password
# MYSQL_DATABASE=pterobilling

# Секретный ключ сессии (обязательно измените в production!)
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Окружение
NODE_ENV=development
```

### Настройка Pterodactyl

1. Откройте панель Pterodactyl
2. Перейдите в **Admin API** → **Application API**
3. Создайте новый API ключ с правами:
   - `servers` — чтение/запись
   - `users` — чтение/запись
   - `nodes` — чтение
   - `locations` — чтение
   - `nests` — чтение

4. В админ-панели PteroBilling перейдите в **Настройки** и укажите:
   - **Pterodactyl URL**: `https://your-panel.com`
   - **Pterodactyl API Key**: `ptla_xxx...`

---

## 🚀 Запуск

### Режим разработки

```bash
npm run dev
```

Сервер запустится на **http://localhost:5000**

### Запуск в tmux (фоновый режим)

Для запуска сервера в фоновом режиме используйте tmux:

```bash
# Создание новой сессии tmux
tmux new -s ptero-billing

# Запуск сервера
npm run dev

# Отсоединение от сессии (сервер продолжит работать)
# Нажмите Ctrl+B, затем отпустите и нажмите D
```

**Полезные команды tmux:**

```bash
tmux ls                    # Список сессий
tmux attach -t ptero-billing   # Подключиться к сессии
tmux kill-session -t ptero-billing   # Удалить сессию
```

### Production сборка

```bash
# Сборка клиента
npm run build:client

# Запуск сервера
npm start
```

---

## 🎮 Настройка Pterodactyl

### 1. Создание гнезда (Nest) и яйца (Egg)

1. В панели Pterodactyl перейдите в **Nests**
2. Создайте новое гнездо или используйте существующее
3. Добавьте яйца для нужных игр (Paper, BungeeCord, Velocity и т.д.)

### 2. Создание ноды

1. Перейдите в **Nodes**
2. Создайте новую ноду
3. Настройте аллокации (IP:Port)

### 3. Настройка в PteroBilling

1. Войдите как администратор
2. Перейдите в **Админка** → **Тарифы**
3. Создайте новый тариф:
   - Название и описание
   - Ресурсы (CPU, RAM, Диск)
   - Цена для разных периодов
   - Выберите гнездо и яйцо

---

## 💻 Использование

### Первый вход

1. Откройте **http://localhost:5000**
2. Зарегистрируйте первого пользователя
3. В базе данных вручную измените роль на `admin`:

```sql
-- Для SQLite
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';

-- Для PostgreSQL/MySQL
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### Создание тарифа

1. Войдите как администратор
2. Перейдите в **Админка** → **Тарифы** → **Создать тариф**
3. Заполните параметры:
   - Название (например, "GAME-1")
   - CPU (%)
   - RAM (MB)
   - Диск (MB)
   - Цена (месяц/квартал/год)
   - Nest ID и Egg ID из Pterodactyl

### Заказ сервера пользователем

1. Пользователь переходит в **Тарифы**
2. Выбирает подходящий тариф
3. Выбирает игру (гнездо)
4. Выбирает ядро (яйцо)
5. Вводит название сервера
6. Выбирает период оплаты
7. Подтверждает заказ

---

## 📁 Структура проекта

```
ptero-billing/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/         # Страницы
│   │   │   ├── user/      # Пользовательские страницы
│   │   │   └── admin/     # Админские страницы
│   │   ├── api.js         # API клиент
│   │   ├── App.jsx        # Главный компонент
│   │   └── main.jsx       # Точка входа
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                # Backend (Express)
│   ├── routes/
│   │   ├── auth.js        # Маршруты авторизации
│   │   ├── user.js        # Пользовательские маршруты
│   │   └── admin.js       # Админские маршруты
│   ├── services/
│   │   └── pterodactyl.js # Pterodactyl API клиент
│   ├── middleware/
│   │   └── auth.js        # Middleware авторизации
│   ├── db.js              # Подключение к БД
│   ├── schema.js          # Схема БД
│   ├── schema-sqlite.js   # SQLite схема
│   └── index.js           # Точка входа
│
├── uploads/               # Загруженные файлы
├── .env                   # Переменные окружения
├── package.json
└── README.md
```

---

## 🔌 API

### Пользовательские эндпоинты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Получить текущий профиль |
| GET | `/api/user/plans` | Список тарифов |
| GET | `/api/user/servers` | Список серверов |
| GET | `/api/user/pterodactyl/nests` | Список гнёзд Pterodactyl |
| POST | `/api/user/orders` | Создать заказ |
| POST | `/api/user/balance/add` | Пополнить баланс |
| GET | `/api/user/tickets` | Список тикетов |
| POST | `/api/user/tickets` | Создать тикет |

### Админские эндпоинты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/admin/stats` | Статистика |
| GET | `/api/admin/users` | Пользователи |
| DELETE | `/api/admin/users/:id` | Удалить пользователя |
| GET | `/api/admin/plans` | Тарифы |
| POST | `/api/admin/plans` | Создать тариф |
| PUT | `/api/admin/plans/:id` | Обновить тариф |
| GET | `/api/admin/ptero/nests` | Гнёзда Pterodactyl |
| GET | `/api/admin/ptero/nodes` | Ноды Pterodactyl |

---

## 🔧 Устранение проблем

### Ошибка "docker_image field is required"

**Причина:** Яйцо Pterodactyl не содержит docker_image

**Решение:**
- Проверьте настройки яйца в Pterodactyl
- Убедитесь что выбрано правильное гнездо
- Сервер автоматически подставит значения по умолчанию

### Ошибка "FOREIGN KEY constraint failed" при удалении пользователя

**Причина:** Существуют связанные записи

**Решение:**
- Система автоматически удаляет все связанные записи
- Если ошибка сохраняется, проверьте целостность БД

### Не загружаются гнёзда/игры

**Причина:** Неверные учётные данные Pterodactyl

**Решение:**
1. Проверьте API ключ в настройках
2. Убедитесь что URL панели правильный
3. Проверьте права доступа API ключа

### Ошибка подключения к базе данных

**Для PostgreSQL/MySQL:**
- Проверьте правильность подключения
- Убедитесь что БД существует
- Проверьте учётные данные

**Для SQLite:**
- Убедитесь что есть права на запись в папку
- Проверьте путь к файлу БД

---

## 📝 Лицензия

MIT License — свободное использование с указанием автора.

---

## 👤 Автор

**animesao**

GitHub: [@animesao](https://github.com/animesao)

---

## 🤝 Поддержка

Если у вас возникли проблемы или вопросы:
1. Создайте тикет в панели поддержки
2. Откройте issue на GitHub
3. Проверьте документацию

---

## 🎨 Скриншоты

### Пользовательская панель
- Современный тёмный дизайн
- Адаптивный интерфейс
- Плавные анимации

### Админ-панель
- Полное управление пользователями
- Управление тарифами и серверами
- Статистика и логи

---

**PteroBilling** — современное решение для биллинга серверов Pterodactyl! 🚀


