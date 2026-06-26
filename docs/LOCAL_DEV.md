# Local development

Env layout: **[ENV.md](./ENV.md)** (Next vs Convex vs Clerk vs Razorpay).

## Setup

```bash
bun install
cp .env.example .env.local
bun run env:clerk
```

`npx convex dev` fills **LOCAL → Next.js** Convex URLs in `.env.local`.

Push **UPLOAD → Convex** vars:

```bash
bun run convex:clerk-auth   # issuer only
bun run convex:env-push     # OPENCODE_API_KEY (Big Pickle), Razorpay, etc.
```

**Clerk Dashboard:** Convex integration ON + JWT template `convex` (see ENV.md).

## Run

```bash
bun run convex:dev   # terminal 1
bun run dev          # terminal 2 → http://localhost:3000
```

```bash
npx convex run seed:seedOutlets
npx convex run feedPoll:refreshFeed   # RSS seed + Exa widen (see FEED_PIPELINE.md)
# bun run convex:env-push  # EXA_API_KEY + OPENCODE on Convex
```

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Next.js :3000 |
| `bun run build` | Production build |
| `bun run convex:dev` | Convex backend |
| `bun run env:clerk` | Pull Clerk keys |