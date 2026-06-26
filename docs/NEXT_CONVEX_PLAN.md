# Next.js + Convex + Clerk migration

**Branch:** `feat/next-convex-clerk` — do not merge until deploy verified.

## Stack (latest pinned)

| Package | Version |
|---------|---------|
| next | 16.2.9 |
| convex | 1.42.0 |
| @clerk/nextjs | 7.5.8 |

## Architecture

- **Vercel:** Next App Router (`app/`), Clerk middleware, Razorpay webhook `app/api/webhooks/razorpay`.
- **Convex:** schema, queries/mutations/actions, RSS cron (15m), verify (Gemini), billing.

## Commands

```bash
# Terminal 1 — Convex (set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard)
npx convex dev

# Terminal 2 — Next
bun run dev:next

# Seed outlets (once)
npx convex run seed:seedOutlets

# Manual RSS poll
npx convex run rss:pollAll
```

## Env

See **`docs/LOCAL_DEV.md`** and **`.env.example`**

**Convex dashboard:** `CLERK_JWT_ISSUER_DOMAIN`, `GEMINI_API_KEY`, `RAZORPAY_*`, `CONVEX_WEBHOOK_SHARED_SECRET`

## Routes

All former React Router paths → `app/**/page.tsx` with `react-router-dom` aliased to `src/lib/next-router-compat.tsx`.

## Done (prod-code pass)

- Dashboard + `/result/:slug` use Convex when `NEXT_PUBLIC_CONVEX_URL` is set
- `src/services/aggregation/` split (convex vs legacy HTTP)
- Webhook: amount/currency check + `paymentEvents` idempotency
- Convex: `lib/time`, `lib/subscriptions`, `lib/planPricing`

## Remaining cleanup

- Set `CLERK_JWT_ISSUER_DOMAIN` on Convex cloud dev deployment
- Search history still Appwrite on Vite path; optional Convex later
- Remove `apps/api`, Stack when Vite entry retired
- Vercel: Next build `bun run build:next`