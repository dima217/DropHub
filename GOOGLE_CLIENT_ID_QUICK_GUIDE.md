# 🚀 Быстрая инструкция: Что делать с Google Client ID

## ✅ Client ID используется в мобильном приложении

**Client ID НЕ нужен на сервере!** Он используется только в мобильном приложении для инициализации Google Sign-In SDK.

## 📱 Шаг 1: Добавить в мобильное приложение

### Android:
```kotlin
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken("YOUR_CLIENT_ID.apps.googleusercontent.com")
    .requestEmail()
    .build()
```

### iOS:
```swift
let clientID = "YOUR_CLIENT_ID.apps.googleusercontent.com"
GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
```

## 🔄 Шаг 2: Поток работы

1. **Мобильное приложение** использует Client ID для авторизации через Google SDK
2. Получает **ID Token** от Google
3. Отправляет ID Token на ваш сервер: `POST /auth/google/mobile`
4. **Сервер валидирует** токен и создает сессию

## 🖥️ Шаг 3: Установить библиотеку на сервере

```bash
npm install google-auth-library
```

## 📝 Что уже сделано

✅ Добавлен эндпоинт `/auth/google/mobile`  
✅ Добавлен метод `verifyGoogleIdToken()` в AuthService  
✅ Создан DTO `GoogleMobileAuthDto`

## ⚠️ Что нужно сделать

1. **Установить библиотеку:**
   ```bash
   npm install google-auth-library
   ```

2. **Добавить переменную окружения:**
   ```env
   GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```
   (Можно использовать Web Client ID для валидации)

3. **В мобильном приложении:**
   - Добавить Client ID в конфигурацию
   - Использовать Google Sign-In SDK
   - Отправлять ID Token на `/auth/google/mobile`

## 🎯 Итого

- **Client ID** → в мобильном приложении
- **ID Token** → отправляется на сервер
- **Сервер** → валидирует и создает сессию

