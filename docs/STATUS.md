# Facets — status

Last updated: 2026-03-25

## Done

| Area | Items |
|------|--------|
| **Docs** | PRODUCT_PLAN, SELF_HOST, STATUS (this file), PHASE_0_ISSUES |
| **API** | RSS ingest, clustering, stories, outlets, verify (AI), Tavily search, follows, blindspot, feed rank |
| **Auth** | Bearer Stack token → user id; dev `AUTH_TRUST_HEADER` + `VITE_AUTH_TRUST_HEADER` |
| **Billing** | Razorpay orders + checkout UI, confirm + webhook, plan limits, usage on /pricing |
| **Web** | /feed, /story, /following, /pricing, /methodology, /legal, entitlements on pricing |
| **OSS** | docker-compose db+api; optional `docker/Dockerfile.web` |

## In progress / partial

| Area | Gap |
|------|-----|
| **Stack token verify** | API calls Stack `/users/me`; confirm against your Stack project in prod |
| **Razorpay** | Set `RAZORPAY_*` + `BILLING_ENABLED=true`; test mode keys for dev |
| **History** | Verifications in Postgres when using API; Appwrite still primary in web |
| **Outlets** | ~10 seeded; expand pack + stable RSS URLs |
| **Clustering** | Heuristic only; no embeddings |

## Not started

| Area | Notes |
|------|--------|
| Licensed wire APIs | Contracts |
| Custom user RSS feeds | Tier feature |
| Email alerts | Phase 4 |
| Admin UI | Feed/bias ops |
| `apps/web` move | Still root Vite app |
| Media verify on API | Client only |
| CI: block client AI keys in prod | Policy |

## Env quick reference

**API:** `DATABASE_URL`, `STACK_PROJECT_ID`, AI keys, `BILLING_ENABLED`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PRICE_PLUS_INR`, `RAZORPAY_PRICE_PRO_INR`, `WEB_URL`

**Web:** `VITE_API_URL`, `VITE_STACK_*`, `VITE_AUTH_TRUST_HEADER` (dev fallback)

## Commands

```bash
docker compose up --build
bun run api:migrate && bun run api:seed && bun run api:dev
bun run dev   # VITE_API_URL=http://localhost:3001
```