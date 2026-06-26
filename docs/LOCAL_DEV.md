# Local development

## Setup

```bash
bun install
cp .env.example .env.local
bun run env:clerk
```

Add Convex URL from `bun run convex:dev` output to `.env.local`:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

## Convex env (dashboard)

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://YOUR.clerk.accounts.dev"
npx convex env set GEMINI_API_KEY "optional-for-verify"
```

## Run

```bash
bun run convex:dev   # terminal 1
bun run dev          # terminal 2 → http://localhost:3000
```

```bash
npx convex run seed:seedOutlets
npx convex run rss:pollAll
```

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Next.js :3000 |
| `bun run build` | Production build |
| `bun run convex:dev` | Convex backend |
| `bun run env:clerk` | Pull Clerk keys |