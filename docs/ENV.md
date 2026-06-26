# Environment variables — where each value lives

| Section in `.env.local` | Used by | How to set |
|-------------------------|---------|------------|
| **LOCAL → Next.js** | `bun dev`, Vercel | Edit `.env.local` or `bun run env:clerk` |
| **UPLOAD → Convex** | Convex functions | Fill `.env.local` then `bun run convex:env-push`, or Convex Dashboard |
| **Clerk Dashboard** | Auth + JWT for Convex | UI only (not pasted from `.env.local`) |
| **Razorpay Dashboard** | Webhooks + API keys | Copy secrets into `.env.local` / Convex as noted |

## LOCAL → Next.js (Vercel uses the same names)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes |
| `CLERK_SECRET_KEY` | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` … | Yes (routes) |
| `NEXT_PUBLIC_CONVEX_URL` | Yes |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Yes (HTTP actions URL) |
| `CONVEX_DEPLOYMENT` | Yes for `convex` CLI |
| `NEXT_PUBLIC_SITE_URL` | Optional (SEO, sitemap/robots; default `https://facets.adityamer.dev`) |
| `RAZORPAY_WEBHOOK_SECRET` | Optional — must match **Razorpay** webhook secret |
| `CONVEX_WEBHOOK_SHARED_SECRET` | Optional — same value must be on **Convex** (`convex:env-push`) for webhook handler |
| `NEXT_PUBLIC_EXA_API_KEY` | Optional — web search context before Convex verify ([Exa](https://exa.ai)) |
| `NEXT_PUBLIC_TAVILY_API_KEY` | Optional — fallback if Exa fails ([Tavily](https://tavily.com)) |

Pull Clerk keys: `bun run env:clerk`  
Convex URLs: written by `npx convex dev`

## UPLOAD → Convex (`bun run convex:env-push`)

| Variable | Purpose |
|----------|---------|
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk **Frontend API URL** (issuer for JWT template `convex`) |
| `OPENCODE_API_KEY` | OpenCode Zen — [Big Pickle](https://opencode.ai/docs/zen/) verify |
| `EXA_API_KEY` | Exa — feed poll cron (`feedPoll.pollFromExa`); can match `NEXT_PUBLIC_EXA_API_KEY` |
| `BIGPICKLE_MODEL` | Default `big-pickle` |
| `OPENCODE_ZEN_BASE_URL` | Default `https://opencode.ai/zen/v1` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Orders + checkout |
| `RAZORPAY_PRICE_PLUS_INR` / `RAZORPAY_PRICE_PRO_INR` | Plan prices |

Also set **`CONVEX_WEBHOOK_SHARED_SECRET`** on Convex if you use the Razorpay Next webhook (must match LOCAL).

Issuer only: `bun run convex:clerk-auth` (reads publishable key).

## Clerk Dashboard (configure, do not “upload” from `.env`)

1. **API keys** → copied **into** `.env.local` via `bun run env:clerk` (dev) or Vercel env (prod).
2. **Integrations → Convex** → enable integration.
3. **JWT templates** → template named **`convex`** (matches `applicationID: 'convex'` in `convex/auth.config.ts`).
4. **Frontend API URL** = value for `CLERK_JWT_ISSUER_DOMAIN` on Convex (e.g. `https://modest-sloth-52.clerk.accounts.dev`).

No OpenCode/Razorpay keys go in Clerk.

## Razorpay Dashboard

| Where | What |
|-------|------|
| Razorpay → API keys | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` → **UPLOAD → Convex** |
| Razorpay → Webhooks | Secret → `RAZORPAY_WEBHOOK_SECRET` → **LOCAL → Next** |

## Vercel (production)

Copy **LOCAL → Next.js** variables into the Vercel project.  
Convex production deployment gets **UPLOAD → Convex** via Dashboard or `convex env set` on prod deployment.