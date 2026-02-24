# PteroBilling - Биллинговая система для Pterodactyl Panel

Полнофункциональная биллинговая система для панели управления игровыми серверами Pterodactyl 1.x, построенная на Laravel 10.

## 📋 Возможности

### Пользовательский интерфейс
- ✅ Регистрация и авторизация пользователей
- ✅ Витрина продуктов (игровых серверов)
- ✅ Корзина и оформление заказа
- ✅ Личный кабинет с управлением серверами
- ✅ Управление питанием сервера (старт/стоп/рестарт)
- ✅ Просмотр инвойсов и история платежей
- ✅ Поддержка купонов и скидок

### Админ-панель (Filament)
- ✅ Управление пользователями
- ✅ Управление продуктами (связь с Pterodactyl Egg)
- ✅ Управление заказами и серверами
- ✅ Управление инвойсами и платежами
- ✅ Управление купонами
- ✅ Настройки системы

### Pterodactyl Интеграция
- ✅ Автоматическое создание серверов при оплате
- ✅ Приостановка серверов при неуплате
- ✅ Удаление серверов при длительной неуплате
- ✅ Синхронизация пользователей
- ✅ Получение списка нод, яиц, локаций

### Платёжные шлюзы
- ✅ Stripe (карты)
- ✅ PayPal
- ✅ Внутренний баланс

### Биллинг
- ✅ Автоматическая генерация инвойсов
- ✅ Поддержка различных биллинговых циклов (ежемесячно, ежеквартально, ежегодно)
- ✅ Grace period перед суспендом
- ✅ Автоматическое удаление после периода неуплаты

## 📁 Структура проекта

```
ptero-billing/
├── app/
│   ├── Console/Commands/       # Artisan команды
│   ├── Filament/Resources/     # Ресурсы админ-панели
│   ├── Http/Controllers/       # Контроллеры
│   ├── Jobs/                   # Очереди
│   ├── Models/                 # Eloquent модели
│   ├── Providers/              # Service Providers
│   └── Services/               # Сервисы (Pterodactyl, Payments)
├── config/                     # Конфигурация
├── database/
│   ├── migrations/             # Миграции БД
│   └── seeders/                # Сидеры
├── resources/views/            # Blade шаблоны
├── routes/                     # Маршруты
└── .env.example                # Пример конфигурации
```

## 🚀 Требования

- PHP >= 8.1
- MySQL >= 5.7 или MariaDB >= 10.3
- Composer
- Node.js >= 16 (опционально, для сборки ассетов)
- Redis (опционально, для кеширования)
- Pterodactyl Panel 1.x с API доступом

## 📖 Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/animesao/ptero-billing.git
cd ptero-billing
```

### 2. Установка зависимостей

```bash
composer install --no-dev --optimize-autoloader
```

### 3. Настройка окружения

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Настройка базы данных

Отредактируйте `.env` файл:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ptero_billing
DB_USERNAME=root
DB_PASSWORD=your_password
```

Создайте базу данных:

```bash
mysql -u root -p -e "CREATE DATABASE ptero_billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Запуск миграций

```bash
php artisan migrate --force
```

### 6. Настройка Pterodactyl API

1. Войдите в админ-панель Pterodactyl
2. Перейдите в **Admin API** → **API Credentials**
3. Создайте новый API ключ с правами:
   - `Read` и `Write` для Users, Servers, Nodes, Nests
4. Скопируйте ключ и добавьте в `.env`:

```env
PTERODACTYL_URL=https://your-panel.com
PTERODACTYL_API_KEY=ptlc_your_api_key_here
```

### 7. Настройка платёжных шлюзов

#### Stripe

```env
STRIPE_KEY=pk_test_your_public_key
STRIPE_SECRET=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=usd
```

#### PayPal

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET=your_secret
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=USD
PAYPAL_NOTIFY_URL=https://yourdomain.com/webhooks/paypal
```

### 8. Настройка прав доступа

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 9. Настройка воркера очередей

Для обработки фоновых задач (создание серверов, отправка email) настройте supervisor:

```ini
[program:ptero-billing-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/ptero-billing/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/ptero-billing/storage/logs/worker.log
stopwaitsecs=3600
```

### 10. Настройка планировщика

Добавьте в crontab (`crontab -e`):

