import { v } from 'convex/values';
import { internalQuery } from './_generated/server';

export const outletAndFeed = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const outlet = await ctx.db
      .query('outlets')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .first();
    if (!outlet) return null;
    const feed = await ctx.db
      .query('feeds')
      .withIndex('by_externalId', (q) => q.eq('externalId', `feed-${args.externalId}`))
      .first();
    if (!feed) return null;
    return { outletId: outlet._id, feedId: feed._id };
  },
});