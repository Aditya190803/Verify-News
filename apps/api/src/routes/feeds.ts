import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { feeds, outlets } from '../db/schema';
import { pollAllEnabledFeeds, pollFeed } from '../worker/rss';
import { reclusterRecentStories } from '../worker/recluster';

const app = new Hono();

app.get('/health', async (c) => {
  const rows = await db
    .select({
      feedId: feeds.id,
      url: feeds.url,
      enabled: feeds.enabled,
      lastFetchedAt: feeds.lastFetchedAt,
      lastError: feeds.lastError,
      outletName: outlets.name,
    })
    .from(feeds)
    .innerJoin(outlets, eq(feeds.outletId, outlets.id));

  return c.json({
    feeds: rows.map((r) => ({
      feedId: r.feedId,
      outletName: r.outletName,
      url: r.url,
      enabled: r.enabled,
      lastFetchedAt: r.lastFetchedAt?.toISOString() ?? null,
      lastError: r.lastError,
    })),
  });
});

/** Trigger RSS poll (protect in production with WORKER_SECRET). */
app.post('/poll', async (c) => {
  const secret = process.env.WORKER_SECRET;
  if (secret) {
    const header = c.req.header('x-worker-secret');
    if (header !== secret) return c.json({ error: 'unauthorized' }, 401);
  }

  const feedId = c.req.query('feedId');
  const results = feedId ? [await pollFeed(feedId)] : await pollAllEnabledFeeds();
  const recluster = await reclusterRecentStories();
  return c.json({ results, recluster });
});

export default app;