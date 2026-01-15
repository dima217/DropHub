# 🔐 Что такое ID Token и зачем нужен Client ID на сервере

## Что такое ID Token?

**ID Token** - это JWT (JSON Web Token), который Google выдает после успешной авторизации пользователя.

### Структура ID Token:

```json
{
  "iss": "https://accounts.google.com",
  "sub": "1234567890", // Google User ID
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://...",
  "aud": "your-client-id.apps.googleusercontent.com", // Client ID!
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Откуда берется ID Token?

1. **Мобильное приложение** использует Google Sign-In SDK
2. Пользователь авторизуется через Google
3. Google выдает **ID Token** мобильному приложению
4. Мобильное приложение отправляет ID Token на ваш сервер
5. **Сервер валидирует** ID Token и создает сессию

## Зачем Client ID на сервере?

### ❌ Я ошибся в предыдущем объяснении!

**Client ID НУЖЕН на сервере** для валидации ID Token!

### Как это работает:

1. **В мобильном приложении:**
   - Client ID используется для инициализации Google Sign-In SDK
   - Google выдает ID Token, который содержит этот Client ID в поле `aud` (audience)

2. **На сервере:**
   - Client ID используется для **валидации** ID Token
   - Google проверяет, что токен был выдан для вашего Client ID
   - Это защита от подделки токенов

### Код валидации:

```typescript
const ticket = await this.googleClient.verifyIdToken({
  idToken,
  // Google автоматически проверяет, что токен был выдан для этого Client ID
});
```

## Разница между Client ID в приложении и на сервере

### В мобильном приложении:

- **Android Client ID** - для Android приложения
- **iOS Client ID** - для iOS приложения
- Используется для инициализации Google Sign-In SDK

### На сервере:

- **Web Client ID** - для валидации ID Token
- Можно использовать Web Client ID для валидации токенов от всех платформ
- Или можно указать несколько Client IDs в `audience`

## Исправление кода

Текущий код правильный! Client ID нужен на сервере для валидации.

```typescript
const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
this.googleClient = new OAuth2Client(clientId);
```

## Итого

- **ID Token** = JWT токен с данными пользователя от Google
- **Client ID в приложении** = для получения ID Token
- **Client ID на сервере** = для валидации ID Token ✅

Оба Client ID нужны, но для разных целей!
