import { v } from 'convex/values';
import { query } from './_generated/server';
import { buildStoryDto, rankStories } from './lib/storyBuild';

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 30, 100);
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const rows = await ctx.db
      .query('storyClusters')
      .withIndex('by_lastUpdated')
      .order('desc')
      .take(limit);

    const dtos = [];
    for (const s of rows) {
      const dto = await buildStoryDto(ctx, s, userId);
      if (dto) dtos.push(dto);
    }
    const ranked = await rankStories(dtos, ctx, userId);
    return { stories: ranked, personalized: Boolean(userId) };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const story = await ctx.db
      .query('storyClusters')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (!story) return { story: null };
    const dto = await buildStoryDto(ctx, story, userId);
    return { story: dto };
  },
});