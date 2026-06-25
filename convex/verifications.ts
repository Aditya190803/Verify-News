import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { entitlementsForPlan, normalizePlan } from './lib/entitlements';

function monthStartMs() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export const save = internalMutation({
  args: {
    userId: v.optional(v.string()),
    storyId: v.optional(v.id('storyClusters')),
    contentHash: v.string(),
    veracity: v.string(),
    confidence: v.number(),
    resultJson: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('verifications', {
      userId: args.userId,
      storyId: args.storyId,
      contentHash: args.contentHash,
      veracity: args.veracity,
      confidence: args.confidence,
      resultJson: args.resultJson,
      createdAt: Date.now(),
    });
  },
});

export const listForUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const rows = await ctx.db
      .query('verifications')
      .withIndex('by_user_created', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(args.limit ?? 50);
    return {
      verifications: rows.map((r) => ({
        id: r._id,
        veracity: r.veracity,
        confidence: r.confidence,
        createdAt: new Date(r.createdAt).toISOString(),
        result: JSON.parse(r.resultJson) as unknown,
      })),
    };
  },
});

export const assertCanVerifyInternal = internalMutation({
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
    const { limits } = entitlementsForPlan(plan);
    const since = monthStartMs();
    const used = await ctx.db
      .query('verifications')
      .withIndex('by_user_created', (q) => q.eq('userId', userId).gte('createdAt', since))
      .collect();
    if (used.length >= limits.verificationsPerMonth) {
      throw new Error('Monthly verification limit reached');
    }
  },
});