# Карта коммуникации между сервисами

## Главное приложение → File Service

### Файлы (Files)
- ✅ `file.create` - создание метаданных файла
- ✅ `file.getById` - получение файла по ID
- ✅ `file.getByUploadId` - получение файла по uploadId
- ✅ `file.getByRoom` - получение файлов комнаты
- ✅ `file.delete` - удаление файлов
- ✅ `file.uploadToRoom` - загрузка файла в комнату
- ✅ `file.uploadToStorage` - загрузка файла в storage
- ✅ `file.uploadByToken` - загрузка файла по токену
- ✅ `file.getDownloadLink` - получение ссылки для скачивания (авторизованный)
- ✅ `file.getDownloadLinkByToken` - получение ссылки для скачивания (по токену)
- ✅ `file.getStream` - получение потока для скачивания
- ✅ `file.multipart.init` - инициализация multipart загрузки
- ✅ `file.multipart.complete` - завершение multipart загрузки

### Storage
- ✅ `storage.create` - создание storage
- ✅ `storage.createItem` - создание элемента в storage
- ✅ `storage.getStructure` - получение структуры storage
- ✅ `storage.getFullStructure` - получение полной структуры storage
- ✅ `storage.deleteItem` - удаление элемента из storage
- ✅ `storage.getItemByToken` - получение элемента по токену
- ✅ `storage.getByUserId` - получение всех storage пользователя

### Комнаты (Rooms)
- ✅ `room.create` - создание комнаты
- ✅ `room.getByUserId` - получение комнат пользователя
- ✅ `room.bindFile` - привязка файла к комнате
- ✅ `room.delete` - удаление комнаты

## File Service → Главное приложение

### Permissions
- ✅ `permission.verify` - проверка прав доступа пользователя

### Tokens
- ✅ `token.validate` - валидация токена

## Проверка покрытия

### ✅ Файлы
- [x] Создание метаданных
- [x] Получение по ID
- [x] Получение по uploadId
- [x] Получение файлов комнаты
- [x] Удаление файлов
- [x] Загрузка в комнату
- [x] Загрузка в storage
- [x] Загрузка по токену
- [x] Скачивание (авторизованное)
- [x] Скачивание (по токену)
- [x] Потоковое скачивание
- [x] Multipart загрузка

### ✅ Storage
- [x] Создание storage
- [x] Создание элементов
- [x] Получение структуры
- [x] Получение полной структуры
- [x] Удаление элементов
- [x] Получение по токену
- [x] Получение всех storage пользователя

### ✅ Комнаты
- [x] Создание комнаты
- [x] Получение комнат пользователя
- [x] Привязка файла
- [x] Удаление комнаты

## Статус: ✅ ВСЕ ОПЕРАЦИИ ПОКРЫТЫ

