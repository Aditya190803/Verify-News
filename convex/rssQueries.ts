import { internalQuery } from './_generated/server';

export const listEnabledFeeds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('feeds').collect();
    return all.filter((f) => f.enabled);
  },
});