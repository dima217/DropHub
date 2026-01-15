# ✅ Рефакторинг: Google авторизация выделена в отдельный сервис

## Что сделано

### 1. Создан отдельный сервис `GoogleAuthService`

**Файл:** `src/auth/services/google-auth.service.ts`

**Ответственность:**
- Валидация Google ID Token от мобильных приложений
- Создание/поиск пользователей через Google OAuth
- Генерация токенов для авторизованных пользователей

**Методы:**
- `verifyGoogleIdToken(idToken: string)` - валидация ID Token и создание сессии
- `createUserWithProfile()` - приватный метод для создания пользователя с профилем

### 2. Обновлен `AuthController`

**Изменения:**
- Добавлен `GoogleAuthService` в конструктор
- Эндпоинт `POST /auth/google/mobile` использует `GoogleAuthService`

### 3. Обновлен `AuthModule`

**Изменения:**
- Добавлен `GoogleAuthService` в providers

### 4. Установлена библиотека

```bash
yarn add google-auth-library
```

## Структура

```
src/auth/
├── services/
│   ├── auth.service.ts          # Основная авторизация (login, register)
│   ├── google-auth.service.ts   # Google OAuth авторизация (НОВЫЙ)
│   ├── token.service.ts
│   └── ...
├── controllers/
│   └── auth.controller.ts       # Использует оба сервиса
└── strategies/
    └── google-strategy.ts        # Для веб-авторизации (redirect)
```

## Использование

### Веб-авторизация (redirect)
- Эндпоинт: `GET /auth/google`
- Использует: `GoogleStrategy` (Passport)
- Поток: Redirect → Google → Callback

### Мобильная авторизация (ID Token)
- Эндпоинт: `POST /auth/google/mobile`
- Использует: `GoogleAuthService`
- Поток: Мобильное приложение → ID Token → Сервер валидирует → Сессия

## Преимущества

✅ **Разделение ответственности**: Google логика изолирована  
✅ **Легче тестировать**: Отдельный сервис можно тестировать независимо  
✅ **Легче поддерживать**: Изменения в Google OAuth не затрагивают основной AuthService  
✅ **Чистая архитектура**: Каждый сервис отвечает за свою область

## Переменные окружения

```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Статус: ✅ ГОТОВО

Google авторизация выделена в отдельный сервис, библиотека установлена через yarn.

