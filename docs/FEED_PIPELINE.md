# Feed pipeline — RSS seed + Exa enrich

## Overview

Facets does **not** rely on a single outlet or a single API. Stories are built in two stages so the feed can show **many sources across left, center, and right** on the same headline.

```
┌─────────────────────────────────────────────────────────────────┐
│  Stage 1 — RSS (seed list)                                      │
│  India outlets in convex/seedData.ts → feeds table → pollAll    │
│  New articles → headline clean → cluster (title similarity)     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 2 — Exa (widen coverage)                                 │
│  For thin clusters (few outlets): Exa queries per canonical     │
│  title + site:thehindu.com, site:republicworld.com, …           │
│  Only URLs matching seeded domains → insertArticle → cluster    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Feed UI                                                        │
│  stories.list ranks by distinct outlets + bias spread           │
│  Shows ALL article chips per story (not capped at 4)            │
└─────────────────────────────────────────────────────────────────┘
```

## Cron (Convex)

`convex/crons.ts` every **15 minutes**:

`internal.feedPoll.ingestFeed` → `rss.pollAll` then `feedPoll.enrichFromExa` (up to 14 stories/run).

No separate RSS-only cron required.

## Manual commands

```bash
# Outlets + feed URLs (once per deployment)
npx convex run seed:seedOutlets

# Full pipeline now
npx convex run feedPoll:refreshFeed

# RSS only (debug)
npx convex run rss:pollAll

# Optional title cleanup after rule changes
npx convex run rssMutations:recomputeCanonicalTitles
```

## Environment

| Var | Where | Purpose |
|-----|--------|---------|
| `EXA_API_KEY` | **Convex** | Stage 2 feed enrich + server verify Exa merge |
| `NEXT_PUBLIC_EXA_API_KEY` | Next | Client verify search (optional) |
| `OPENCODE_API_KEY` | Convex | Big Pickle fact-check |

Push Convex vars: `bun run convex:env-push` (copies `EXA_API_KEY` from `NEXT_PUBLIC_EXA_API_KEY` if empty).

## Verify path

`verify.run` merges:

1. Client `searchResults` (Exa/Tavily from browser)
2. Server `verifyEnrich.searchCoverageForVerify` (Exa on Convex, India outlet–biased queries)

Then Big Pickle sees a wider “how everyone is showing it” context.

## Ranking

`stories.list` sorts by:

- distinct outlet count (primary)
- number of bias buckets with coverage
- total source count
- then recency

Logged-in users still get a small boost for stories touching **Following** outlets.

## Limits / cost

- Exa enrich: ~14 stories × ~6 queries × 10 results per cron tick (throttled with ~180ms between calls).
- Only **seeded** India domains are ingested (`convex/lib/outletFromUrl.ts`).
- Clusters with ≥9 distinct outlets are skipped for enrich.

## Files

| File | Role |
|------|------|
| `convex/rss.ts` | RSS poll |
| `convex/feedPoll.ts` | `ingestFeed`, `enrichFromExa`, `refreshFeed` |
| `convex/feedEnrichQueries.ts` | Pick stories to widen |
| `convex/lib/exaClient.ts` | Exa HTTP |
| `convex/verifyEnrich.ts` | Verify-side Exa |
| `convex/rssMutations.ts` | insert + cluster attach |