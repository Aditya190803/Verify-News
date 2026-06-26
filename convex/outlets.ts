import { query } from './_generated/server';
import type { BiasLabel } from './lib/aggregationTypes';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('outlets').collect();
    return {
      outlets: rows.map((row) => ({
        id: row.externalId,
        name: row.name,
        domain: row.domain,
        biasLabel: row.biasLabel as BiasLabel,
        factuality: row.factuality,
        ownershipCategory: row.ownershipCategory ?? null,
      })),
    };
  },
});