import { v } from 'convex/values';
import { query } from './_generated/server';
import { buildStoryDto, rankStories } from './lib/storyBuild';
import type { StoryDto } from './lib/aggregationTypes';
import { OUTLET_IDS } from './seedData';

function coverageScore(s: StoryDto) {
  const outlets = new Set(s.articles.map((x) => x.outletId)).size;
  const biasKinds = Object.values(s.biasSpread).filter((n) => n > 0).length;
  return outlets * 100 + biasKinds * 40 + s.sourceCount * 10;
}

const LEFT_LABELS = new Set(['left', 'center-left']);
const RIGHT_LABELS = new Set(['right', 'center-right']);

function storyMatchesFilters(
  dto: StoryDto,
  args: {
    minOutlets?: number;
    minLeft?: number;
    minRight?: number;
    factualityMin?: string;
    ownership?: string;
  },
) {
  const outlets = new Set(dto.articles.map((a) => a.outletId)).size;
  if (args.minOutlets && outlets < args.minOutlets) return false;
  let left = 0;
  let right = 0;
  let hasOwnership = !args.ownership;
  for (const a of dto.articles) {
    const b = a.outlet?.biasLabel;
    if (b && LEFT_LABELS.has(b)) left++;
    if (b && RIGHT_LABELS.has(b)) right++;
    if (args.factualityMin === 'high' && a.outlet?.factuality === 'low') return false;
    if (args.ownership && a.outlet?.ownershipCategory === args.ownership) hasOwnership = true;
  }
  if (!hasOwnership) return false;
  if (args.minLeft && left < args.minLeft) return false;
  if (args.minRight && right < args.minRight) return false;
  return true;
}

async function collectStories(
  ctx: Parameters<typeof buildStoryDto>[0],
  opts: {
    limit: number;
    userId?: string;
    blindspotSide?: string;
    searchQ?: string;
    filters?: Parameters<typeof storyMatchesFilters>[1];
  },
) {
  let rows;
  if (opts.blindspotSide && opts.blindspotSide !== 'all') {
    rows = await ctx.db
      .query('storyClusters')
      .withIndex('by_blindspot', (q) => q.eq('blindspotSide', opts.blindspotSide!))
      .order('desc')
      .take(opts.limit * 4);
  } else {
    rows = await ctx.db.query('storyClusters').withIndex('by_lastUpdated').order('desc').take(opts.limit * 4);
  }

  const dtos: StoryDto[] = [];
  const q = opts.searchQ?.trim().toLowerCase();
  for (const s of rows) {
    if (q && s.searchText && !s.searchText.includes(q) && !s.canonicalTitle.toLowerCase().includes(q)) continue;
    const dto = await buildStoryDto(ctx, s, opts.userId);
    if (!dto) continue;
    if (!dto.articles.some((a) => OUTLET_IDS.has(a.outletId))) continue;
    if (opts.filters && !storyMatchesFilters(dto, opts.filters)) continue;
    if (opts.blindspotSide === 'all' && !dto.blindspotSide) continue;
    dtos.push(dto);
    if (dtos.length >= opts.limit) break;
  }
  return dtos;
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
    minOutlets: v.optional(v.number()),
    minLeft: v.optional(v.number()),
    minRight: v.optional(v.number()),
    factualityMin: v.optional(v.string()),
    ownership: v.optional(v.string()),
    searchQ: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 40, 100);
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const dtos = await collectStories(ctx, {
      limit,
      userId,
      searchQ: args.searchQ,
      filters: {
        minOutlets: args.minOutlets,
        minLeft: args.minLeft,
        minRight: args.minRight,
        factualityMin: args.factualityMin,
        ownership: args.ownership,
      },
    });
    const byCoverage = [...dtos].sort(
      (a, b) => coverageScore(b) - coverageScore(a) || b.lastUpdatedAt.localeCompare(a.lastUpdatedAt),
    );
    const ranked = await rankStories(byCoverage, ctx, userId);
    return { stories: ranked, personalized: Boolean(userId) };
  },
});

export const blindspotList = query({
  args: {
    side: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 30, 80);
    const side = args.side ?? 'all';
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const dtos = await collectStories(ctx, {
      limit,
      userId,
      blindspotSide: side === 'all' ? 'all' : side,
    });
    return { stories: dtos };
  },
});

export const search = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 25, 50);
    const dtos = await collectStories(ctx, { limit, searchQ: args.q });
    return { stories: dtos };
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

export const coverageDiet = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { follows: [], diet: null };
    const userId = identity.subject;
    const follows = await ctx.db.query('userFollows').withIndex('by_user', (q) => q.eq('userId', userId)).collect();
    const spread: Record<string, number> = {};
    let n = 0;
    for (const f of follows) {
      const o = await ctx.db.get(f.outletId);
      if (!o) continue;
      spread[o.biasLabel] = (spread[o.biasLabel] ?? 0) + 1;
      n++;
    }
    return {
      follows: n,
      diet: n ? { spread, total: n } : null,
    };
  },
});