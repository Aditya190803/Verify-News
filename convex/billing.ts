import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { entitlementsForPlan, normalizePlan } from './lib/entitlements';
import { planCatalog, PLAN_LIMITS } from './lib/plans';
import { monthStartMs } from './lib/time';
import { upsertSubscriptionForUser } from './lib/subscriptions';
import { normalizePaidPlan, planPricePaise } from './lib/planPricing';

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
    await upsertSubscriptionForUser(ctx, {
      userId: args.userId,
      plan: args.plan,
      status: args.status,
      razorpayCustomerId: args.paymentRef,
      currentPeriodEnd: args.currentPeriodEnd,
    });
  },
});

export const applyWebhookPayment = mutation({
  args: {
    userId: v.string(),
    plan: v.string(),
    paymentId: v.string(),
    amountPaise: v.number(),
    currency: v.string(),
    sharedSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.sharedSecret !== process.env.CONVEX_WEBHOOK_SHARED_SECRET) {
      throw new Error('unauthorized');
    }
    if (args.currency !== 'INR') throw new Error('invalid currency');

    const paidPlan = normalizePaidPlan(args.plan);
    const expectedPaise = planPricePaise(paidPlan);
    if (expectedPaise === null || args.amountPaise !== expectedPaise) {
      throw new Error('amount mismatch');
    }

    const dup = await ctx.db
      .query('paymentEvents')
      .withIndex('by_paymentId', (q) => q.eq('paymentId', args.paymentId))
      .first();
    if (dup) return { ok: true as const, duplicate: true };

    const periodEnd = Date.now() + 30 * 86_400_000;
    await upsertSubscriptionForUser(ctx, {
      userId: args.userId,
      plan: paidPlan,
      status: 'active',
      razorpayCustomerId: args.paymentId,
      currentPeriodEnd: periodEnd,
    });
    await ctx.db.insert('paymentEvents', {
      paymentId: args.paymentId,
      userId: args.userId,
      plan: paidPlan,
      amountPaise: args.amountPaise,
      processedAt: Date.now(),
    });
    return { ok: true as const, duplicate: false };
  },
});