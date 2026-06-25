import { eq } from 'drizzle-orm';
import type { ArticleDto, BiasLabel, BlindspotDto, OutletDto, StoryDto } from '@verify-news/shared';
import { db } from '../db/client';
import { articles, outlets, storyArticles, storyClusters, userBiasProfile, userFollows } from '../db/schema';
import { biasSpreadFromLabels } from './bias';
import { blindspotFromSpread } from './blindspot';
import { getEntitlements } from './entitlements';

function mapOutlet(row: typeof outlets.$inferSelect): OutletDto {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    biasLabel: row.biasLabel as BiasLabel,
    factuality: row.factuality as OutletDto['factuality'],
  };
}

export async function buildStoryDto(storyId: string, userId?: string): Promise<StoryDto | null> {
  const [story] = await db
    .select()
    .from(storyClusters)
    .where(eq(storyClusters.id, storyId))
    .limit(1);
  if (!story) return null;

  const links = await db
    .select({ articleId: storyArticles.articleId })
    .from(storyArticles)
    .where(eq(storyArticles.storyId, storyId));

  const articleRows: ArticleDto[] = [];
  const biasLabels: BiasLabel[] = [];

  for (const link of links) {
    const [row] = await db
      .select({ article: articles, outlet: outlets })
      .from(articles)
      .innerJoin(outlets, eq(articles.outletId, outlets.id))
      .where(eq(articles.id, link.articleId))
      .limit(1);
    if (!row) continue;
    const outlet = mapOutlet(row.outlet);
    biasLabels.push(outlet.biasLabel);
    articleRows.push({
      id: row.article.id,
      outletId: row.article.outletId,
      title: row.article.title,
      summary: row.article.summary,
      url: row.article.url,
      publishedAt: row.article.publishedAt?.toISOString() ?? null,
      fetchedAt: row.article.fetchedAt.toISOString(),
      outlet,
    });
  }

  const biasSpread = biasSpreadFromLabels(biasLabels);
  let blindspot: BlindspotDto | null = null;

  if (userId) {
    const { limits } = await getEntitlements(userId);
    if (!limits.blindspot) {
      return {
        id: story.id,
        canonicalTitle: story.canonicalTitle,
        slug: story.slug,
        lastUpdatedAt: story.lastUpdatedAt.toISOString(),
        sourceCount: articleRows.length,
        biasSpread,
        articles: articleRows,
        blindspot: null,
      };
    }
    const follows = await db
      .select({ biasLabel: outlets.biasLabel })
      .from(userFollows)
      .innerJoin(outlets, eq(userFollows.outletId, outlets.id))
      .where(eq(userFollows.userId, userId));
    const [profile] = await db
      .select()
      .from(userBiasProfile)
      .where(eq(userBiasProfile.userId, userId))
      .limit(1);
    const insight = blindspotFromSpread(
      follows.map((f) => f.biasLabel as BiasLabel),
      biasSpread,
      (profile?.selfReportedLean as BiasLabel) ?? null,
    );
    if (insight) {
      blindspot = { message: insight.message, storyHeavySide: insight.storyHeavySide };
    }
  }

  return {
    id: story.id,
    canonicalTitle: story.canonicalTitle,
    slug: story.slug,
    lastUpdatedAt: story.lastUpdatedAt.toISOString(),
    sourceCount: articleRows.length,
    biasSpread,
    articles: articleRows,
    blindspot,
  };
}