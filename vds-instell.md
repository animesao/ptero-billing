# Инструкция по установке PteroBilling на VDS

Эта инструкция поможет вам перенести и запустить панель PteroBilling на вашем собственном сервере (VDS/VPS).

## 1. Подготовка сервера

Рекомендуемая ОС: **Ubuntu 22.04 LTS** или **Debian 12**.

### Установка необходимых компонентов:
```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка Node.js (20.x или выше)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка инструментов сборки
sudo apt install -y build-essential git
```

## 2. Настройка базы данных

```bash
# Вход в консоль PostgreSQL
sudo -i -u postgres psql

# Создание базы данных и пользователя (замените 'your_password' на свой пароль)
CREATE DATABASE pterobilling;
CREATE USER ptero_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pterobilling TO ptero_user;
\q
```

## 3. Установка приложения

```bash
# Склонируйте ваш репозиторий или перенесите файлы
mkdir /var/www/pterobilling
cd /var/www/pterobilling

# Установка зависимостей
npm install

# Сборка фронтенда
npm run build:client
```

## 4. Настройка окружения

Создайте файл `.env` в корневой директории:
```env
DATABASE_URL=postgres://ptero_user:your_password@localhost:5432/pterobilling
SESSION_SECRET=выберите_длинную_случайную_строку
NODE_ENV=production
PORT=5000
```

## 5. Запуск через PM2 (рекомендуется)

PM2 обеспечит автоматический перезапуск приложения при сбоях или перезагрузке сервера.

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск приложения
pm2 start server/index.js --name "pterobilling"

# Настройка автозапуска
pm2 save
pm2 startup
```

## 6. Настройка Nginx (Проксирование)

Для работы через домен и SSL рекомендуется использовать Nginx.

```bash
sudo apt install -y nginx
```

Создайте конфиг `/etc/nginx/sites-available/pterobilling`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/pterobilling /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. После установки

1. Зайдите в панель по вашему адресу.
2. Логин по умолчанию: `admin@pterobilling.local`
3. Пароль по умолчанию: `admin123`
4. **Обязательно** смените пароль администратора в профиле.
5. Перейдите в **Настройки (Settings)** и укажите URL и API ключ вашей Pterodactyl Panel.
