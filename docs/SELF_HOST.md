# Self-host Verify News (Phase 0)

## Requirements

- Docker + Docker Compose
- Optional: [Bun](https://bun.sh) for local API dev without Docker

## Quick start (Docker)

```bash
cp apps/api/.env.example apps/api/.env   # optional for local bun
docker compose up --build   # db + api + web on :8080
```

- Postgres: `localhost:5432` (user `verify` / password `verify` / db `verifynews`)
- API: http://localhost:3001/health
- Stories: http://localhost:3001/stories
- Manual RSS poll: `curl -X POST http://localhost:3001/feeds/poll`

First boot runs migrations, seeds 10 outlets, and starts RSS polling when `WORKER_ENABLED=true`.

## Local dev (API only)

```bash
docker compose up db -d
cd apps/api
cp .env.example .env
bun install   # from repo root: bun install
bun run db:migrate
bun run db:seed
bun run dev
```

## Web app + API

```bash
# terminal 1
docker compose up db api

# terminal 2 — from repo root
echo 'VITE_API_URL=http://localhost:3001' >> .env.local
bun run dev
```

Open http://localhost:8080 (Vite port from `vite.config.ts`).

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | (required) | Postgres connection |
| `PORT` | `3001` | API port |
| `WORKER_ENABLED` | `false` | Background RSS polling |
| `FEED_POLL_INTERVAL_MS` | `900000` | Poll interval (15 min) |
| `WORKER_SECRET` | (optional) | Require `x-worker-secret` on `POST /feeds/poll` |
| `BILLING_ENABLED` | `false` | When false, dev gets plus-like limits; no Stripe |
| `STRIPE_WEBHOOK_SECRET` | (optional) | Stripe webhook signature (hosted only) |
| `CORS_ORIGIN` | localhost dev ports | Comma-separated origins |

## Backups

```bash
docker compose exec db pg_dump -U verify verifynews > backup.sql
```

## Upgrades

```bash
git pull
docker compose build api
docker compose up -d
# migrations run on api container start
```

## License

Choose AGPL vs Apache before public OSS launch (see [PRODUCT_PLAN.md](./PRODUCT_PLAN.md)).