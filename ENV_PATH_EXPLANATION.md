# Объяснение проблемы с путями к .env файлам

## Проблема

File Service находится в `services/file-service/`, но когда он запускается, он ищет `.env` файлы относительно **текущей рабочей директории** (откуда запускается команда).

### Примеры:

1. **Если запускать из корня проекта:**

   ```bash
   # Из директории: drop-hub-backend/
   npm run start  # в services/file-service/
   ```

   - Приложение будет искать `.env` в `drop-hub-backend/.env` ❌
   - Но нужно искать в `drop-hub-backend/services/file-service/.env` ✅

2. **Если запускать из директории file-service:**

   ```bash
   # Из директории: drop-hub-backend/services/file-service/
   npm run start
   ```

   - Приложение будет искать `.env` в `drop-hub-backend/services/file-service/.env` ✅

## Решение

Используем `__dirname` для определения пути относительно файла кода:

```typescript
join(__dirname, '..', '..', '.env');
```

### Как это работает:

- `__dirname` в скомпилированном коде = `dist/` (или `services/file-service/dist/`)
- `join(__dirname, '..', '..')` = подняться на 2 уровня вверх
- Результат: `services/file-service/.env` ✅

### Структура после компиляции:

```
services/file-service/
├── dist/
│   └── app.module.js  ← __dirname указывает сюда
├── src/
│   └── app.module.ts
└── .env  ← ищем здесь
```

## Альтернатива (проще)

Можно просто указать путь относительно корня проекта, если всегда запускаем из корня:

```typescript
envFilePath: ['services/file-service/.env.development', 'services/file-service/.env'];
```

Но это работает только если запускаем из корня проекта.
