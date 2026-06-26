import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query('userFollows')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const follows = [];
    for (const row of rows) {
      const outlet = await ctx.db.get(row.outletId);
      if (outlet) {
        follows.push({
          outletId: outlet.externalId,
          name: outlet.name,
          biasLabel: outlet.biasLabel,
        });
      }
    }
    return { follows };
  },
});

export const follow = mutation({
  args: { outletExternalId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const outlet = await ctx.db
      .query('outlets')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.outletExternalId))
      .first();
    if (!outlet) throw new Error('outlet not found');
    const existing = await ctx.db
      .query('userFollows')
      .withIndex('by_user_outlet', (q) => q.eq('userId', userId).eq('outletId', outlet._id))
      .first();
    if (!existing) {
      await ctx.db.insert('userFollows', { userId, outletId: outlet._id });
    }
    return { ok: true as const };
  },
});

export const unfollow = mutation({
  args: { outletExternalId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const outlet = await ctx.db
      .query('outlets')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.outletExternalId))
      .first();
    if (!outlet) return { ok: true as const };
    const existing = await ctx.db
      .query('userFollows')
      .withIndex('by_user_outlet', (q) => q.eq('userId', userId).eq('outletId', outlet._id))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return { ok: true as const };
  },
});

export const setBiasProfile = mutation({
  args: { selfReportedLean: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const lean = args.selfReportedLean?.trim() || undefined;
    const existing = await ctx.db
      .query('userBiasProfile')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { selfReportedLean: lean, updatedAt });
    } else {
      await ctx.db.insert('userBiasProfile', { userId, selfReportedLean: lean, updatedAt });
    }
    return { ok: true as const, selfReportedLean: lean ?? null };
  },
});

export const getBiasProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db
      .query('userBiasProfile')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    return { selfReportedLean: row?.selfReportedLean ?? null };
  },
});