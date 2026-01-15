# Простое объяснение проблемы с .env

## Структура проекта:

```
drop-hub-backend/                    ← корень проекта
├── .env                            ← главное приложение ищет здесь
├── src/
│   └── app.module.ts
└── services/
    └── file-service/               ← File Service здесь
        ├── .env                    ← File Service должен искать здесь
        └── src/
            └── app.module.ts
```

## Проблема:

Когда File Service запускается, он ищет `.env` относительно **текущей директории** (откуда запускается команда).

### Если запускать из корня:

```bash
cd drop-hub-backend/
npm run start  # в services/file-service/
```

→ Ищет `.env` в `drop-hub-backend/.env` ❌ (неправильно!)

### Если запускать из file-service:

```bash
cd drop-hub-backend/services/file-service/
npm run start
```

→ Ищет `.env` в `drop-hub-backend/services/file-service/.env` ✅ (правильно!)

## Решение:

Используем `__dirname` - это путь к директории, где находится файл кода:

```typescript
join(__dirname, '..', '..', '.env');
```

### Как работает:

1. После компиляции код находится в `dist/`
2. `__dirname` = `services/file-service/dist/`
3. `join(__dirname, '..', '..')` = подняться на 2 уровня вверх
4. Результат: `services/file-service/.env` ✅

**Теперь File Service всегда будет искать .env в своей директории, независимо от того, откуда запускается!**
