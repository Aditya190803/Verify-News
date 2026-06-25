# Verify News — Product & Technical Plan

**North star:** RSS and licensed news aggregation with a **Ground News–style bias and coverage UX**, shipped as **open-source self-host** and a **hosted B2C subscription** product.

**Current baseline (repo today):** Vite/React SPA, Stack Auth, Appwrite (history), client-side AI verification (Gemini/OpenRouter + LangSearch/Tavily). No RSS pipeline, no story clustering, no outlet/bias model, no backend ingestion, no billing.

---

## 1. Product pillars

| Pillar | What users get | Non-goals (v1) |
|--------|----------------|----------------|
| **Aggregation** | Timely stories from RSS + partner/licensed feeds; normalized articles | Scraping paywalled sites without licenses |
| **Coverage lens** | Same story across outlets; left/center/right (or regional) distribution | Claiming “truth” — bias is *framing*, separate from fact-check |
| **Fact-check lane** | Keep today’s verify flow as a **secondary** action on a story or pasted text | Replacing professional fact-checkers |
| **Self-host** | One-command deploy, your keys, your data | Managed K8s operator (later) |
| **B2C hosted** | Sign up, pay, sync feeds/alerts across devices | Enterprise SSO / multi-tenant newsroom (later) |

---

## 2. Ground News–style UX (reference behaviors)

Map these to concrete screens and APIs:

1. **Story page (cluster)** — One headline cluster; tab or carousel of **sources** with outlet name, thumb, snippet, link out.
2. **Bias bar** — Horizontal spectrum showing how many sources (or % coverage) fall into bias buckets for *this story*.
3. **Blindspot callout** — “You mostly read center-left; this story is heavily covered on the right” (needs user follow graph + optional onboarding quiz).
4. **My feed** — Topics, saved outlets, keyword alerts (subscription-gated tiers).
5. **Verify CTA** — On cluster or article: “Check this claim” → existing `verifyNewsContent` pipeline (server-side in prod).
6. **Transparency** — Methodology page: how outlets are rated, data sources, update cadence, limitations.

**Bias data strategy (pick one primary path in Phase 2):**

- **A. Curated outlet metadata (recommended v1)** — Maintain `outlets` table: name, domains, `bias_label` (enum), `factuality_tier` (optional), `ownership`, `source_of_rating` (e.g. MBFC, AllSides, manual). No ML required for v1.
- **B. Licensed third-party bias API** — Faster UX, worse for OSS (license keys, redistribution terms).
- **C. ML classification** — Defer; expensive and hard to explain on methodology page.

---

## 3. Gap analysis: today → target

| Area | Today | Target |
|------|-------|--------|
| Content ingestion | User paste + web search | Scheduled RSS/licensed fetch, dedupe, store |
| Story identity | None | Cluster ID (title similarity + entities + time window) |
| Backend | Optional AI proxy URL; secrets in Vite env | Required API: feeds, articles, clusters, verify, billing webhooks |
| Database | Appwrite collections for verifications | Postgres (or SQLite for tiny self-host) + optional Appwrite migration |
| Auth | Stack Auth | Keep Stack **or** self-host OIDC (Better Auth / Keycloak); same user model for hosted |
| Search | LangSearch/Tavily client-side | Server-side search for verify; **local** full-text on ingested articles |
| Deploy | Vercel static | Docker Compose (OSS); hosted = Compose or PaaS + worker |
| Monetization | None | Stripe (or Lemon Squeezy) tiers + feature flags |

---

## 4. Target architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients (React SPA)                       │
│  Feed · Story · Bias · Verify · Settings · Billing portal      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────────┐
│                     API (Node/Bun or Hono)                         │
│  /feeds /articles /stories /outlets /verify /users /billing      │
└─────┬──────────────────┬──────────────────┬─────────────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌───────────┐    ┌───────────────┐   ┌─────────────┐
│ Postgres  │    │ Redis (opt.)  │   │ Object store│
│ articles  │    │ job queues    │   │ (images)    │
│ clusters  │    │ rate limits   │   │ optional    │
└───────────┘    └───────────────┘   └─────────────┘
      ▲
      │ write
┌─────┴──────────────────────────────────────────┐
│ Workers                                         │
│  RSS poller · normalizer · clusterer · embedder │
│  (optional) nightly bias/outlet sync            │
└────────────────────────────────────────────────┘
      ▲
      │ HTTPS
