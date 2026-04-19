# Lyrics Engine setup

## Runtime
- Redis: `docker compose -f infrastructure/docker-compose.yml up -d redis`
- FFmpeg: required by `ffmpeg-static` (already bundled, ensure libc deps are present).
- Env (API):
  - `LYRICS_ENGINE_ENABLED=1`
  - `REDIS_URL=redis://127.0.0.1:6379`
  - `LYRICS_PROVIDER=deepgram` (default `whisper` stub)
  - `DEEPGRAM_API_KEY=...` (only for `deepgram`)
  - optional: `DEEPGRAM_MODEL=nova-2`, `DEEPGRAM_ENDPOINT=https://api.deepgram.com/v1/listen`
- Start API: `pnpm --filter api start:dev`

## Frontend
- Toggle UI: `NEXT_PUBLIC_LYRICS_ENABLED=1` (default on).

## Notes
- Canonical output lives in MinIO via `resultJsonUrl` + `lrcUrl`; when a job finishes, the track payload gets `lyricsJsonUrl/lyricsLrcUrl/lyricsProvider/lyricsUpdatedAt` so the player can preload subtitles.
- If Redis is down, the module disables itself; generation endpoints will reject requests.
