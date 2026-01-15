# 🚀 Быстрая инструкция: Google OAuth для мобильного приложения

## ❌ Проблема в коде (ИСПРАВЛЕНО)

`GoogleStrategy` не был добавлен в `providers` в `auth.module.ts` - теперь исправлено.

## 📱 Нужно ли публиковать в Google Play?

### Для разработки: ❌ НЕТ

**Не нужно публиковать** приложение в Google Play для разработки и тестирования.

**Достаточно:**
1. Создать OAuth клиенты в Google Cloud Console
2. Добавить тестовых пользователей
3. Использовать debug keystore

### Для production: ✅ ДА (частично)

Для production с большим количеством пользователей:
- Приложение должно быть хотя бы в **Internal Testing** в Google Play
- OAuth consent screen должен быть проверен Google (для External apps)
- Нужен production keystore

## 🔧 Что сделать в Google Cloud Console

### Шаг 1: Создать OAuth клиенты

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth client ID**

**Создайте 3 клиента:**

#### 1. Web application (для веб)
- Type: **Web application**
- Redirect URIs: `http://localhost:3000/auth/google/callback`

#### 2. Android (для мобильного)
- Type: **Android**
- Package name: `com.yourcompany.yourapp`
- SHA-1: получите через `keytool` (см. ниже)

#### 3. iOS (для мобильного)
- Type: **iOS**
- Bundle ID: `com.yourcompany.yourapp`

### Шаг 2: Получить SHA-1 для Android

**Debug keystore:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Release keystore:**
```bash
keytool -list -v -keystore path/to/your/release.keystore -alias your-alias
```

Скопируйте SHA-1 fingerprint и вставьте в Google Console.

### Шаг 3: Настроить OAuth consent screen

1. **OAuth consent screen**
2. Выберите **External** (для тестирования)
3. Заполните:
   - App name
   - User support email
   - Scopes: `email`, `profile`, `openid`
4. Добавьте тестовых пользователей (ваш email)

## 📝 Переменные окружения

Добавьте в `.env`:
```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## ⚠️ Текущая реализация - только для веб!

Ваш текущий код использует **веб-поток** (redirect), который **не работает** для мобильных приложений.

### Для мобильных нужно:

1. **Мобильное приложение** использует Google Sign-In SDK
2. Получает **ID Token** от Google
3. Отправляет ID Token на ваш сервер
4. **Сервер валидирует** токен и создает сессию

### Нужно добавить эндпоинт:

```typescript
@Post('google/mobile')
async googleAuthMobile(@Body() body: { idToken: string }) {
  // Валидировать ID Token
  // Создать/найти пользователя
  // Вернуть токены
}
```

## ✅ Чеклист

- [x] Исправлено: GoogleStrategy добавлен в providers
- [ ] Создать OAuth клиент для Web
- [ ] Создать OAuth клиент для Android
- [ ] Создать OAuth клиент для iOS
- [ ] Получить SHA-1 для Android
- [ ] Настроить OAuth consent screen
- [ ] Добавить тестовых пользователей
- [ ] Добавить эндпоинт `/auth/google/mobile` для мобильных
- [ ] Установить `google-auth-library` для валидации ID Token