┌─────┴────────────┐     ┌─────────────────────┐
│ RSS / Atom       │     │ Licensed feeds/APIs │
│ publisher feeds  │     │ (contracts)         │
└──────────────────┘     └─────────────────────┘
```

**Monorepo layout (suggested):**

- `apps/web` — move current `src/` (incremental)
- `apps/api` — REST or tRPC
- `apps/worker` — feed poll + cluster jobs (can be same process as API at smallest scale)
- `packages/db` — Drizzle/Prisma schema + migrations
- `packages/shared` — Zod types (`Article`, `StoryCluster`, `Outlet`, `VerificationResult`)
- `docker/` — `compose.yaml`, `.env.example`, seed outlets

**Keep from current codebase:**

- `verifier.ts` + `aiProviders.ts` + search utils → **server routes** only (remove API keys from browser).
- UI primitives (shadcn), i18n, theme, auth context patterns.
- Verification history → migrate schema to Postgres `verifications` linked to `user_id` and optional `story_id`.

---

## 5. Data model (minimal)

```text
outlets
  id, name, domain, rss_url?, bias_label, factuality?, metadata_json, updated_at

feeds
  id, outlet_id, url, poll_interval_sec, last_etag, last_modified, enabled

articles
  id, feed_id, outlet_id, guid, url, title, summary, body_text?, published_at, fetched_at, content_hash

story_clusters
  id, canonical_title, slug, first_seen_at, last_updated_at, entity_tags[]

story_articles
  story_id, article_id, relevance_score

user_follows
  user_id, outlet_id | topic_tag

user_bias_profile
  user_id, self_reported_lean?, computed_blindspot_json

verifications
  (existing fields) + user_id, story_id?, content_hash, created_at

subscriptions
  user_id, stripe_customer_id, plan, status, current_period_end

licensed_sources
  id, provider, contract_ref, api_config_json, enabled
