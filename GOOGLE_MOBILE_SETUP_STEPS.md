# 📱 Пошаговая инструкция: Google OAuth для мобильного приложения

## ✅ Что уже сделано

1. ✅ Добавлен эндпоинт `POST /auth/google/mobile`
2. ✅ Добавлен метод `verifyGoogleIdToken()` в AuthService
3. ✅ Создан DTO `GoogleMobileAuthDto`

## 📦 Шаг 1: Установить библиотеку

```bash
npm install google-auth-library
```

## 🔑 Шаг 2: Client ID - что с ним делать

### ❌ НЕ нужен на сервере!

**Client ID используется ТОЛЬКО в мобильном приложении.**

### 📱 В мобильном приложении:

#### Android (Kotlin):
```kotlin
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken("YOUR_CLIENT_ID.apps.googleusercontent.com")
    .requestEmail()
    .build()

val googleSignInClient = GoogleSignIn.getClient(context, gso)

// При авторизации
val signInIntent = googleSignInClient.signInIntent
startActivityForResult(signInIntent, RC_SIGN_IN)

// После успешной авторизации
val account = GoogleSignIn.getLastSignedInAccount(context)
val idToken = account?.idToken  // ← Это отправляем на сервер
```

#### iOS (Swift):
```swift
let clientID = "YOUR_CLIENT_ID.apps.googleusercontent.com"
GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)

// При авторизации
GIDSignIn.sharedInstance.signIn(withPresenting: self) { result, error in
    guard let result = result else { return }
    let idToken = result.user.idToken?.tokenString  // ← Это отправляем на сервер
}
```

## 🔄 Шаг 3: Поток работы

1. **Мобильное приложение:**
   - Использует Client ID для инициализации Google Sign-In SDK
   - Пользователь авторизуется через Google
   - Получает **ID Token** от Google

2. **Отправка на сервер:**
   ```http
   POST /auth/google/mobile
   Content-Type: application/json
   X-Client-Type: mobile-app
   
   {
     "idToken": "eyJhbGciOiJSUzI1NiIs..."
   }
   ```

3. **Сервер:**
   - Валидирует ID Token через Google API
   - Создает/находит пользователя
   - Возвращает access/refresh токены

## ⚙️ Шаг 4: Переменные окружения

Добавьте в `.env`:
```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

**Примечание:** Можно использовать Web Client ID для валидации ID Token от мобильных приложений. Google рекомендует использовать Web Client ID для валидации.

## 📝 Итого

- ✅ **Client ID** → в мобильном приложении (Android/iOS)
- ✅ **ID Token** → отправляется на сервер
- ✅ **Сервер** → валидирует и создает сессию

## 🚀 Следующие шаги

1. Установить `google-auth-library`
2. Добавить `GOOGLE_CLIENT_ID` в `.env`
3. В мобильном приложении добавить Client ID
4. Реализовать отправку ID Token на `/auth/google/mobile`

