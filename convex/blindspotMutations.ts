import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { buildStoryDto } from './lib/storyBuild';
import { computeStoryBlindspot, lowFactualityShare } from './lib/blindspotFormula';

export const recomputeBlindspots = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('storyClusters').withIndex('by_lastUpdated').order('desc').take(args.limit ?? 200);
    let updated = 0;
    for (const story of rows) {
      const dto = await buildStoryDto(ctx, story, undefined);
      if (!dto) continue;
      const lf = lowFactualityShare(dto.articles);
      const { side, reason } = computeStoryBlindspot(dto.biasSpread, lf);
      const blindspotSide = side === 'none' ? undefined : side;
      const searchText = `${story.canonicalTitle} ${dto.articles.map((a) => a.outlet?.name ?? '').join(' ')}`.toLowerCase();
      await ctx.db.patch(story._id, {
        blindspotSide,
        blindspotReason: side === 'none' ? undefined : reason,
        searchText,
        lastUpdatedAt: story.lastUpdatedAt,
      });
      updated++;
    }
    return { updated };
  },
});