import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { titlesMatch } from './lib/cluster';
import { cleanHeadline, pickCanonicalTitle } from './lib/headline';
import { slugify } from './lib/slug';

async function refreshCanonicalTitle(ctx: MutationCtx, storyId: Id<'storyClusters'>) {
  const links = await ctx.db
    .query('storyArticles')
    .withIndex('by_story', (q) => q.eq('storyId', storyId))
    .collect();
  const titles: string[] = [];
  for (const link of links) {
    const art = await ctx.db.get(link.articleId);
    if (art?.title) titles.push(art.title);
  }
  if (titles.length === 0) return;
  const canonicalTitle = pickCanonicalTitle(titles);
  await ctx.db.patch(storyId, { canonicalTitle, lastUpdatedAt: Date.now() });
}

async function attachArticleToStory(
  ctx: MutationCtx,
  articleId: Id<'articles'>,
  title: string,
  publishedAt: number | null,
) {
  title = cleanHeadline(title);
  const since = Date.now() - 72 * 3_600_000;
  const stories = await ctx.db
    .query('storyClusters')
    .withIndex('by_lastUpdated')
    .order('desc')
    .take(200);

  for (const story of stories) {
    if (story.lastUpdatedAt < since) continue;
    const links = await ctx.db
      .query('storyArticles')
      .withIndex('by_story', (q) => q.eq('storyId', story._id))
      .collect();
    for (const link of links) {
      const art = await ctx.db.get(link.articleId);
      if (!art) continue;
      if (titlesMatch(title, art.title, publishedAt, art.publishedAt ?? null)) {
        if (!links.some((l) => l.articleId === articleId)) {
          await ctx.db.insert('storyArticles', {
            storyId: story._id,
            articleId,
            relevanceScore: 95,
          });
        }
        await refreshCanonicalTitle(ctx, story._id);
        return story._id;
      }
    }
  }

  const now = Date.now();
  let slug = slugify(title);
  const clash = await ctx.db
    .query('storyClusters')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .first();
  if (clash) slug = `${slug}-${now.toString(36)}`;

  const storyId = await ctx.db.insert('storyClusters', {
    canonicalTitle: pickCanonicalTitle([title]),
    slug,
    firstSeenAt: now,
    lastUpdatedAt: now,
  });
  await ctx.db.insert('storyArticles', { storyId, articleId, relevanceScore: 100 });
  return storyId;
}

export const insertArticle = internalMutation({
  args: {
    feedId: v.id('feeds'),
    outletId: v.id('outlets'),
    guid: v.string(),
    url: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('articles')
      .withIndex('by_feed_guid', (q) => q.eq('feedId', args.feedId).eq('guid', args.guid))
      .first();
    if (existing) return { articleId: existing._id, inserted: false };

    const now = Date.now();
    const articleId = await ctx.db.insert('articles', {
      feedId: args.feedId,
      outletId: args.outletId,
      guid: args.guid,
      url: args.url,
      title: args.title,
      summary: args.summary,
      publishedAt: args.publishedAt,
      fetchedAt: now,
      contentHash: args.contentHash,
    });

    await attachArticleToStory(ctx, articleId, args.title, args.publishedAt ?? null);
    return { articleId, inserted: true };
  },
});

export const patchFeedOk = internalMutation({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedId, { lastFetchedAt: Date.now(), lastError: undefined });
  },
});

export const patchFeedError = internalMutation({
  args: { feedId: v.id('feeds'), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedId, { lastFetchedAt: Date.now(), lastError: args.error });
  },
});

/** Re-run canonical title pick after clustering rule changes. */
export const recomputeCanonicalTitles = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('storyClusters').order('desc').take(args.limit ?? 300);
    for (const s of rows) {
      await refreshCanonicalTitle(ctx, s._id);
    }
    return { stories: rows.length };
  },
});