import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '../db/client';
import { articles, storyArticles, storyClusters } from '../db/schema';
import { titlesMatch } from '../lib/cluster';
import { slugify } from '../lib/slug';

function newId(): string {
  return crypto.randomUUID();
}

/** Find existing story cluster for a new article, or create one. */
export async function attachArticleToStory(
  articleId: string,
  title: string,
  publishedAt: Date | null,
): Promise<string> {
  const since = new Date(Date.now() - 72 * 3_600_000);
  const recent = await db
    .select({
      storyId: storyArticles.storyId,
      title: articles.title,
      publishedAt: articles.publishedAt,
    })
    .from(storyArticles)
    .innerJoin(articles, eq(storyArticles.articleId, articles.id))
    .innerJoin(storyClusters, eq(storyArticles.storyId, storyClusters.id))
    .where(gte(storyClusters.lastUpdatedAt, since))
    .orderBy(desc(storyClusters.lastUpdatedAt))
    .limit(500);

  for (const row of recent) {
    if (titlesMatch(title, row.title, publishedAt, row.publishedAt)) {
      const dup = await db
        .select()
        .from(storyArticles)
        .where(and(eq(storyArticles.storyId, row.storyId), eq(storyArticles.articleId, articleId)))
        .limit(1);
      if (dup.length === 0) {
        await db.insert(storyArticles).values({
          storyId: row.storyId,
          articleId,
          relevanceScore: 95,
        });
      }
      await db
        .update(storyClusters)
        .set({ lastUpdatedAt: new Date() })
        .where(eq(storyClusters.id, row.storyId));
      return row.storyId;
    }
  }

  const now = new Date();
  const storyId = newId();
  const slug = `${slugify(title)}-${storyId.slice(0, 8)}`;
  await db.insert(storyClusters).values({
    id: storyId,
    canonicalTitle: title,
    slug,
    firstSeenAt: now,
    lastUpdatedAt: now,
  });
  await db.insert(storyArticles).values({ storyId, articleId, relevanceScore: 100 });
  return storyId;
}