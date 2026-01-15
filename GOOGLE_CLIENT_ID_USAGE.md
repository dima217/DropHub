# 📱 Что делать с Google Client ID для мобильного приложения

## 🎯 Client ID используется в мобильном приложении

**Client ID НЕ нужен на сервере!** Он используется только в мобильном приложении.

## 📲 Шаг 1: Добавить Client ID в мобильное приложение

### Android (Kotlin/Java)

В `strings.xml` или `build.gradle`:

```xml
<string name="google_client_id">YOUR_CLIENT_ID.apps.googleusercontent.com</string>
```

Или в `build.gradle`:

```gradle
android {
    defaultConfig {
        resValue "string", "google_client_id", "YOUR_CLIENT_ID.apps.googleusercontent.com"
    }
}
```

### iOS (Swift)

В `Info.plist`:

```xml
<key>GOOGLE_CLIENT_ID</key>
<string>YOUR_CLIENT_ID.apps.googleusercontent.com</string>
```

Или в коде:

```swift
let clientID = "YOUR_CLIENT_ID.apps.googleusercontent.com"
```

## 🔄 Шаг 2: Поток авторизации

### В мобильном приложении:

1. **Используйте Google Sign-In SDK**
   - Android: `com.google.android.gms:play-services-auth`
   - iOS: `GoogleSignIn` framework

2. **Инициализируйте с Client ID:**

   ```kotlin
   // Android
   val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
       .requestIdToken("YOUR_CLIENT_ID.apps.googleusercontent.com")
       .requestEmail()
       .build()
   ```

3. **После успешной авторизации получите ID Token:**

   ```kotlin
   val account = GoogleSignIn.getLastSignedInAccount(context)
   val idToken = account?.idToken  // Это то, что нужно отправить на сервер
   ```

4. **Отправьте ID Token на ваш сервер:**
   ```kotlin
   POST /auth/google/mobile
   Body: { "idToken": "eyJhbGciOiJSUzI1NiIs..." }
   ```

## 🖥️ Шаг 3: Настроить сервер для валидации

Сейчас нужно добавить эндпоинт на сервере для обработки ID Token от мобильного приложения.
