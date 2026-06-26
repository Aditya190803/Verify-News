import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { topics: [] };
    const rows = await ctx.db
      .query('userTopicFollows')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    return { topics: rows.map((r) => r.topic) };
  },
});

export const follow = mutation({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const topic = args.topic.trim().toLowerCase().slice(0, 80);
    if (!topic) throw new Error('topic required');
    const existing = await ctx.db
      .query('userTopicFollows')
      .withIndex('by_user_topic', (q) => q.eq('userId', identity.subject).eq('topic', topic))
      .first();
    if (existing) return { ok: true };
    await ctx.db.insert('userTopicFollows', { userId: identity.subject, topic, createdAt: Date.now() });
    return { ok: true };
  },
});

export const unfollow = mutation({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const topic = args.topic.trim().toLowerCase();
    const row = await ctx.db
      .query('userTopicFollows')
      .withIndex('by_user_topic', (q) => q.eq('userId', identity.subject).eq('topic', topic))
      .first();
    if (row) await ctx.db.delete(row._id);
    return { ok: true };
  },
});