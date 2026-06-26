'use node';

import { v } from 'convex/values';
import { action, internalAction, type ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import { createHash } from 'crypto';
import { cleanHeadline, isLikelyNewsHeadline } from './lib/headline';
import { exaSearch, sleep, type ExaHit } from './lib/exaClient';
import { outletExternalIdForUrl } from './lib/outletFromUrl';

const ENRICH_DOMAINS = [
  'thewire.in',
  'republicworld.com',
  'thehindu.com',
  'ndtv.com',
  'timesofindia.com',
  'indianexpress.com',
  'scroll.in',
  'hindustantimes.com',
] as const;

const MAX_STORIES_PER_RUN = 14;
const EXA_DELAY_MS = 180;

function hashContent(title: string, url: string): string {
  return createHash('sha256').update(`${title}|${url}`).digest('hex').slice(0, 32);
}

function exaApiKey(): string | undefined {
  return process.env.EXA_API_KEY?.trim() || undefined;
}

async function ingestExaHits(
  ctx: ActionCtx,
  hits: ExaHit[],
  knownUrls: Set<string>,
): Promise<number> {
  let inserted = 0;
  for (const h of hits) {
    const url = h.url?.trim();
    if (!url || knownUrls.has(url)) continue;
    knownUrls.add(url);

    const extId = outletExternalIdForUrl(url);
    if (!extId) continue;

    const rawTitle = h.title?.trim() || cleanHeadline(h.text?.slice(0, 140) ?? '') || url;
    const title = cleanHeadline(rawTitle);
    if (!title || !isLikelyNewsHeadline(title)) continue;

    const outlet = await ctx.runQuery(internal.feedPollQueries.outletAndFeed, { externalId: extId });
    if (!outlet) continue;

    const pub = h.publishedDate ? new Date(h.publishedDate).getTime() : undefined;
    const guid = `exa:${createHash('sha256').update(url).digest('hex').slice(0, 24)}`;
    const res = await ctx.runMutation(internal.rssMutations.insertArticle, {
      feedId: outlet.feedId,
      outletId: outlet.outletId,
      guid,
      url,
      title,
      summary: h.summary?.slice(0, 2000) ?? h.text?.slice(0, 500),
      publishedAt: pub && !Number.isNaN(pub) ? pub : undefined,
      contentHash: hashContent(title, url),
    });
    if (res.inserted) inserted++;
  }
  return inserted;
}

/** Stage 2: Exa finds same story on more seeded India outlets. */
export const enrichFromExa = internalAction({
  args: { maxStories: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const apiKey = exaApiKey();
    if (!apiKey) return { inserted: 0, storiesTouched: 0, skipped: 'EXA_API_KEY not on Convex' };

    const candidates = (await ctx.runQuery(internal.feedEnrichQueries.storiesForEnrich, {
      limit: 100,
      maxSources: 9,
      lookback: 96,
    })) as {
      storyId: string;
      canonicalTitle: string;
      articleUrls: string[];
    }[];

    const batch = candidates.slice(0, args.maxStories ?? MAX_STORIES_PER_RUN);
    let inserted = 0;
    let storiesTouched = 0;

    for (const story of batch) {
      const knownUrls = new Set(story.articleUrls);
      const title = story.canonicalTitle.slice(0, 200);
      const queries = [
        `"${title}" India news`,
        `${title} India latest`,
        ...ENRICH_DOMAINS.slice(0, 4).map((d) => `${title} site:${d}`),
      ];

      let storyAdded = 0;
      for (const q of queries) {
        try {
          const hits = await exaSearch(apiKey, q, 10);
          storyAdded += await ingestExaHits(ctx, hits, knownUrls);
          await sleep(EXA_DELAY_MS);
        } catch (e) {
          console.warn('feed enrich exa:', q, e instanceof Error ? e.message : e);
        }
      }
      if (storyAdded > 0) storiesTouched++;
      inserted += storyAdded;
    }

    return { inserted, storiesTouched };
  },
});

/** Stage 1 RSS + stage 2 Exa — cron + manual refresh. */
export const ingestFeed = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    rss: { inserted: number; feeds: number };
    enrich: { inserted: number; storiesTouched: number; skipped?: string };
    blindspot: { updated: number };
  }> => {
    const rss = await ctx.runAction(internal.rss.pollAll, {});
    const enrich = await ctx.runAction(internal.feedPoll.enrichFromExa, { maxStories: MAX_STORIES_PER_RUN });
    const blindspot = await ctx.runMutation(internal.blindspotMutations.recomputeBlindspots, { limit: 200 });
    return { rss, enrich, blindspot };
  },
});

/** `npx convex run feedPoll:refreshFeed` */
type IngestResult = {
  rss: { inserted: number; feeds: number };
  enrich: { inserted: number; storiesTouched: number; skipped?: string };
  blindspot: { updated: number };
};

export const refreshFeed = action({
  args: {},
  handler: async (ctx): Promise<IngestResult> =>
    ctx.runAction(internal.feedPoll.ingestFeed, {}) as Promise<IngestResult>,
});