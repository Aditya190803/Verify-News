import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { entitlementsForPlan, normalizePlan } from './lib/entitlements';
import { planCatalog, PLAN_LIMITS } from './lib/plans';

function monthStartMs() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export const plans = query({
  args: {},
  handler: async () => ({
    provider: 'razorpay' as const,
    currency: 'INR' as const,
    plans: PLAN_LIMITS,
    catalog: planCatalog(),
    billingEnabled: Boolean(process.env.RAZORPAY_KEY_ID),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? null,
  }),
});

export const entitlements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const userId = identity.subject;
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    const plan = normalizePlan(sub?.status === 'active' ? sub.plan : 'free');
    const ent = entitlementsForPlan(plan);
    const since = monthStartMs();
    const verifications = await ctx.db
      .query('verifications')
      .withIndex('by_user_created', (q) => q.eq('userId', userId).gte('createdAt', since))
      .collect();
    return { ...ent, verificationsUsedThisMonth: verifications.length };
  },
});

export const upsertSubscription = internalMutation({
  args: {
    userId: v.string(),
    plan: v.string(),
    status: v.string(),
    paymentRef: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    const row = {
      userId: args.userId,
      plan: args.plan,
      status: args.status,
      razorpayCustomerId: args.paymentRef,
      currentPeriodEnd: args.currentPeriodEnd,
    };
    if (existing) await ctx.db.patch(existing._id, row);
    else await ctx.db.insert('subscriptions', row);
  },
});

export const applyWebhookPayment = mutation({
  args: {
    userId: v.string(),
    plan: v.string(),
    paymentId: v.string(),
    sharedSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.sharedSecret !== process.env.CONVEX_WEBHOOK_SHARED_SECRET) {
      throw new Error('unauthorized');
    }
    const periodEnd = Date.now() + 30 * 86_400_000;
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    const row = {
      userId: args.userId,
      plan: args.plan,
      status: 'active',
      razorpayCustomerId: args.paymentId,
      currentPeriodEnd: periodEnd,
    };
    if (existing) await ctx.db.patch(existing._id, row);
    else await ctx.db.insert('subscriptions', row);
  },
});

