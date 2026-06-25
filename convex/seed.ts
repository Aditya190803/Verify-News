import { internalMutation } from './_generated/server';
import { OUTLET_SEED } from './seedData';

export const seedOutlets = internalMutation({
  args: {},
  handler: async (ctx) => {
    let n = 0;
    for (const row of OUTLET_SEED) {
      const existing = await ctx.db
        .query('outlets')
        .withIndex('by_externalId', (q) => q.eq('externalId', row.id))
        .first();
      let outletId = existing?._id;
      if (!outletId) {
        outletId = await ctx.db.insert('outlets', {
          externalId: row.id,
          name: row.name,
          domain: row.domain,
          biasLabel: row.biasLabel,
          factuality: row.factuality,
          ratingSource: row.ratingSource,
        });
        n++;
      } else {
        await ctx.db.patch(outletId, {
          name: row.name,
          domain: row.domain,
          biasLabel: row.biasLabel,
          factuality: row.factuality,
          ratingSource: row.ratingSource,
        });
      }
      const feedExt = `feed-${row.id}`;
      const feedExisting = await ctx.db
        .query('feeds')
        .withIndex('by_externalId', (q) => q.eq('externalId', feedExt))
        .first();
      if (!feedExisting) {
        await ctx.db.insert('feeds', {
          externalId: feedExt,
          outletId,
          url: row.feedUrl,
          pollIntervalSec: 900,
          enabled: true,
        });
      } else {
        await ctx.db.patch(feedExisting._id, { url: row.feedUrl, enabled: true });
      }
    }
    return { outletsUpserted: n, total: OUTLET_SEED.length };
  },
});