import { v } from 'convex/values';
import { internalQuery } from './_generated/server';

/** Stories that could use more outlet coverage (RSS seed + room for Exa). */
export const storiesForEnrich = internalQuery({
  args: {
    limit: v.optional(v.number()),
    maxSources: v.optional(v.number()),
    lookback: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 80;
    const maxSources = args.maxSources ?? 8;
    const lookbackMs = (args.lookback ?? 96) * 3_600_000;
    const since = Date.now() - lookbackMs;

    const rows = await ctx.db.query('storyClusters').withIndex('by_lastUpdated').order('desc').take(limit);
    const out: {
      storyId: (typeof rows)[0]['_id'];
      canonicalTitle: string;
      sourceCount: number;
      outletIds: string[];
      articleUrls: string[];
    }[] = [];

    for (const story of rows) {
      if (story.lastUpdatedAt < since) continue;
      const links = await ctx.db
        .query('storyArticles')
        .withIndex('by_story', (q) => q.eq('storyId', story._id))
        .collect();
      const articleUrls: string[] = [];
      const outletExt = new Set<string>();
      for (const link of links) {
        const art = await ctx.db.get(link.articleId);
        if (!art) continue;
        articleUrls.push(art.url);
        const outlet = await ctx.db.get(art.outletId);
        if (outlet) outletExt.add(outlet.externalId);
      }
      if (outletExt.size >= maxSources) continue;
      out.push({
        storyId: story._id,
        canonicalTitle: story.canonicalTitle,
        sourceCount: outletExt.size,
        outletIds: [...outletExt],
        articleUrls,
      });
    }

    // Prioritize thin clusters (few outlets) so Exa fills gaps first
    out.sort((a, b) => a.sourceCount - b.sourceCount || b.canonicalTitle.localeCompare(a.canonicalTitle));
    return out;
  },
});