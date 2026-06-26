import type { MutationCtx } from '../_generated/server';

export type SubscriptionRow = {
  userId: string;
  plan: string;
  status: string;
  razorpayCustomerId?: string;
  currentPeriodEnd?: number;
};

export async function upsertSubscriptionForUser(ctx: MutationCtx, row: SubscriptionRow) {
  const existing = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', row.userId))
    .first();
  if (existing) await ctx.db.patch(existing._id, row);
  else await ctx.db.insert('subscriptions', row);
}