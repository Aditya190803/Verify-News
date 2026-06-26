import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';
import type { ArticleDto, BiasLabel, OutletDto, StoryDto } from './aggregationTypes';
import { biasSpreadFromLabels } from './bias';
import { blindspotFromSpread } from './blindspot';
import { entitlementsForPlan, normalizePlan } from './entitlements';

function mapOutlet(row: Doc<'outlets'>): OutletDto {
  return {
    id: row.externalId,
    name: row.name,
    domain: row.domain,
    biasLabel: row.biasLabel as BiasLabel,
    factuality: row.factuality as OutletDto['factuality'],
    ownershipCategory: row.ownershipCategory ?? null,
  };
}

export async function buildStoryDto(
  ctx: QueryCtx,
  story: Doc<'storyClusters'>,
  userId?: string,
): Promise<StoryDto | null> {
  const links = await ctx.db
    .query('storyArticles')
    .withIndex('by_story', (q) => q.eq('storyId', story._id))
    .collect();

  const articleRows: ArticleDto[] = [];
  const biasLabels: BiasLabel[] = [];

  for (const link of links) {
    const article = await ctx.db.get(link.articleId);
    if (!article) continue;
    const outlet = await ctx.db.get(article.outletId);
    if (!outlet) continue;
    const o = mapOutlet(outlet);
    biasLabels.push(o.biasLabel);
    articleRows.push({
      id: article._id,
      outletId: outlet.externalId,
      title: article.title,
      summary: article.summary ?? null,
      url: article.url,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
      fetchedAt: new Date(article.fetchedAt).toISOString(),
      outlet: o,
    });
  }

  const biasSpread = biasSpreadFromLabels(biasLabels);
  let blindspot: StoryDto['blindspot'] = null;

  if (userId) {
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    const plan = normalizePlan(sub?.status === 'active' ? sub.plan : 'free');
    const { limits } = entitlementsForPlan(plan);
    if (limits.blindspot) {
      const follows = await ctx.db
        .query('userFollows')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();
      const followLabels: BiasLabel[] = [];
      for (const f of follows) {
        const out = await ctx.db.get(f.outletId);
        if (out) followLabels.push(out.biasLabel as BiasLabel);
      }
      const profile = await ctx.db
        .query('userBiasProfile')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first();
      const insight = blindspotFromSpread(
        followLabels,
        biasSpread,
        (profile?.selfReportedLean as BiasLabel) ?? null,
      );
      if (insight) blindspot = insight;
    }
  }

  return {
    id: story._id,
    canonicalTitle: story.canonicalTitle,
    slug: story.slug,
    lastUpdatedAt: new Date(story.lastUpdatedAt).toISOString(),
    sourceCount: articleRows.length,
    biasSpread,
    articles: articleRows,
    blindspot,
    blindspotSide: (story.blindspotSide as 'left' | 'right' | undefined) ?? null,
    blindspotReason: story.blindspotReason ?? null,
    biasCompareSummary: story.biasCompareSummary ?? null,
  };
}

export async function rankStories(stories: StoryDto[], ctx: QueryCtx, userId?: string) {
  if (!userId) return stories;
  const follows = await ctx.db
    .query('userFollows')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const outletIds = new Set<Id<'outlets'>>();
  for (const f of follows) outletIds.add(f.outletId);
  const externalByInternal = new Map<string, string>();
  for (const oid of outletIds) {
    const o = await ctx.db.get(oid);
    if (o) externalByInternal.set(o._id, o.externalId);
  }
  const followExt = new Set(follows.map((f) => externalByInternal.get(f.outletId)).filter(Boolean));

  return [...stories].sort((a, b) => {
    const score = (s: StoryDto) => (s.articles.some((art) => followExt.has(art.outletId)) ? 1 : 0);
    return score(b) - score(a) || b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
  });
}