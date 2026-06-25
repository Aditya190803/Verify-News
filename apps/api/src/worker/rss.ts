import { createHash } from 'crypto';
import Parser from 'rss-parser';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { articles, feeds, outlets, storyArticles, storyClusters } from '../db/schema';
import { attachArticleToStory } from './storyMatch';

const parser = new Parser({
  timeout: 20_000,
  headers: { 'User-Agent': 'Facets/0.1 (+https://github.com/Aditya190803/Verify-News)' },
});

function hashContent(title: string, url: string): string {
  return createHash('sha256').update(`${title}|${url}`).digest('hex').slice(0, 32);
}

function newId(): string {
  return crypto.randomUUID();
}

export type PollResult = { feedId: string; inserted: number; error?: string };

export async function pollFeed(feedId: string): Promise<PollResult> {
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId)).limit(1);
  if (!feed || !feed.enabled) {
    return { feedId, inserted: 0, error: 'feed missing or disabled' };
  }

  try {
    const parsed = await parser.parseURL(feed.url);
    let inserted = 0;

    for (const item of parsed.items ?? []) {
      const title = item.title?.trim();
      const link = item.link?.trim();
      if (!title || !link) continue;

      const guid = item.guid || item.id || link;
      const contentHash = hashContent(title, link);

      const existing = await db
        .select({ id: articles.id })
        .from(articles)
        .where(and(eq(articles.feedId, feedId), eq(articles.guid, guid)))
        .limit(1);

      if (existing.length > 0) continue;

      const articleId = newId();
      const publishedAt = item.pubDate ? new Date(item.pubDate) : null;
      const now = new Date();

      await db.insert(articles).values({
        id: articleId,
        feedId: feed.id,
        outletId: feed.outletId,
        guid,
        url: link,
        title,
        summary: item.contentSnippet?.slice(0, 2000) ?? item.summary ?? null,
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        fetchedAt: now,
        contentHash,
      });

      await attachArticleToStory(articleId, title, publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null);

      inserted++;
    }

    await db
      .update(feeds)
      .set({ lastFetchedAt: new Date(), lastError: null })
      .where(eq(feeds.id, feedId));

    return { feedId, inserted };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.update(feeds).set({ lastError: message }).where(eq(feeds.id, feedId));
    return { feedId, inserted: 0, error: message };
  }
}

export async function pollAllEnabledFeeds(): Promise<PollResult[]> {
  const enabled = await db.select({ id: feeds.id }).from(feeds).where(eq(feeds.enabled, true));
  const results: PollResult[] = [];
  for (const f of enabled) {
    results.push(await pollFeed(f.id));
  }
  return results;
}

/** Smoke test: outlet row exists after seed */
export async function countOutlets(): Promise<number> {
  const rows = await db.select({ id: outlets.id }).from(outlets);
  return rows.length;
}