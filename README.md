# One App Audio (MVP)

Гибридный аудиосервис SSR + SPA с постоянным плеером, админ-панелью и API на NestJS.

## Краткое описание архитектуры

- **Next.js (App Router)**
  - `/apps/web` — публичное веб-приложение
  - `/apps/admin` — админ-панель
  - Общие UI-компоненты и плеер вынесены в shared-пакеты

- **NestJS API** (`/apps/api`)
  - REST API
  - JWT-аутентификация
  - Типизированные DTO
  - Swagger доступен по `/docs`

- **Общие пакеты**
  - `@one-app/ui` — glass design system
  - `@one-app/types` — DTO и общие типы
  - `@one-app/player` — headless-аудиодвижок + Zustand store

- **Инфраструктура**
  - docker-compose
  - Postgres
  - Redis
  - Meilisearch
  - MinIO (S3-совместимое хранилище)

## Команды

```bash
pnpm install
pnpm dev:web      # web-приложение на 3000
pnpm dev:admin    # админка на 3001
pnpm dev:api      # NestJS API на 4000
pnpm build        # сборка всех приложений
pnpm lint         # линтинг
pnpm test         # unit-тесты (vitest)
```

## Переменные окружения

### `apps/web/.env.example`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### `apps/admin/.env.example`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### `apps/api/.env.example`
```env
PORT=4000
DATABASE_URL=postgresql://oneapp:oneapp@localhost:5432/oneapp
S3_*
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## Локальный запуск

```bash
docker compose -f infrastructure/docker-compose.yml up -d

psql $DATABASE_URL -f infrastructure/migrations/001_init.sql
psql $DATABASE_URL -f infrastructure/seed/seed.sql

pnpm dev:api
pnpm dev:web    # http://localhost:3000
pnpm dev:admin  # http://localhost:3001
```

Swagger доступен по адресу:  
http://localhost:4000/docs

## Примечания

- Аудиодвижок является headless и сохраняется при смене роутов благодаря app-shell layout.  
  Первое пользовательское действие инициализирует аудио для обхода ограничений autoplay.

- Админ-панель использует glass UI.  
  Фильтры и поиск подготовлены для последующего подключения API.

- Хранение файлов реализовано через MinIO (S3-compatible).  
  Рекомендуется использовать CDN (например, Cloudflare) с поддержкой HTTP Range для аудио.

  Рекомендуемые заголовки:
  ```
  Cache-Control: public, max-age=120, stale-while-revalidate=600
  ```
  для медиафайлов и JSON-списков.