```bash
* * * * * cd /path/to/ptero-billing && php artisan schedule:run >> /dev/null 2>&1
```

### 11. Создание администратора

```bash
php artisan tinker
```

```php
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('your_password'),
    'role' => 'admin',
]);
exit
```

### 12. Запуск веб-сервера

#### Nginx конфигурация:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/ptero-billing/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 🔧 Использование

### Админ-панель

1. Войдите как администратор
2. Перейдите в `/admin`
3. Настройте продукты:
   - Создайте продукт
   - Укажите ID яйца Pterodactyl
   - Настройте цены и лимиты
   - Укажите доступные ноды (ID)

### Создание продукта

1. В админ-панели перейдите в **Продукты** → **Создать**
2. Заполните:
   - Название и описание
   - ID яйца (можно получить через API Pterodactyl)
   - Цену и биллинговый цикл
   - Характеристики (CPU, RAM, Disk)
   - Доступные ноды
3. Сохраните

### Настройка вебхуков

#### Stripe Webhook

1. В Stripe Dashboard перейдите в Developers → Webhooks
2. Добавьте endpoint: `https://yourdomain.com/webhooks/stripe`
3. Выберите события:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
4. Скопируйте signing secret в `.env`

#### PayPal Webhook

1. В PayPal Developer Dashboard создайте webhook
2. Endpoint: `https://yourdomain.com/webhooks/paypal`
3. Выберите события:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
4. Добавьте webhook ID в настройки

## 📊 API Endpoints

### Pterodactyl API

Система использует Pterodactyl API v1:

- `GET /api/application/users` - Список пользователей
- `POST /api/application/users` - Создание пользователя
- `GET /api/application/nodes` - Список нод
- `GET /api/application/nests/{id}/eggs` - Список яиц
- `POST /api/application/servers` - Создание сервера
- `POST /api/application/servers/{id}/suspend` - Приостановка
- `DELETE /api/application/servers/{id}` - Удаление

## 🗄️ Модель базы данных

```
users
├── id
├── name, email, password
├── role (admin/user)
├── pterodactyl_id
├── balance
└── status

products
├── id, name, description
├── pterodactyl_egg_id
├── price, billing_cycle
├── cpu, memory, disk
├── nodes (JSON)
└── is_active

orders
├── id, user_id, product_id
├── status, total, discount
├── server_name
├── pterodactyl_server_id
└── paid_at

servers
├── id, user_id, order_id, product_id
├── name, pterodactyl_id
├── status
├── cpu, memory, disk
├── ip_address, port
└── next_billing_date

invoices
├── id, user_id, server_id
├── invoice_number
├── status, total
├── billing_cycle, due_date
└── paid_at

payments
├── id, user_id, invoice_id
├── gateway, transaction_id
├── status, amount
└── payload (JSON)

coupons
├── id, code
├── type (percent/fixed), value
├── max_uses, uses_count
├── expires_at
└── is_active
```

## 🔐 Безопасность

- Используйте HTTPS
- Регулярно обновляйте зависимости
- Настройте firewall
- Используйте сильные пароли
- Ограничьте доступ к админ-панели по IP
- Регулярно делайте бэкапы базы данных

## 📝 Команды Artisan

```bash
# Проверка инвойсов и суспенд серверов
php artisan billing:check-invoices

# Генерация инвойсов для продления
php artisan billing:generate-invoices

# Запуск воркера
php artisan queue:work

# Запуск планировщика
php artisan schedule:run

# Очистка кеша
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## 🐛 Решение проблем

### Ошибка подключения к Pterodactyl

1. Проверьте URL и API ключ
2. Убедитесь, что API ключ имеет нужные права
3. Проверьте логи: `storage/logs/laravel.log`

### Очереди не работают

1. Убедитесь, что `QUEUE_CONNECTION=database` в `.env`
2. Проверьте, что таблица `jobs` создана
3. Запустите воркера: `php artisan queue:work`

### Вебхуки не обрабатываются

1. Проверьте, что webhook URL доступен извне
2. Проверьте подписи вебхуков
3. Включите логирование для отладки

## 📄 Лицензия

MIT License

## 👥 Авторы

- animesao

## 🤝 Поддержка

Для вопросов и предложений создайте Issue в репозитории.
