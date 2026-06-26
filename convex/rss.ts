'use node';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { cleanHeadline, isLikelyNewsHeadline } from './lib/headline';

const parser = new Parser({
  timeout: 20_000,
  headers: { 'User-Agent': 'Facets/0.1 (+https://github.com/Aditya190803/Facets)' },
});

function hashContent(title: string, url: string): string {
  return createHash('sha256').update(`${title}|${url}`).digest('hex').slice(0, 32);
}

export const pollAll = internalAction({
  args: {},
  handler: async (ctx): Promise<{ inserted: number; feeds: number }> => {
    const feeds = await ctx.runQuery(internal.rssQueries.listEnabledFeeds, {});
    let total = 0;
    for (const feed of feeds) {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of parsed.items ?? []) {
          const raw = item.title?.trim();
          const link = item.link?.trim();
          if (!raw || !link) continue;
          const t = cleanHeadline(raw);
          if (!isLikelyNewsHeadline(t)) continue;
          const guid = String(item.guid || item.id || link);
          const pub = item.pubDate ? new Date(item.pubDate).getTime() : undefined;
          const res = await ctx.runMutation(internal.rssMutations.insertArticle, {
            feedId: feed._id,
            outletId: feed.outletId,
            guid,
            url: link,
            title: t,
            summary: item.contentSnippet?.slice(0, 2000) ?? item.summary ?? undefined,
            publishedAt: pub,
            contentHash: hashContent(t, link),
          });
          if (res.inserted) total++;
        }
        await ctx.runMutation(internal.rssMutations.patchFeedOk, { feedId: feed._id });
      } catch (e) {
        await ctx.runMutation(internal.rssMutations.patchFeedError, {
          feedId: feed._id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { inserted: total, feeds: feeds.length };
  },
});