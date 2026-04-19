#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/vincentvega/Documents/ProSound/WEBSITE/one-app"
cd "$ROOT"

echo "==> Cleaning caches and build artifacts"
rm -rf node_modules \
  apps/web/.next apps/web/.turbo \
  apps/admin/.next apps/admin/.turbo \
  apps/api/dist \
  .turbo

echo "==> Installing workspace dependencies"
pnpm install

echo "==> Starting api, web, admin (Ctrl+C to stop all)"
pnpm dlx concurrently -n api,web,admin -c "cyan,magenta,green" \
  "S3_INLINE=1 pnpm --filter api dev" \
  "NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter web dev" \
  "NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter admin dev"
