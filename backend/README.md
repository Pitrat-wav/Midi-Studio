# 🎹 Midi-Studio Backend

Backend API для Midi-Studio — Telegram Web App для создания и экспорта MIDI-лупов.

## 📋 Возможности

- **Telegram Bot Integration** — отправка MIDI файлов прямо в чат пользователя
- **Projects API** — сохранение и обмен проектами (leaderboard)
- **SQLite Database** — лёгкое хранение с WAL режимом
- **Security** — rate limiting, CORS, Helmet, валидация Telegram initData

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка окружения

```bash
# Скопируйте пример файла окружения
cp .env.example .env

# Откройте .env и добавьте ваш BOT_TOKEN
```

#### Как получить BOT_TOKEN:

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Придумайте имя и username для бота
4. BotFather выдаст токен вида `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Скопируйте токен в `backend/.env`

### 3. Запуск сервера

```bash
# Development режим (с авто-рестартом)
npm run dev

# Production режим
npm start
```

Сервер запустится на **http://localhost:3001**

### 4. Проверка работы

```bash
# Health check
curl http://localhost:3001/health

# Тесты санитизации
npm test
```

## 📁 Структура проекта

```
backend/
├── server.ts              # Основной сервер (Express + Telegraf)
├── db.ts                  # SQLite база данных с миграциями
├── test-sanitization.ts   # Тесты санитизации имён файлов
├── package.json           # Зависимости и скрипты
├── .env.example           # Шаблон переменных окружения
├── .env                   # Локальные настройки (не коммитить!)
└── data/
    └── projects.db        # SQLite база (создаётся автоматически)
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `BOT_TOKEN` | Токен Telegram бота | **Обязательно** |
| `PORT` | Порт сервера | `3001` |
| `NODE_ENV` | Режим работы | `development` |
| `ALLOWED_ORIGINS` | Разрешённые CORS origins | `http://localhost:3000` |
| `ALLOW_NO_ORIGIN` | Разрешить запросы без Origin | `true` |
| `SKIP_TELEGRAM_VALIDATION` | Пропустить валидацию (dev) | `true` |
| `TELEGRAM_DATA_MAX_AGE` | Макс. возраст данных (сек) | `86400` |

## 📡 API Endpoints

### Telegram Bot

#### `POST /upload-midi`
Отправка MIDI файла в чат пользователя Telegram.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "initData": "Telegram WebApp initData string",
  "midiBase64": "base64 encoded MIDI file",
  "filename": "my_loop.mid"
}
```

**Response:**
```json
{ "success": true }
```

### Projects API

#### `GET /api/projects`
Получить список проектов (leaderboard).

**Query Parameters:**
- `limit` (optional, default: 20, max: 100)
- `offset` (optional, default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "name": "My Project",
    "author": "Anonymous",
    "parent_id": null,
    "likes": 42,
    "created_at": "2026-02-18T00:00:00.000Z"
  }
]
```

#### `GET /api/projects/:id`
Получить проект по ID.

#### `POST /api/projects`
Создать новый проект.

**Body:**
```json
{
  "name": "My Project",
  "author": "John Doe",
  "data": { "notes": [...] },
  "parent_id": null
}
```

#### `POST /api/projects/:id/like`
Лайкнуть проект.

### Health Check

#### `GET /health`
Проверка работоспособности сервера.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T00:00:00.000Z",
  "uptime": 123.45
}
```

## 🔒 Безопасность

### Реализованные защиты:

1. **Rate Limiting**
   - 30 запросов/мин на API endpoints
   - 10 загрузок/5 мин на `/upload-midi`

2. **CORS**
   - Настройка разрешённых origins
   - Блокировка неизвестных источников

3. **Валидация Telegram initData**
   - Проверка подписи (HMAC-SHA256)
   - Защита от replay attacks (24 часа)
   - Constant-time comparison

4. **Санитизация имён файлов**
   - Блокировка path traversal (../)
   - Блокировка null bytes (\0)
   - Блокировка Windows reserved names (CON, PRN, AUX...)
   - Ограничение длины (64 символа)

5. **Валидация MIDI файлов**
   - Проверка размера (max 1MB)
   - Проверка заголовка (MThd)
   - Проверка base64 encoding

6. **Helmet Security Headers**
   - X-Content-Type-Options
   - X-Frame-Options
   - Strict-Transport-Security (в production)

## 🧪 Тестирование

```bash
# Запустить тесты санитизации
npm test

# Проверка TypeScript
npm run build

# Проверка уязвимостей
npm audit
```

## 📦 Production Deployment

### Требования:

- Node.js >= 18.0.0
- HTTPS (обязательно для Telegram Web App)
- Переменные окружения в secrets manager

### Рекомендации:

1. **Установите `NODE_ENV=production`**
2. **Настройте HTTPS** (nginx, Let's Encrypt)
3. **Установите `SKIP_TELEGRAM_VALIDATION=false`**
4. **Настройте `ALLOWED_ORIGINS`** с вашим доменом
5. **Используйте PM2** для управления процессом:
   ```bash
   npm install -g pm2
   pm2 start server.ts --name midi-backend
   pm2 save
   ```

### Docker (опционально):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Ошибка: "BOT_TOKEN is not defined"

```bash
# Убедитесь, что файл .env существует
ls -la .env

# Проверьте содержимое
cat .env | grep BOT_TOKEN
```

### Ошибка: "Invalid authentication"

- Проверьте, что `initData` передаётся из Telegram WebApp
- Убедитесь, что токен бота правильный
- В development установите `SKIP_TELEGRAM_VALIDATION=true`

### Ошибка: "Database locked"

SQLite база заблокирована. Помогает:
```bash
# Удалите WAL файлы (не саму базу!)
rm data/*.db-wal data/*.db-shm
```

## 📄 Лицензия

MIT
