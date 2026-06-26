# Facets

**Many sides. One story.**

## Overview
Facets is a news product for seeing **coverage spread** across outlets (Ground News–style bias bar) and **AI fact-checking** in one stack. Built with **Next.js**, **Convex**, and **Clerk**. It helps users fact-check news articles and headlines using Convex-backed verify with **OpenCode Zen Big Pickle**. The application provides instant credibility assessments, source verification, and corrected information when misinformation is detected.

**🌐 Live Demo**: [https://facets.adityamer.dev/](https://facets.adityamer.dev/)  
**🤖 Verify AI**: [OpenCode Zen](https://opencode.ai/docs/zen/) — model **big-pickle** (`OPENCODE_API_KEY` on Convex)

## ✨ Features
- 🔍 **Smart Text Analysis** - Accepts news headlines, articles, or any text for verification
- 🌐 **Multi-Source Verification** - Uses Exa (and Tavily fallback) for web context before AI verify
- 🤖 **AI-Powered Fact-Checking** - OpenCode **Big Pickle** on Convex
- ✅ **Credibility Scoring** - Provides detailed credibility assessments with confidence levels
- 📝 **Corrected Information** - Offers accurate information when misinformation is detected
- 📱 **Social Sharing** - Share verified results across social media platforms
- 💾 **History Tracking** - Verifications in Convex per user
- 🔐 **User Authentication** - Clerk (sign-in / sign-up)
- 🌙 **Theme Support** - Dark/Light mode toggle for better user experience
- 📊 **Analytics Dashboard** - Track verification history and patterns
- ⚡ **Real-time Updates** - Instant verification results with loading states
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices

## 🚀 Quick Start (Next + Convex + Clerk)

**Local dev:** [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) · copy **`.env.example`** → `.env.local` · `clerk env pull --app app_3Ff8NcoPHzGIjkXQHpcnqZUNK01`

```bash
bun install
bun run convex:dev    # terminal 1
bun run dev           # terminal 2 → http://localhost:3000
```

### Prerequisites
- **Bun** or Node 18+
- **Clerk** app (Facets) + **Convex** project
- **OpenCode Zen** API key for verify → `OPENCODE_API_KEY` on Convex ([docs](https://opencode.ai/docs/zen/))

### Install

```bash
git clone https://github.com/Aditya190803/Facets.git
cd Facets
bun install
cp .env.example .env.local
bun run env:clerk
bun run convex:dev   # links deployment, terminal 1
bun run dev          # :3000, terminal 2
bun run convex:clerk-auth
# add OPENCODE_API_KEY in .env.local UPLOAD section, then:
bun run convex:env-push
```

See [`docs/ENV.md`](docs/ENV.md) and [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md).

### Build & test
```bash
bun run build
bun run test:run
```

### Services
✅ **Auth** — Clerk  
✅ **Data** — Convex  
✅ **Verify** — Big Pickle on Convex  
✅ **Deploy** — Vercel (Next.js)  

## 📱 Usage Guide

### Basic Verification Process
1. **Enter Content**: Paste a news headline, article excerpt, or any text you want to verify
2. **Click Verify**: Hit the "Verify News" button to start the fact-checking process
3. **Review Results**: Get instant credibility assessment with:
   - ✅ **Credibility Score** (0-100%)
   - 📊 **Confidence Level**
   - 🔍 **Source Analysis**
   - 📰 **Related Articles**
   - ✏️ **Corrections** (if misinformation detected)
4. **Share Results**: Use social media buttons to share verified information

### User Account Features
- **Sign Up/Login**: Create an account to save your verification history
- **History Dashboard**: Access all your past verifications
- **Search History**: Find previous verifications quickly
- **Theme Preferences**: Switch between light and dark modes

### Example Verification Types
- 📰 News headlines from any source
- 📄 Article excerpts or full articles
- 📱 Social media claims
- 💬 Statements requiring fact-checking
- 🗳️ Political claims and statements

## Tech Stack
- **Web:** Next.js 16 (App Router), React 18, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Radix
- **Backend / data:** Convex (RSS, stories, verify, billing, history)
- **Auth:** Clerk (+ Convex JWT)
- **Verify AI:** OpenCode Zen **Big Pickle** (`OPENCODE_API_KEY` on Convex)
- **Billing:** Razorpay (Convex actions + webhook)
- **Client search (optional context for verify):** Exa / Tavily in `src/utils/search/`
- **Testing:** Vitest, React Testing Library
- **Deploy:** Vercel

See [`docs/STATUS.md`](docs/STATUS.md) for setup and commands.

## Docs

- **[Status](docs/STATUS.md)** — stack, commands, pre-prod checklist
- **[Local dev](docs/LOCAL_DEV.md)** — Next + Convex + Clerk
- **[Env](docs/ENV.md)** — variables (Vercel + Convex)
- **[Feed pipeline](docs/FEED_PIPELINE.md)** — RSS seed + Exa widen
- **[Ground News gap plan](docs/GROUND_NEWS_GAP_PLAN.md)** — coverage UX roadmap

## Future Enhancements
- Deeper story clustering / entity linking
- Server-side Exa proxy (keys off client)
- Additional billing providers
