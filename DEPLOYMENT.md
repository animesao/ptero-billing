# Инструкция по развёртыванию на VPS

## Шаг 1: Подготовка сервера

### Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### Установка необходимых пакетов

```bash
sudo apt install -y nginx mysql-server php8.1 php8.1-fpm php8.1-mysql php8.1-curl php8.1-gd php8.1-mbstring php8.1-xml php8.1-zip php8.1-bcmath php8.1-redis git unzip curl supervisor
```

## Шаг 2: Настройка MySQL

```bash
sudo mysql_secure_installation
```

Создайте базу данных:

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ptero_billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ptero_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON ptero_billing.* TO 'ptero_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Шаг 3: Установка проекта

```bash
cd /var/www
sudo git clone https://github.com/animesao/ptero-billing.git
sudo chown -R www-data:www-data ptero-billing
cd ptero-billing
```

### Установка Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Установка зависимостей

```bash
sudo -u www-data composer install --no-dev --optimize-autoloader
```

### Настройка .env

```bash
sudo -u www-data cp .env.example .env
sudo -u www-data php artisan key:generate
```

Отредактируйте `.env`:

```bash
sudo nano .env
```

```env
APP_NAME=PteroBilling
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ptero_billing
DB_USERNAME=ptero_user
DB_PASSWORD=strong_password_here

QUEUE_CONNECTION=database
```

### Запуск миграций

```bash
sudo -u www-data php artisan migrate --force
```

## Шаг 4: Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/ptero-billing
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/ptero-billing/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Активация сайта:

```bash
sudo ln -s /etc/nginx/sites-available/ptero-billing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 5: Настройка SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Шаг 6: Настройка Supervisor

```bash
sudo nano /etc/supervisor/conf.d/ptero-billing-worker.conf
```

```ini
[program:ptero-billing-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ptero-billing/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/ptero-billing/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ptero-billing-worker:*
```

## Шаг 7: Настройка Cron

```bash
sudo crontab -e
```

Добавьте:

```bash
* * * * * cd /var/www/ptero-billing && sudo -u www-data php artisan schedule:run >> /dev/null 2>&1
```

## Шаг 8: Настройка прав

```bash
sudo chown -R www-data:www-data /var/www/ptero-billing/storage
sudo chmod -R 775 /var/www/ptero-billing/storage
sudo chmod -R 775 /var/www/ptero-billing/bootstrap/cache
```

## Шаг 9: Создание администратора

```bash
sudo -u www-data php artisan tinker
```

```php
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@yourdomain.com',
    'password' => bcrypt('YourStrongPassword123!'),
    'role' => 'admin',
]);
exit
```

## Шаг 10: Финальная проверка

1. Откройте https://yourdomain.com
2. Войдите как администратор
3. Перейдите в /admin
4. Настройте Pterodactyl подключение
5. Создайте продукты

## Мониторинг

### Проверка статуса воркера

```bash
sudo supervisorctl status ptero-billing-worker
```

### Просмотр логов

```bash
tail -f /var/www/ptero-billing/storage/logs/laravel.log
tail -f /var/www/ptero-billing/storage/logs/worker.log
```

### Проверка очередей

```bash
sudo -u www-data php artisan queue:monitor database
```

## Бэкап базы данных

Создайте скрипт для бэкапа:

```bash
sudo nano /usr/local/bin/backup-ptero.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u ptero_user -p'strong_password_here' ptero_billing > /var/backups/ptero-billing_$DATE.sql
find /var/backups -name "ptero-billing_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-ptero.sh
```

Добавьте в crontab:

```bash
0 2 * * * /usr/local/bin/backup-ptero.sh
```

## Обновление системы

```bash
cd /var/www/ptero-billing
sudo git pull
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan optimize:clear
sudo supervisorctl restart ptero-billing-worker:*
```
