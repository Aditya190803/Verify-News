# Ground News vs Facets — how they work, gaps, and plan

Last updated: 2026-03-26

References: [Ground News About](https://ground.news/about), [Rating system](https://ground.news/rating-system), [How it works (Help)](https://help.ground.news/en/articles/485057), [Vantage features](https://help.ground.news/en/articles/7541441), [Blindspot](https://ground.news/blindspot).

---

## 1. How Ground News works (end-to-end)

### Ingestion & scale

| Step | What Ground does |
|------|------------------|
| Volume | ~**60,000 articles/day** from **50,000+** publishers globally |
| Normalize | Parse articles into a common schema (headline, outlet, time, URL, etc.) |
| Cluster | **Same real-world event** → **one story**; multiple articles attached |
| Cadence | Continuous ingestion (not user-triggered) |

Clustering quality is core IP (not fully public); likely title + entities + time + possibly embeddings.

### Ratings layer (publication-level, not per-article)

| Dimension | Source | Notes |
|-----------|--------|--------|
| **Political bias** | Average of **AllSides**, **Ad Fontes**, **Media Bias Fact Check** | 7-point scale: Far Left → Far Right; updated ongoing |
| **Factuality** | Average of **Ad Fontes** + **MBFC** | Very Low → Very High; publication-level |
| **Ownership** | **Ground-researched** | 8 categories (conglomerate, private equity, individual, government, telecom, corporation, independent, other); **2,276+** outlets hand-coded |

Bias bar on a **story** = distribution of **covering sources** by their **outlet** bias rating (not ML on article text).

### Reader-facing product

| Surface | Behavior |
|---------|----------|
| **Story / coverage page** | One event; **compare headlines** side-by-side; snippets; links out |
| **Bias bar** | Visual % or count across spectrum for **this story** |
| **Bias Comparison summary** | Short narrative: how **left vs right** outlets frame the same story differently |
| **Blindspot feed** | Stories **disproportionately covered** by one side; **formal formula** (e.g. left blindspot: &lt;10 left sources, right ≥33%, caps on low-factuality %) |
| **Sort & filter** | By bias, factuality, ownership, location, etc. (deeper on **Vantage**) |
| **Search** | Find articles / **coverage of specific events** |
| **My News Bias** (Vantage) | Analytics on **your** reading: bias/factuality/ownership mix; habits over time |
| **Alternative media** (Vantage beta) | Podcasts/video mentions with bias labels + timestamps |
| **Verify lane** | **Not** their main product — comparison & transparency, not AI fact-check as hero |
| **Extension** | Bias breakdown on articles shared on social / arbitrary URLs |
| **Apps + web** | iOS/Android; subscriptions sync |
| **Newsletters** | Blindspot Report, Burst Your Bubble, etc. |

### Business & trust

- **B2C subscriptions**: Free → Premium → **Vantage** (~$99/yr positioning)
- **Methodology** public; dispute path for ratings
- **No** “we decide truth” — bias = framing; factuality = outlet reputation

---

## 2. How Facets works today (summary)

See also [`FEED_PIPELINE.md`](./FEED_PIPELINE.md).

| Layer | Facets today |
|-------|----------------|
| **Ingestion** | **~10 India outlets** RSS + **Exa enrich** on thin clusters; cron **15 min** |
| **Clustering** | Headline token Jaccard + same-day window; canonical title picker |
| **Bias** | **Manual seed** (`center-left`, `left`, `right`, etc.) — **5 buckets + unknown**, no Far Left/Right |
| **Factuality** | Seeded (`high` / `mixed`) — **not** shown prominently per source on feed |
| **Ownership** | **None** |
| **Story UI** | Feed + story detail; **all outlet chips**; bias bar; optional **personal blindspot hint** (follow graph) |
| **Blindspot feed** | **No** dedicated feed or Ground-style formula |
| **Bias comparison** | **No** left-vs-right summary text |
| **Search** | Client Exa/Tavily for **verify**; server Exa merge in `verify.run`; **no** global story search UI |
| **Verify** | **Hero feature** — Convex Big Pickle + search context (different positioning than Ground) |
| **Personalization** | **Following** outlets boosts ranking; `userBiasProfile` optional |
| **Billing** | Razorpay **Plus/Pro**; entitlements stub (`blindspot` flag on paid) |
| **Geo** | **India national** focus, not global / US spectrum |
| **Scale** | Hundreds–thousands of articles, not 60k/day |

---

## 3. Gap matrix (Facets vs Ground News)

Legend: ✅ parity / acceptable · 🟡 partial · ❌ missing · ➕ Facets extra (not on Ground)

| # | Capability | Ground News | Facets | Gap severity |
|---|------------|-------------|--------|----------------|
| **A. Data & ingestion** |
| A1 | Source count | 50k+ publishers | ~10 seeded India | ❌ Critical |
| A2 | Articles/day | ~60k | RSS-limited + Exa cap | ❌ Critical |
| A3 | Global editions | US, intl, local | India only | ❌ High (if goal is Ground-like) |
| A4 | Licensed/partner feeds | Implied at scale | RSS only | 🟡 Legal/scale risk |
| A5 | Ingest pipeline | Proprietary continuous | RSS cron + Exa enrich | 🟡 Architecture OK, scale not |
| A6 | Clustering quality | Production-grade | Jaccard heuristic | 🟡 Medium |
| A7 | Entity/event linking | Strong (inferred) | Title-only | ❌ High |
| **B. Ratings & transparency** |
| B1 | Bias scale | 7-point + average of 3 orgs | 5-point manual seed | 🟡 Medium |
| B2 | Third-party ratings | AllSides, Ad Fontes, MBFC | Manual “aligned with” | ❌ High (trust) |
| B3 | Factuality on story | Per-outlet tier visible | In DB, weak UI | 🟡 Medium |
| B4 | Ownership categories | 8 types, 2k+ outlets | None | ❌ High |
| B5 | Rating dispute / updates | Documented process | Issue tracker mention | 🟡 Low |
| B6 | Methodology page | Rich | Exists but **stale paths** | 🟡 Low fix |
| **C. Story experience** |
| C1 | Multi-source story page | Core | Story detail + all chips | ✅ / 🟡 (no headline diff UI) |
| C2 | Bias bar | Core | `BiasBar` component | ✅ |
| C3 | Compare headlines framing | Side-by-side emphasis | List by bias sort | 🟡 Medium |
| C4 | Bias Comparison summary | AI/editorial summary | None | ❌ High |
| C5 | Thumbnails / rich cards | Yes | Text-first | 🟡 Low |
| C6 | Sort & filter coverage | Advanced (Vantage) | Rank by coverage only | ❌ High |
| **D. Blindspot & bubble** |
| D1 | Blindspot **feed** | Dedicated product surface | None | ❌ Critical |
| D2 | Blindspot **formula** | Published rules + caps | Simple user vs story delta | ❌ High |
| D3 | “For the Left / Right” tabs | Yes | No | ❌ Medium |
| D4 | Blindspot newsletter | Yes | No | ❌ Medium |
| D5 | Per-story blindspot hint | Part of Vantage analytics | Plus/pro `blindspot` message | 🟡 Partial |
| **E. Personalization & search** |
| E1 | Follow sources/topics | Yes | Following outlets | 🟡 No topics/keywords |
| E2 | My News Bias dashboard | Vantage | None | ❌ High |
| E3 | Search events/coverage | Yes | No story search | ❌ High |
| E4 | Keyword alerts | Subscription | None | ❌ Medium |
| **F. Distribution** |
| F1 | Mobile apps | iOS/Android | Web only | ❌ Medium |
| F2 | Browser extension | Bias checker | None | ❌ Medium |
| F3 | Newsletters | Multiple | None | ❌ Low |
| **G. Monetization** |
| G1 | Tiered SaaS | Free/Premium/Vantage | Free/Plus/Pro | 🟡 Different feature map |
| G2 | Unlimited articles | Paywall on free | Open feed | ➕ Facets more open |
| **H. Fact-check lane** |
| H1 | AI verify | Not primary | **Big Pickle + Exa** | ➕ Differentiator |
| H2 | Separate truth vs framing | Explicit | Methodology says so | ✅ |

---

## 4. Strategic positioning (recommended)

**Do not clone Ground 1:1.** Facets’ viable wedge:

1. **India coverage lens** (Ground is US-centric in bias taxonomy).
2. **Open-source + self-host** (Ground is closed SaaS).
3. **Verify lane** as first-class (Ground is comparison-first).

Ground parity targets: **multi-outlet clusters**, **bias bar**, **blindspot discovery**, **methodology trust**.

---

## 5. Phased plan (Facets → Ground-class coverage UX)

### Phase 0 — Done

- [x] RSS seed + Exa widen ([`FEED_PIPELINE.md`](./FEED_PIPELINE.md))
- [x] Feed ranks by outlet diversity; show all sources
- [x] Methodology + ownership/blindspot copy

### Phase 1–2 — Implemented (2026-03-26)

- [x] **30 outlets** in `seedData.ts` + ownership categories
- [x] **FactualityBadge** on feed + story
- [x] **HeadlineCompare** left vs right columns
- [x] **Bias compare** action (`storyCompare.generateBiasCompare`, Plus/Pro)
- [x] **Story search** (`stories.search`, feed search box)
- [x] **Clustering v2** entity overlap in `cluster.ts`
- [x] **`/blindspot`** + `blindspotFormula` + cron `recomputeBlindspots`
- [x] **Feed filters** min outlets; ownership filter API
- [x] **Coverage diet** on dashboard (followed outlets)
- [x] **Topic follows** (`topics.ts`)
- [x] **PWA manifest** stub

### Still open

- [ ] Third-party rating import (AllSides/MBFC license)
- [ ] Newsletter / Resend cron
- [ ] Browser extension, native apps
- [ ] Embeddings clustering (Phase 5)

### Phase 1 — Trust & story UX (4–6 weeks)

| Item | Deliverable |
|------|-------------|
| **Outlet catalog** | Expand to **30–50** India + intl sources; domain map in `seedData` |
| **Factuality in UI** | Badge per source on story page; filter low-factuality in enrich |
| **Headline compare** | Two-column **left vs right** (or lean buckets) headline excerpts |
| **Bias comparison summary** | Convex action: Big Pickle **short** compare (not full verify) from cluster articles |
| **Story search** | Convex full-text or Exa: “find coverage of X” → cluster list |
| **Clustering v2** | Add **entities** (places, people) from title; tighten false merges |

### Phase 2 — Blindspot product (4–6 weeks)

| Item | Deliverable |
|------|-------------|
| **Blindspot formula** | Port Ground-style rules (adapted to 5-bias buckets + India) |
| **`/blindspot` feed** | Query: stories meeting formula; tabs All / missing-left / missing-right |
| **Blindspot in cron** | Recompute flags on `storyClusters` (`blindspotSide`, `scores`) |
| **Newsletter stub** | Weekly cron → email (Resend) optional |

### Phase 3 — Ratings & ownership (6–10 weeks)

| Item | Deliverable |
|------|-------------|
| **Import pipeline** | CSV/API from AllSides/MBFC where license allows; else manual |
| **Ownership table** | `outlets.ownershipCategory` + UI on story filter (Vantage-like) |
| **7-point mapping** | Map external ratings → display scale |
| **User dispute** | Form → admin review → seed update |

### Phase 4 — Personalization & paid (6–8 weeks)

| Item | Deliverable |
|------|-------------|
| **My coverage diet** | Dashboard: % read by bias (from clicks or follows) |
| **Topics & alerts** | Follow topic; notify when new cluster matches |
| **Entitlements** | Map Plus/Pro to blindspot feed, compare summary, alerts |
| **Sort/filter on feed** | Bias min/max, factuality floor, outlet ownership |

### Phase 5 — Scale & distribution (ongoing)

| Item | Deliverable |
|------|-------------|
| **Ingest scale** | More feeds; optional MediaCloud/EventRegistry-style partner |
| **Embeddings cluster** | Semantic merge beyond Jaccard |
| **PWA / mobile** | Installable; not full native v1 |
| **Extension** | MV3: domain → outlet bias from Facets API |

---

## 6. What **not** to build early

- **60k articles/day** without licensing budget — unsustainable on RSS+Exa alone.
- **Alternative media** (podcast/video) — high cost; defer past Phase 4.
- **US Far Left/Right** taxonomy for India product — use **India-relevant** spectrum (regional, language, outlet type).
- Replacing **verify** with Ground’s non-AI stance — keep both lanes.

---

## 7. Quick wins (next sprint)

1. **`/blindspot` page** — query stories where `biasSpread` is skewed (simple rule before full formula).
2. **Factuality chips** on `Feed` + `StoryDetail`.
3. **Methodology** update + link to `FEED_PIPELINE` + rating sources plan.
4. **Expand `OUTLET_SEED`** to 25+ with working RSS URLs.
5. **Bias compare blurb** — one LLM call per story on demand (cached), Pro-gated.

---

## 8. Success metrics (Ground-like)

| Metric | Target |
|--------|--------|
| Median **outlets per cluster** | ≥ 3 (India seed set) |
| % stories with **both** left-leaning and right-leaning source | ≥ 25% of feed |
| Time to fresh story after publish | &lt; 30 min (cron + enrich) |
| User can explain bias bar | Methodology + in-UI legend (done) |
| Verify vs framing confusion | Methodology + separate CTAs (done) |

---

## 9. Summary

| | Ground News | Facets |
|---|-------------|--------|
| **Core loop** | Ingest at scale → cluster → rate outlets → compare coverage | RSS+Exa → cluster → manual rates → compare + **verify** |
| **Biggest gaps** | Scale, blindspot feed, third-party ratings, ownership, My News Bias, search/filter | |
| **Biggest strengths** | Mature product, global catalog | Open stack, India focus, AI verify, hybrid pipeline |

**Plan in one line:** Keep Facets’ **verify + open India lens**; close gaps in **blindspot**, **outlet breadth**, **compare summaries**, and **trust data** (factuality/ownership)—not in chasing 50k sources day one.