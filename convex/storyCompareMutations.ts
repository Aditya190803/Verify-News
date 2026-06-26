import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

export const saveSummary = internalMutation({
  args: { slug: v.string(), summary: v.string() },
  handler: async (ctx, args) => {
    const story = await ctx.db.query('storyClusters').withIndex('by_slug', (q) => q.eq('slug', args.slug)).first();
    if (!story) return { ok: false };
    await ctx.db.patch(story._id, { biasCompareSummary: args.summary, biasCompareAt: Date.now() });
    return { ok: true };
  },
});