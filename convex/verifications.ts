import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { entitlementsForPlan, normalizePlan } from './lib/entitlements';
import { monthStartMs } from './lib/time';

type StoredResult = {
  success?: boolean;
  data?: {
    veracity?: string;
    confidence?: number;
    explanation?: string;
    sources?: { name: string; url: string }[];
  };
  contentPreview?: string;
  slug?: string;
};

function parseStored(json: string): StoredResult {
  try {
    return JSON.parse(json) as StoredResult;
  } catch {
    return {};
  }
}

export const save = internalMutation({
  args: {
    userId: v.optional(v.string()),
    storyId: v.optional(v.id('storyClusters')),
    slug: v.optional(v.string()),
    contentHash: v.string(),
    veracity: v.string(),
    confidence: v.number(),
    resultJson: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('verifications', {
      userId: args.userId,
      storyId: args.storyId,
      slug: args.slug ?? args.contentHash,
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
      verifications: rows.map((r) => {
        const stored = parseStored(r.resultJson);
        const slug = r.slug ?? stored.slug ?? r.contentHash;
        const preview = stored.contentPreview ?? stored.data?.explanation?.slice(0, 80) ?? 'Verification';
        return {
          id: r._id,
          slug,
          query: preview,
          title: preview,
          timestamp: new Date(r.createdAt).toISOString(),
          resultType: 'verification' as const,
          veracity: r.veracity,
          confidence: r.confidence,
          result: stored.data,
        };
      }),
    };
  },
});

export const getBySlugOrHash = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const slug = args.slug.trim();
    if (!slug) return null;

    let row = await ctx.db
      .query('verifications')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .order('desc')
      .first();

    if (!row) {
      row = await ctx.db
        .query('verifications')
        .withIndex('by_contentHash', (q) => q.eq('contentHash', slug))
        .order('desc')
        .first();
    }

    if (!row) return null;
    if (row.userId && identity?.subject !== row.userId) return null;

    const stored = parseStored(row.resultJson);
    return {
      id: row._id,
      slug: row.slug ?? stored.slug ?? row.contentHash,
      contentHash: row.contentHash,
      veracity: row.veracity,
      confidence: row.confidence,
      createdAt: row.createdAt,
      result: stored,
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