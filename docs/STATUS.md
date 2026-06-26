# Facets — status

Last updated: 2026-03-26

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 16 (App Router), Vercel |
| Backend | Convex (RSS, stories, verify, billing, history) |
| Auth | Clerk (+ Convex JWT template `convex`) |
| Verify AI | OpenCode Zen **Big Pickle** (`OPENCODE_API_KEY` on Convex) |
| Billing | Razorpay (Convex actions + Next webhook) |

## Done

- Next-only app; Vite / `apps/api` / Appwrite / Stack removed
- Feed, story detail, following, pricing, dashboard on Convex
- Clerk sign-in/up; middleware-protected routes
- Verify action + monthly limits; `by_contentHash` index for result lookup
- Env layout: `docs/ENV.md`, `convex:env-push`, `convex:clerk-auth`
- Prod pass: stub votes/privacy removed; Razorpay errors logged

## Before production

| Item | Notes |
|------|--------|
| Convex env | `OPENCODE_API_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, optional `RAZORPAY_*`, `GEMINI` → **Big Pickle only** |
| Clerk | Convex integration + JWT template `convex`; prod instance on Vercel |
| Smoke | Sign-in → verify → dashboard → feed (`seed:seedOutlets` + `feedPoll:refreshFeed`) |
| Vercel | LOCAL env block from `.env.example` |
| Merge | `feat/next-convex-clerk` after preview smoke |

## Commands

```bash
bun run convex:dev
bun run dev
bun run convex:clerk-auth
bun run convex:env-push
npx convex run seed:seedOutlets
npx convex run feedPoll:refreshFeed
npx convex run rssMutations:recomputeCanonicalTitles  # after title/cluster changes
```

See [`LOCAL_DEV.md`](./LOCAL_DEV.md), [`ENV.md`](./ENV.md).