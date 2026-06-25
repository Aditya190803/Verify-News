# Phase 0 — GitHub issues (create manually)

Copy each block as a new issue.

---

**Title:** Monorepo workspaces + shared types package

**Body:**
- [x] `packages/shared` with aggregation + verification types
- [ ] Re-export or align `src/types/news.ts` with `@verify-news/shared`

---

**Title:** API — Postgres schema + Drizzle migrations

**Body:**
- [x] outlets, feeds, articles, story_clusters, story_articles
- [ ] Review indexes before production load

---

**Title:** API — RSS poller + seed outlets

**Body:**
- [x] `pollFeed` / `pollAllEnabledFeeds`
- [x] `data/outlets.seed.json` (10 feeds)
- [ ] Replace brittle feed URLs (Reuters, AP) with stable publisher RSS

---

**Title:** API — `GET /stories` with bias spread

**Body:**
- [x] List + detail by id/slug
- [ ] Real clustering (merge articles into one story)

---

**Title:** Docker Compose self-host

**Body:**
- [x] `docker-compose.yml` (db + api)
- [ ] Add `web` service or document Vite against API

---

**Title:** Move AI verify off the client

**Body:**
- [x] `POST /verify` with OpenRouter/Gemini (server env keys)
- [x] Web uses proxy when `VITE_API_URL` is set
- [ ] Remove client-side AI keys from production builds / docs only hosted keys on API

---

**Title:** Web — story feed UI (Phase 1 prep)

**Body:**
- [x] `/feed` + `/story/:slug` + `BiasBar`
- [x] `/methodology`

---

**Title:** B2C Stripe + entitlements (Phase 4)

**Body:** See [PRODUCT_PLAN.md](./PRODUCT_PLAN.md) Phase 4.