# The Last of Guss

Браузерная игра-кликер "The Last of Guss", где игроки соревнуются, кто быстрее и больше натапает по виртуальному гусю.

## Описание

Игра представляет собой кликер, где игроки тапают по гусю в рамках активных раундов. Каждый тап дает очки, а каждый 11-й тап дает бонусные 10 очков. Раунды имеют ограниченное время, и по завершении определяется победитель.

## Технологии

### Backend
- NestJS
- TypeScript (strict mode)
- PostgreSQL
- Prisma ORM
- JWT аутентификация
- bcrypt для хеширования паролей

### Frontend
- React 18
- TypeScript
- Vite
- Material-UI
- Effector (state management)
- React Router
- Axios

## Быстрый старт

```bash
# 1. Запуск базы данных
docker-compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# 3. Frontend (в новом терминале)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Откройте браузер: `http://localhost:5173`

**Порты:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Развертывание

### Требования

- Node.js 20+
- Docker и Docker Compose
- npm или yarn

### Шаг 1: Запуск базы данных PostgreSQL

```bash
# Запуск PostgreSQL в Docker
docker-compose up -d

# Проверка, что контейнер запущен
docker-compose ps
```

**Настройки базы данных из docker-compose.yml:**
- Порт: `5432`
- Пользователь: `last_guss_db_user`
- Пароль: `secret`
- База данных: `last_guss_db_app`

База данных будет доступна по адресу `localhost:5432`

**Примечание:** Если база данных уже существует локально, убедитесь, что порт 5432 свободен или измените порт в `docker-compose.yml`

### Шаг 2: Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Создание файла конфигурации
cp .env.example .env

# Редактирование .env файла (при необходимости)
# DATABASE_URL должен соответствовать настройкам из docker-compose.yml
```

**Важно:** Убедитесь, что `DATABASE_URL` в `.env` соответствует настройкам из `docker-compose.yml`:

```env
DATABASE_URL="postgresql://last_guss_db_user:secret@localhost:5432/last_guss_db_app?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
ROUND_DURATION=60
COOLDOWN_DURATION=30
PORT=3000
```

### Шаг 3: Инициализация базы данных

```bash
cd backend

# Генерация Prisma Client
npm run prisma:generate

# Применение миграций
npm run prisma:migrate

# Заполнение базы данных тестовыми данными
npm run prisma:seed
```

### Шаг 4: Сборка и запуск Backend

**Режим разработки:**
```bash
cd backend
npm run start:dev
```

Backend будет доступен по адресу `http://localhost:3000`

**Режим продакшн:**
```bash
cd backend

# Сборка проекта
npm run build

# Запуск собранного приложения
npm run start:prod
# или
npm start
```

### Шаг 5: Настройка Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Создание файла конфигурации
cp .env.example .env

# Редактирование .env файла (при необходимости)
# Убедитесь, что VITE_API_URL указывает на адрес backend
```

**Пример `.env` для frontend:**
```env
VITE_API_URL=http://localhost:3000
```

### Шаг 6: Сборка и запуск Frontend

**Режим разработки:**
```bash
cd frontend
npm run dev
```

Frontend будет доступен по адресу `http://localhost:5173`

**Режим продакшн:**
```bash
cd frontend

# Сборка проекта
npm run build

# Предпросмотр продакшн сборки
npm run preview
```

Собранные файлы будут в папке `frontend/dist/`

### Шаг 7: Проверка работы

1. Откройте браузер и перейдите на `http://localhost:5173`
2. Войдите с тестовыми данными (например, `admin` / `admin123`)
3. Проверьте работу приложения

## Остановка и очистка

```bash
# Остановка базы данных
docker-compose down

# Остановка базы данных с удалением данных
docker-compose down -v
```

## Структура проекта

```
the_last_of_guss/
├── backend/              # NestJS backend
│   ├── src/             # Исходный код
│   ├── prisma/          # Prisma схема и миграции
│   ├── dist/            # Собранный код (после npm run build)
│   └── package.json
├── frontend/            # React frontend
│   ├── src/             # Исходный код
│   ├── dist/            # Собранный код (после npm run build)
│   └── package.json
├── docker-compose.yml   # Конфигурация PostgreSQL
└── Home.md              # Техническое задание
```

## Особенности

- ✅ JWT аутентификация
- ✅ Валидация паролей (минимум 8 символов, только буквы и цифры)
- ✅ Роли пользователей (SURVIVOR, NIKITA, ADMIN)
- ✅ Раунды с cooldown и активной фазой
- ✅ Защита от race conditions при тапах (транзакции с блокировками)
- ✅ Автоматическое определение победителя
- ✅ Клиентский таймер с синхронизацией с сервером
- ✅ Отзывчивый UI на Material-UI

## Тестовые пользователи

После запуска seed скрипта доступны следующие пользователи:

- `admin` / `admin123` - Администратор (может создавать раунды)
- `Никита` / `nikita123` - Пользователь Nikita (тапы не засчитываются)
- `user1` / `user123` - Обычный игрок
- `user2` / `user123` - Обычный игрок
- `user3` / `user123` - Обычный игрок

## Правила игры

- 1 тап = 1 очко
- Каждый 11-й тап = 10 очков
- Тапать можно только в активном раунде
- При равенстве очков победитель определяется по времени первого тапа
- Тапы пользователя Nikita не сохраняются в БД (показываются нули)