```

**Clustering v1 (simple):** On new article, normalize title → token set; match existing cluster if Jaccard + same-day window + shared named entities (cheap NER or capitalized phrase heuristic). v2: embeddings + HDBSCAN.

---

## 6. Legal & compliance checklist

- **RSS:** Respect `robots`/ToS; store title, summary, link; full text only where license allows.
- **Attribution:** Always link to original; show outlet logo/name per feed guidelines.
- **Bias ratings:** Document provenance; allow outlet dispute contact; avoid defamatory copy.
- **GDPR/CCPA:** Export/delete user data; minimal analytics on self-host.
- **AI verify:** Disclaimers (already on About/How it works); log prompts only if disclosed in privacy policy.

---

## 7. OSS self-host package

**Goal:** `git clone` → `cp .env.example .env` → `docker compose up` → working feed reader with default outlet pack.

| Component | Self-host default |
|-----------|-------------------|
| DB | Postgres 16 container |
| API + worker | Single `api` image with `WORKER_ENABLED=true` |
| Web | nginx serving `apps/web` build or Vite preview in dev |
| Auth | Env: `AUTH_MODE=self_hosted` (email magic link or local only); or bring your own Stack project |
| AI verify | User supplies `GEMINI_*` / `OPENROUTER_*`; rate limit per IP |
| Billing | Disabled; all features or “community tier” locally |

**Ship:**

- `LICENSE` (e.g. AGPL-3.0 or Apache-2.0 — decide before public launch)
- `SELF_HOST.md` — hardware mins, backup, upgrades
- Seed script: 50–100 major RSS outlets with bias labels (CSV in repo, versioned)
- No hosted-only secrets in default compose

---

## 8. B2C subscription (hosted product)

**Suggested tiers (adjust pricing later):**

| Feature | Free | Plus | Pro |
|---------|------|------|-----|
| Read global story feed | ✓ (limited history) | ✓ | ✓ |
| Custom feeds / topics | 3 | 25 | unlimited |
| Alerts (email/push) | — | daily digest | realtime |
| Blindspot insights | — | ✓ | ✓ |
| AI verifications / month | 5 | 50 | 500 |
| API access | — | — | ✓ |

**Implementation:**

- Razorpay Checkout + webhook handler in `apps/api` (INR) (`subscription.updated`, `invoice.paid`).
- Entitlements in JWT claims or `subscriptions` table checked middleware-side.
- **Hosted** deployment: same Docker images, managed Postgres, Redis, CDN; `BILLING_ENABLED=true`.
- Stack Auth (or replacement) for hosted only; link `stack_user_id` ↔ `stripe_customer_id`.

**Migration from current Vercel app:**

- Phase hosted-beta: API on Fly/Railway/Render; web still Vercel with `VITE_API_URL`.
- Move verification off client before marketing “unlimited” verify on paid tiers.

---

## 9. Phased roadmap

### Phase 0 — Foundation (2–3 weeks)

- [ ] Monorepo or `apps/api` + keep web in place
- [ ] Postgres schema + migrations; seed `outlets` CSV
- [ ] RSS poller: fetch, parse, dedupe by `guid`/`content_hash`
- [ ] REST: `GET /stories`, `GET /stories/:id`, `GET /articles`
- [ ] Docker Compose for API + DB + web
- [ ] Move AI verify to `POST /verify` (proxy); strip keys from Vite production build

**Exit criteria:** Self-host shows a chronological article list from ≥10 feeds.

### Phase 1 — Story UX (2–3 weeks)

- [ ] Clustering job + `story_clusters` / `story_articles`
- [ ] Story page UI: source list + bias bar from outlet metadata
- [ ] Global feed home: cards with “N sources · bias spread”
- [ ] Methodology + About refresh (positioning vs Ground News)

**Exit criteria:** One story shows 3+ outlets with bias bar.

### Phase 2 — Identity & history (2 weeks)

- [ ] Unify auth: hosted Stack; self-host optional auth
- [ ] Migrate verification history to Postgres
- [ ] Saved stories, follow outlets
- [ ] Basic blindspot: compare user follows to cluster coverage

**Exit criteria:** Logged-in user sees history and follows affecting feed rank.

### Phase 3 — Licensed feeds & quality (ongoing)

- [ ] `licensed_sources` adapter interface (AP, Reuters, etc. — per contract)
- [ ] Full-text search (Postgres `tsvector` or Meilisearch if needed)
- [ ] Admin UI: enable/disable feeds, reassign outlet bias

### Phase 4 — B2C launch (2–3 weeks)

- [ ] Stripe products + webhooks + entitlement middleware
- [ ] Pricing page, upgrade flows, usage meters for verify
- [ ] Email (digest alerts) — Resend/Postmark
- [ ] Status page, support email, ToS/Privacy update

### Phase 5 — Hardening & community

- [ ] Outlet pack contributions (PR workflow for CSV)
- [ ] Optional mobile PWA polish (existing vite-plugin-pwa)
- [ ] Performance: CDN cache for public story pages
- [ ] SOC2-ish basics only if revenue justifies

---

## 10. Key technical decisions (resolve early)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| API framework | Hono on Bun, Fastify, Nest | **Hono + Bun** — aligns with `bun.lock`, small surface |
| ORM | Drizzle, Prisma | **Drizzle** — light migrations, good for OSS |
| Auth hosted | Keep Stack, Clerk, Better Auth | **Stack short-term**; abstract behind `AuthProvider` |
| Auth self-host | Disable, Better Auth, Keycloak | **Better Auth** in API for email-only v1 |
| Clustering | Rules vs embeddings | **Rules v1**, embeddings when >5k articles/day |
| Bias source | MBFC/AllSides manual import | **CSV seed + quarterly manual update** |
| Fact-check vs bias | Single app | **Two tabs on story**: Coverage (bias) vs Verify (AI) |

---

## 11. Metrics & success

- **Self-host:** GitHub stars, Docker pulls, successful compose installs (survey/issue template)
- **Hosted:** Free → paid conversion, churn, verifications per paid user, DAU on story pages
- **Quality:** Cluster purity (manual audit sample), feed error rate, p95 story page load

---

## 12. Immediate next actions (this repo)

1. Add `docs/PRODUCT_PLAN.md` (this file) to README link under “Roadmap”.
2. Create `packages/shared` types extracted from `src/types/news.ts`.
3. Scaffold `apps/api` with health check + one RSS feed poll proof.
4. Add `docker-compose.yml` with Postgres only (worker next commit).
5. Open GitHub issues per Phase 0 checkboxes.

---

## 13. Risks

| Risk | Mitigation |
|------|------------|
| Bias label backlash | Methodology, sources, correction process |
| RSS breakage | Per-feed health, admin disable, user-agent policy |
| AI cost on hosted | Hard monthly caps per tier; cache verify results by `content_hash` |
| License cost for wire services | Start RSS-only; add licensed when revenue covers |
| Scope creep (full Ground News clone) | Ship cluster + bias bar before blindspot/push |

---

*Document version: 2026-03-25 — aligns with user vision: RSS/licensed aggregation, Ground News–style bias UX, OSS self-host + B2C subscription.*