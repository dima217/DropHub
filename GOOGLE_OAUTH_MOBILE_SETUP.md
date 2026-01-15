# Настройка Google OAuth2 для мобильного приложения

## Текущая реализация

Ваша текущая реализация использует **веб-поток OAuth2** (redirect-based), который работает для веб-приложений, но **не подходит для нативных мобильных приложений**.

### Текущий поток:

1. Пользователь открывает `/auth/google` → редирект на Google
2. Google редиректит на `/auth/google/callback`
3. Сервер устанавливает cookies и редиректит на фронтенд

**Проблема для мобильных:** Мобильные приложения не могут использовать cookies и redirects так же, как веб.

## Что нужно для мобильного приложения

### Вариант 1: Google Sign-In SDK (Рекомендуется)

Для нативных мобильных приложений Google рекомендует использовать:

- **Android**: Google Sign-In SDK
- **iOS**: Google Sign-In SDK

**Как это работает:**

1. Мобильное приложение использует Google SDK для авторизации
2. Получает ID Token от Google
3. Отправляет ID Token на ваш сервер
4. Сервер валидирует токен и создает сессию

### Вариант 2: Custom Token Flow

1. Мобильное приложение получает access token от Google
2. Отправляет токен на ваш сервер
3. Сервер валидирует токен через Google API
4. Создает пользователя/сессию

## Настройка в Google Cloud Console

### 1. Создание OAuth 2.0 Client ID

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект (или создайте новый)
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth client ID**

### 2. Типы приложений

Вам нужно создать **3 типа OAuth клиентов**:

#### A. Web application (для текущего веб-потока)

- **Application type**: Web application
- **Authorized redirect URIs**:
  - `http://localhost:3000/auth/google/callback` (dev)
  - `https://yourdomain.com/auth/google/callback` (prod)

#### B. Android application

- **Application type**: Android
- **Package name**: `com.yourcompany.yourapp` (из AndroidManifest.xml)
- **SHA-1 certificate fingerprint**:
  - Для debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
  - Для release: ваш production keystore

#### C. iOS application

- **Application type**: iOS
- **Bundle ID**: `com.yourcompany.yourapp` (из Info.plist)

### 3. OAuth consent screen

1. Перейдите в **OAuth consent screen**
2. Выберите **External** (для тестирования) или **Internal** (для G Suite)
3. Заполните:
   - **App name**: Название вашего приложения
   - **User support email**: Ваш email
   - **Developer contact information**: Ваш email
   - **Scopes**: `email`, `profile`, `openid`
4. Добавьте тестовых пользователей (если External)

### 4. Включите Google+ API (если нужно)

В **APIs & Services** → **Library** найдите и включите:

- Google+ API (deprecated, но может понадобиться)
- Или используйте только Google Identity Services

## Нужно ли публиковать в Google Play?

### ❌ НЕТ, для разработки и тестирования

Для разработки и тестирования **НЕ нужно** публиковать приложение в Google Play.

**Достаточно:**

- Создать OAuth клиенты в Google Console
- Добавить тестовых пользователей в OAuth consent screen
- Использовать debug keystore для Android

### ✅ ДА, для production

Для production с большим количеством пользователей:

- Приложение должно быть опубликовано в Google Play (хотя бы в Internal Testing)
- OAuth consent screen должен быть проверен Google (для External apps)
- Нужен production keystore с правильным SHA-1

## Что нужно изменить в коде

### 1. Добавить эндпоинт для мобильной авторизации

```typescript
@Post('google/mobile')
async googleAuthMobile(@Body() body: { idToken: string }) {
  // Валидировать ID Token через Google API
  // Создать/найти пользователя
  // Вернуть access/refresh токены
}
```

### 2. Валидация ID Token

Используйте библиотеку для валидации:

- `google-auth-library` для Node.js
- Или проверяйте через Google API

## Переменные окружения

Добавьте в `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GOOGLE_ANDROID_CLIENT_ID=android-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=ios-client-id.apps.googleusercontent.com
```

## Чеклист для запуска

- [ ] Создать OAuth клиент для Web application
- [ ] Создать OAuth клиент для Android
- [ ] Создать OAuth клиент для iOS
- [ ] Настроить OAuth consent screen
- [ ] Добавить тестовых пользователей
- [ ] Получить SHA-1 fingerprint для Android
- [ ] Добавить эндпоинт для мобильной авторизации
- [ ] Реализовать валидацию ID Token на сервере
