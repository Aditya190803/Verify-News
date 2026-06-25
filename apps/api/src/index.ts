import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import feeds from './routes/feeds';
import stories from './routes/stories';
import me from './routes/me';
import outlets from './routes/outlets';
import billing, { countVerificationsThisMonth } from './routes/billing';
import searchRoute from './routes/search';
import { authMiddleware } from './middleware/auth';
import { db } from './db/client';
import { subscriptions, verifications } from './db/schema';
import { PLAN_LIMITS } from './lib/plans';
import { getUserPlan } from './lib/entitlements';
import { pollAllEnabledFeeds } from './worker/rss';
import { verifyContent } from './services/verify';
import { searchForVerify } from './services/search';
import type { SearchResponse } from '@verify-news/shared';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:8080', 'http://localhost:5173'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'x-worker-secret', 'x-razorpay-signature'],
  }),
);

app.use('*', authMiddleware);

app.get('/health', (c) => c.json({ ok: true, service: 'facets-api' }));

app.route('/feeds', feeds);
app.route('/stories', stories);
app.route('/me', me);
app.route('/outlets', outlets);
app.route('/billing', billing);
app.route('/search', searchRoute);

app.post('/verify', async (c) => {
  const body = await c.req
    .json<{ content?: string; articleUrl?: string; searchResults?: SearchResponse[] }>()
    .catch(() => ({}));
  if (!body.content?.trim()) {
    return c.json({ error: 'content is required' }, 400);
  }

  const userId = c.get('userId') as string | undefined;
  if (userId) {
    const plan = await getUserPlan(userId);
    const used = await countVerificationsThisMonth(userId);
    const cap = PLAN_LIMITS[plan].verificationsPerMonth;
    if (used >= cap) {
      return c.json(
        {
          success: false,
          error: 'verification_limit',
          data: {
            veracity: 'unverified',
            confidence: 0,
            explanation: `Monthly limit (${cap}) reached. Upgrade at /pricing.`,
            sources: [],
          },
        },
        429,
      );
    }
  }

  let searchResults = body.searchResults ?? [];
  if (searchResults.length === 0) {
    searchResults = await searchForVerify(body.content.trim());
  }

  const out = await verifyContent(body.content.trim(), searchResults, body.articleUrl);
  if (out.success && userId) {
    const hash = createHash('sha256').update(body.content.trim()).digest('hex').slice(0, 32);
    await db.insert(verifications).values({
      id: crypto.randomUUID(),
      userId,
      contentHash: hash,
      veracity: out.data.veracity,
      confidence: Math.round(out.data.confidence),
      resultJson: JSON.stringify(out.data),
    });
  }
  return c.json(out);
});

const port = Number(process.env.PORT ?? 3001);
const workerEnabled = process.env.WORKER_ENABLED === 'true';
const pollMs = Number(process.env.FEED_POLL_INTERVAL_MS ?? 900_000);

let pollTimer: ReturnType<typeof setInterval> | undefined;

if (workerEnabled) {
  const run = async () => {
    try {
      const results = await pollAllEnabledFeeds();
      const inserted = results.reduce((n, r) => n + r.inserted, 0);
      if (inserted > 0) console.log(`[worker] inserted ${inserted} articles`);
    } catch (e) {
      console.error('[worker] poll failed', e);
    }
  };
  void run();
  pollTimer = setInterval(() => void run(), pollMs);
  console.log(`[worker] RSS poll every ${pollMs}ms`);
}

const server = Bun.serve({ port, fetch: app.fetch });
console.log(`API listening on :${server.port}`);

// ponytail: stop listener + worker on --watch reload (avoids EADDRINUSE)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (pollTimer) clearInterval(pollTimer);
    server.stop(true);
  });
}
