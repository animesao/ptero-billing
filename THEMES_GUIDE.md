# Установка Тем Ptero-Billing

## Обзор

Ptero-Billing включает две красивые темы с современным дизайном и анимациями:

1. **Nebula** - Темная тема с фиолетовыми градиентами
2. **Aurora** - Светлая тема с градиентами северного сияния

## Требования

- Node.js 18+ 
- NPM 9+
- Vite

## Установка

### Шаг 1: Установка зависимостей

```bash
cd /path/to/ptero-billing
npm install
```

### Шаг 2: Сборка темы

#### Для разработки (с автообновлением)

```bash
# Тема Nebula
npm run dev:default -- --config themes/nebula/vite.config.js

# Тема Aurora
npm run dev:default -- --config themes/aurora/vite.config.js
```

#### Для Production

```bash
# Тема Nebula
npm run build:default -- --config themes/nebula/vite.config.js

# Тема Aurora  
npm run build:default -- --config themes/aurora/vite.config.js
```

### Шаг 3: Активация темы

#### Через .env файл

Добавьте или измените в файле `.env`:

```env
# Для темы Nebula
THEME_ACTIVE=nebula

# Или для темы Aurora
THEME_ACTIVE=aurora
```

#### Через Artisan команду

```bash
# Активировать Nebula
php artisan theme:set nebula

# Активировать Aurora
php artisan theme:set aurora
```

#### Через админ-панель

1. Войдите в админ-панель
2. Перейдите в **Settings** → **Theme Settings**
3. Выберите нужную тему из выпадающего списка
4. Нажмите **Save**

## Структура Тем

```
themes/
├── nebula/
│   ├── sass/
│   │   └── app.scss          # Основные стили темы
│   ├── js/
│   │   ├── app.js            # JavaScript темы
│   │   └── bootstrap.js      # Bootstrap настройки
│   ├── views/
│   │   ├── layouts/
│   │   │   └── main.blade.php
│   │   └── auth/
│   │       └── login.blade.php
│   └── vite.config.js
│
└── aurora/
    ├── sass/
    │   └── app.scss
    ├── js/
    │   ├── app.js
    │   └── bootstrap.js
    ├── views/
    │   ├── layouts/
    │   │   └── main.blade.php
    │   └── auth/
    │       └── login.blade.php
    └── vite.config.js
```

## Особенности Тем

### Nebula (Темная)

**Цветовая палитра:**
- Основной: `#0f0f1a`
- Вторичный: `#1a1a2e`
- Акцент: `#667eea` → `#764ba2` (градиент)

**Особенности:**
- Темный фон с анимированными градиентами
- Светящиеся эффекты
- Плавные анимации при наведении
- Современный минималистичный дизайн

### Aurora (Светлая)

**Цветовая палитра:**
- Основной: `#f8fafc`
- Вторичный: `#ffffff`
- Акцент: `#00c9ff` → `#92fe9d` (градиент)

**Особенности:**
- Светлый чистый дизайн
- Эффект северного сияния на фоне
- Яркие градиентные кнопки
- Анимация чисел в статистике

## Анимации

Обе темы включают следующие CSS анимации:

- `fadeIn` - Плавное появление
- `slideIn` - Выезд сбоку
- `float` - Парящий эффект
- `pulse` - Пульсация
- `glow` - Светящийся эффект
- `shimmer` - Мерцание

## Кастомизация

### Изменение цветов

Откройте файл `themes/{theme-name}/sass/app.scss` и измените CSS переменные:

```scss
:root {
    --primary-gradient: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
    --bg-primary: #your-background;
    --accent-primary: #your-accent;
    // ... другие переменные
}
```

### Добавление собственных анимаций

```scss
@keyframes yourAnimation {
    0% {
        // начальное состояние
    }
    100% {
        // конечное состояние
    }
}

.your-class {
    animation: yourAnimation 1s ease infinite;
}
```

## Устранение Проблем

### Стили не применяются

1. Очистите кеш Laravel:
```bash
php artisan cache:clear
php artisan view:clear
php artisan config:clear
```

2. Пересоберите ассеты:
```bash
npm run production
```

3. Проверьте права доступа:
```bash
chmod -R 755 public/themes
```

### Ошибка Vite manifest

Удалите существующий manifest и пересоберите:

```bash
rm public/themes/nebula/.vite/manifest.json
# или
rm public/themes/aurora/.vite/manifest.json

npm run production
```

### Тема не отображается в списке

Убедитесь что:
1. Папка темы существует в `themes/`
2. Файл `theme.json` присутствует (если требуется)
3. Кеш конфигурации очищен

## Создание Собственной Темы

1. Скопируйте существующую тему:
```bash
cp -r themes/nebula themes/your-theme
```

2. Измените название в файлах темы

3. Зарегистрируйте тему в системе

## Поддержка

Если у вас возникли проблемы:
- Проверьте [документацию](https://github.com/animesao/ptero-billing/wiki)
- Откройте [issue](https://github.com/animesao/ptero-billing/issues)
- Присоединяйтесь к [Discord](https://discord.gg/4Y6HjD2uyU)
