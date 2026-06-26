'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import { chatJson } from './lib/bigPickle';
import { entitlementsForPlan, normalizePlan } from './lib/entitlements';
import type { StoryDto } from './lib/aggregationTypes';

const LEFT = new Set(['left', 'center-left']);
const RIGHT = new Set(['right', 'center-right']);

type CompareResult = { summary: string | null; cached?: boolean; error?: string };

export const generateBiasCompare = action({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<CompareResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { summary: null, error: 'Sign in required' };
    const sub = await ctx.runQuery(api.billing.entitlements, {});
    const plan = normalizePlan(sub?.plan);
    const { limits } = entitlementsForPlan(plan);
    if (!limits.biasCompare) {
      return { summary: null, error: 'Plus or Pro required for bias comparison summary' };
    }

    const data = await ctx.runQuery(api.stories.getBySlug, { slug: args.slug });
    const story = data.story as StoryDto | null;
    if (!story) return { summary: null, error: 'Story not found' };

    if (story.biasCompareSummary) {
      return { summary: story.biasCompareSummary, cached: true };
    }

    const leftLines = story.articles
      .filter((a) => a.outlet && LEFT.has(a.outlet.biasLabel))
      .map((a) => `- ${a.outlet!.name}: "${a.title}"`)
      .slice(0, 6);
    const rightLines = story.articles
      .filter((a) => a.outlet && RIGHT.has(a.outlet.biasLabel))
      .map((a) => `- ${a.outlet!.name}: "${a.title}"`)
      .slice(0, 6);

    const prompt = `Story: ${story.canonicalTitle}

Left-leaning headlines:
${leftLines.join('\n') || '(none)'}

Right-leaning headlines:
${rightLines.join('\n') || '(none)'}

In 3-4 sentences, compare how left vs right outlets frame this story. Neutral tone. No truth verdict.`;

    try {
      const summary = await chatJson(
        'You compare news framing across the political spectrum in India. Plain text only, no JSON.',
        prompt,
      );
      await ctx.runMutation(internal.storyCompareMutations.saveSummary, { slug: args.slug, summary: summary.trim() });
      return { summary: summary.trim(), cached: false };
    } catch (e) {
      return { summary: null, error: e instanceof Error ? e.message : 'compare failed' };
    }
  },
});