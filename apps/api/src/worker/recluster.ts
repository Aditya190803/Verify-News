import { eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { articles, storyArticles, storyClusters } from '../db/schema';
import { titlesMatch } from '../lib/cluster';

type StoryRow = { storyId: string; title: string; publishedAt: Date | null };

async function singleArticleStories(since: Date): Promise<StoryRow[]> {
  const stories = await db
    .select({
      storyId: storyClusters.id,
      count: sql<number>`count(${storyArticles.articleId})::int`,
    })
    .from(storyClusters)
    .leftJoin(storyArticles, eq(storyArticles.storyId, storyClusters.id))
    .where(gte(storyClusters.lastUpdatedAt, since))
    .groupBy(storyClusters.id)
    .having(sql`count(${storyArticles.articleId}) = 1`);

  const rows: StoryRow[] = [];
  for (const s of stories) {
    const [joined] = await db
      .select({ title: articles.title, publishedAt: articles.publishedAt })
      .from(storyArticles)
      .innerJoin(articles, eq(storyArticles.articleId, articles.id))
      .where(eq(storyArticles.storyId, s.storyId))
      .limit(1);
    if (joined) rows.push({ storyId: s.storyId, title: joined.title, publishedAt: joined.publishedAt });
  }
  return rows;
}

export async function reclusterRecentStories(hours = 72): Promise<{ merged: number }> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const singles = await singleArticleStories(since);
  let merged = 0;
  const removed = new Set<string>();

  for (let i = 0; i < singles.length; i++) {
    const a = singles[i];
    if (removed.has(a.storyId)) continue;

    for (let j = i + 1; j < singles.length; j++) {
      const b = singles[j];
      if (removed.has(b.storyId)) continue;
      if (!titlesMatch(a.title, b.title, a.publishedAt, b.publishedAt)) continue;

      const [aCount] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(storyArticles)
        .where(eq(storyArticles.storyId, a.storyId));
      const [bCount] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(storyArticles)
        .where(eq(storyArticles.storyId, b.storyId));
      if ((aCount?.c ?? 0) !== 1 || (bCount?.c ?? 0) !== 1) continue;

      const [linkA] = await db
        .select({ articleId: storyArticles.articleId })
        .from(storyArticles)
        .where(eq(storyArticles.storyId, a.storyId))
        .limit(1);
      const [linkB] = await db
        .select({ articleId: storyArticles.articleId })
        .from(storyArticles)
        .where(eq(storyArticles.storyId, b.storyId))
        .limit(1);
      if (!linkA || !linkB) continue;

      const keep = a.storyId;
      const drop = b.storyId;
      const moveId = linkB.articleId;

      await db
        .insert(storyArticles)
        .values({ storyId: keep, articleId: moveId, relevanceScore: 90 })
        .onConflictDoNothing();
      await db.delete(storyArticles).where(eq(storyArticles.storyId, drop));
      await db.delete(storyClusters).where(eq(storyClusters.id, drop));
      await db
        .update(storyClusters)
        .set({ lastUpdatedAt: new Date(), canonicalTitle: a.title.length >= b.title.length ? a.title : b.title })
        .where(eq(storyClusters.id, keep));

      removed.add(drop);
      merged++;
      break;
    }
  }

  return { merged };
}