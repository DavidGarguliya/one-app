# One App Audio (MVP)

Hybrid SSR + SPA audio service with persistent player, admin panel, and NestJS API.

## Architecture summary
- Next.js App Router for `/apps/web` (public) and `/apps/admin` (admin) with shared UI + player packages.
- NestJS REST API (`/apps/api`) with JWT auth, typed DTOs, Swagger at `/docs`.
- Shared packages: `@one-app/ui` (glass design system), `@one-app/types` (DTO), `@one-app/player` (headless engine + Zustand store).
- Infra: docker-compose (Postgres, Redis, Meilisearch, MinIO).

## Commands
```bash
pnpm install
pnpm dev:web      # runs web on 3000
pnpm dev:admin    # runs admin on 3001
pnpm dev:api      # runs NestJS API on 4000
pnpm build        # build all
pnpm lint         # lint all
pnpm test         # vitest unit tests
```

## Env
- `apps/web/.env.example`:
  - `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `apps/admin/.env.example`:
  - `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `apps/api/.env.example`:
  - `PORT=4000`, `DATABASE_URL=postgresql://oneapp:oneapp@localhost:5432/oneapp`, `S3_*`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## Running locally
```bash
docker compose -f infrastructure/docker-compose.yml up -d
psql $DATABASE_URL -f infrastructure/migrations/001_init.sql
psql $DATABASE_URL -f infrastructure/seed/seed.sql
pnpm dev:api
pnpm dev:web  # localhost:3000
pnpm dev:admin # localhost:3001
```

Swagger available at `http://localhost:4000/docs`.

## Notes
- Audio engine is headless and survives route changes via app shell layout. First gesture initializes audio to satisfy autoplay.
- Admin uses glass UI, filters/search stubs ready for API wiring.
- Storage via MinIO (S3 compatible). Use CDN/Cloudflare to enable HTTP Range for audio; set `Cache-Control: public, max-age=120, stale-while-revalidate=600` on media + JSON lists.
