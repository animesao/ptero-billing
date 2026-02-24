# 🚀 Полное Руководство по Развертыванию Ptero-Billing

## 📋 Содержание

1. [Требования](#требования)
2. [Быстрый Старт (Docker)](#быстрый-старт-docker)
3. [Установка на Linux (Ubuntu/Debian)](#установка-на-linux-ubuntudebian)
4. [Установка на Windows](#установка-на-windows)
5. [Настройка Pterodactyl](#настройка-pterodactyl)
6. [Настройка SSL](#настройка-ssl)
7. [Оптимизация для Production](#оптимизация-для-production)
8. [Мониторинг и Обслуживание](#мониторинг-и-обслуживание)

---

## Требования

### Минимальные
- **CPU:** 2 ядра
- **RAM:** 2 GB
- **Disk:** 20 GB
- **OS:** Ubuntu 20.04+ / Debian 11+ / Windows Server 2019+

### Рекомендуемые
- **CPU:** 4+ ядра
- **RAM:** 4+ GB
- **Disk:** 40+ GB SSD
- **OS:** Ubuntu 22.04 LTS

### Программные Требования
- PHP 8.2+
- MySQL 8.0+ / MariaDB 10.6+
- Nginx / Apache
- Redis
- Node.js 18+
- Composer
- Git

---

## Быстрый Старт (Docker)

### Вариант 1: Один Контейнер

```bash
# Запуск с базовой конфигурацией
docker run -d \
  --name ptero-billing \
  -p 8080:80 \
  -p 8443:443 \
  -v ptero-billing-data:/var/www/html \
  -e APP_NAME=Ptero-Billing \
  -e APP_ENV=production \
  -e APP_DEBUG=false \
  ghcr.io/animesao/ptero-billing:latest
```

### Вариант 2: Docker Compose (Рекомендуется)

Создайте файл `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/animesao/ptero-billing:latest
    container_name: ptero-billing-app
    restart: unless-stopped
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./data:/var/www/html
    environment:
      - APP_NAME=Ptero-Billing
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_URL=http://localhost:8080
      - DB_CONNECTION=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_DATABASE=ptero-billing
      - DB_USERNAME=ptero-billing
      - DB_PASSWORD=${DB_PASSWORD:-ChangeMe123!}
      - REDIS_HOST=redis
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - ptero-network

  db:
    image: mysql:8.0
    container_name: ptero-billing-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: ptero-billing
      MYSQL_USER: ptero-billing
      MYSQL_PASSWORD: ${DB_PASSWORD:-ChangeMe123!}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-RootChangeMe123!}
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - ptero-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  redis:
    image: redis:alpine
    container_name: ptero-billing-redis
    restart: unless-stopped
    networks:
      - ptero-network

  cron:
    image: ghcr.io/animesao/ptero-billing:latest
    container_name: ptero-billing-cron
    restart: unless-stopped
    volumes:
      - ./data:/var/www/html
    command: php artisan schedule:run
    depends_on:
      - db
      - redis
    networks:
      - ptero-network

volumes:
  db-data:
  ptero-billing-data:

networks:
  ptero-network:
    driver: bridge
```

Запуск:

```bash
# Создайте файл .env для паролей
cat > .env << EOF
DB_PASSWORD=YourSecurePassword123!
DB_ROOT_PASSWORD=YourRootSecurePassword123!
EOF

# Запустите все сервисы
docker-compose up -d

# Проверьте статус
docker-compose ps

# Просмотр логов
docker-compose logs -f app
```

---

## Установка на Linux (Ubuntu/Debian)

### Шаг 1: Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip tar
```

### Шаг 2: Установка PHP 8.2

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-curl \
    php8.2-gd php8.2-mbstring php8.2-xml php8.2-zip php8.2-intl \
    php8.2-bcmath php8.2-gmp php8.2-redis php8.2-memcached
```

### Шаг 3: Установка MySQL

```bash
sudo apt install -y mysql-server

# Защита установки
sudo mysql_secure_installation

# Создание БД
sudo mysql -u root -p << EOF
CREATE DATABASE \`ptero-billing\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ptero-billing'@'127.0.0.1' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON \`ptero-billing\`.* TO 'ptero-billing'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### Шаг 4: Установка Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis
sudo systemctl start redis
```

### Шаг 5: Установка Composer и Node.js

```bash
# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Шаг 6: Клонирование Проекта

```bash
sudo mkdir -p /var/www/ptero-billing
sudo chown $USER:$USER /var/www/ptero-billing
cd /var/www/ptero-billing

git clone https://github.com/animesao/ptero-billing.git .
```

### Шаг 7: Установка Зависимостей

```bash
# PHP зависимости
composer install --optimize-autoloader --no-dev

# Node.js зависимости
npm install
```

### Шаг 8: Настройка Окружения

```bash
cp .env.example .env

# Генерация ключа
php artisan key:generate

# Редактирование .env
nano .env
```

Пример `.env`:

```env
APP_NAME=Ptero-Billing
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ptero-billing
DB_USERNAME=ptero-billing
DB_PASSWORD=YourSecurePassword123!

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

PTERODACTYL_URL=https://your-ptero-panel.com
PTERODACTYL_API_KEY=ptla_xxxxxxxxxxxxx
```

### Шаг 9: Миграции и Сборка

```bash
# Миграции БД
php artisan migrate --seed

# Сборка ассетов
npm run production

# Оптимизация
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Шаг 10: Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/ptero-billing
```

Конфигурация:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/ptero-billing/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "no-referrer-when-downgrade";

    index index.php;

    charset utf-8;

    # Максимальный размер загрузки
    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Кэширование ассетов
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Активация сайта:

```bash
sudo ln -s /etc/nginx/sites-available/ptero-billing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 11: Настройка Cron

```bash
sudo crontab -e

# Добавьте строку:
* * * * * cd /var/www/ptero-billing && php artisan schedule:run >> /dev/null 2>&1
```

### Шаг 12: Настройка Прав Доступа

```bash
sudo chown -R www-data:www-data /var/www/ptero-billing
sudo chmod -R 755 /var/www/ptero-billing/storage
sudo chmod -R 755 /var/www/ptero-billing/bootstrap/cache
```

---

## Установка на Windows

### Требования
- Windows Server 2019+ / Windows 10/11
- WSL2 (рекомендуется) или XAMPP/OpenServer

### Вариант 1: Через WSL2 (Рекомендуется)

```powershell
# Включите WSL2
wsl --install -d Ubuntu

# Далее следуйте инструкции для Linux
```

### Вариант 2: Через XAMPP

1. Установите [XAMPP](https://www.apachefriends.org/)
2. Скопируйте файлы в `C:\xampp\htdocs\ptero-billing`
3. Запустите Apache и MySQL из панели XAMPP
4. Откройте `http://localhost/ptero-billing/public/installer`

---

## Настройка Pterodactyl

### Получение API Ключа

1. Войдите в панель Pterodactyl как администратор
2. Перейдите в **Admin** → **API Credentials**
3. Нажмите **Create New Credential**
4. Скопируйте ключ

### Настройка в Ptero-Billing

В `.env` добавьте:

```env
PTERODACTYL_URL=https://your-ptero-panel.com
PTERODACTYL_API_KEY=ptla_xxxxxxxxxxxxx
```

### Настройка в Pterodactyl

1. Создайте новую локацию для серверов
2. Настройте ноды с достаточными ресурсами
3. Создайте яйца (eggs) для поддерживаемых игр

---

## Настройка SSL

### Через Let's Encrypt

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление
sudo certbot renew --dry-run
```

### Автоматическое обновление

```bash
sudo crontab -e

# Добавьте:
0 3 * * * certbot renew --quiet
```

---

## Оптимизация для Production

### PHP OPcache

```ini
# /etc/php/8.2/fpm/conf.d/10-opcache.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
opcache.fast_shutdown=1
```

### PHP FPM Пул

```ini
# /etc/php/8.2/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
```

### MySQL Оптимизация

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

### Redis для Сессий

```env
SESSION_DRIVER=redis
SESSION_CONNECTION=default
```

---

## Мониторинг и Обслуживание

### Логи

```bash
# Laravel логи
tail -f /var/www/ptero-billing/storage/logs/laravel.log

# Nginx логи
tail -f /var/log/nginx/error.log

# PHP-FPM логи
tail -f /var/log/php8.2-fpm.log

# MySQL логи
tail -f /var/log/mysql/error.log
```

### Резервное Копирование

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/ptero-billing"

# Бэкап БД
mysqldump -u ptero-billing -p'YourPassword' ptero-billing > $BACKUP_DIR/db-$DATE.sql

# Бэкап файлов
tar -czf $BACKUP_DIR/files-$DATE.tar.gz /var/www/ptero-billing

# Удаление старых бэкапов (хранить 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete
```

Cron для бэкапа:

```bash
0 2 * * * /path/to/backup.sh
```

### Обновление

```bash
cd /var/www/ptero-billing

# Режим обслуживания
php artisan down

# Обновление кода
git pull origin main

# Обновление зависимостей
composer install --optimize-autoloader --no-dev
npm install
npm run production

# Миграции
php artisan migrate

# Очистка кеша
php artisan optimize:clear

# Выход из режима обслуживания
php artisan up
```

---

## Проверка Установки

Откройте `https://your-domain.com` и проверьте:

- ✅ Регистрация работает
- ✅ Вход работает
- ✅ Создание сервера работает
- ✅ Платежи работают
- ✅ Тикеты работают
- ✅ Cron выполняется

---

## Поддержка

При возникновении проблем:

1. Проверьте логи
2. Очистите кеш: `php artisan optimize:clear`
3. Проверьте права доступа
4. Убедитесь что все сервисы запущены

**Ресурсы:**
- 📖 [Документация](https://github.com/animesao/ptero-billing/wiki)
- 💬 [Discord](https://discord.gg/4Y6HjD2uyU)
- 🐛 [Issues](https://github.com/animesao/ptero-billing/issues)

---

<div align="center">

**Ptero-Billing** © 2024 [animesao](https://github.com/animesao)

</div>
