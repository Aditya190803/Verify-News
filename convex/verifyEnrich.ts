'use node';

import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { exaSearch } from './lib/exaClient';
import { outletExternalIdForUrl } from './lib/outletFromUrl';

const DOMAIN_QUERIES = ['thehindu.com', 'indianexpress.com', 'ndtv.com', 'republicworld.com', 'thewire.in'];

function exaApiKey(): string | undefined {
  return process.env.EXA_API_KEY?.trim() || undefined;
}

/** Server-side Exa: how multiple outlets cover the same claim (verify context). */
export const searchCoverageForVerify = internalAction({
  args: { content: v.string(), maxResults: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    const apiKey = exaApiKey();
    if (!apiKey) return { results: [] as { title: string; url: string; snippet: string; outletId: string | null }[] };

    const claim = args.content.trim().slice(0, 280);
    const perQuery = Math.min(args.maxResults ?? 6, 8);
    const seen = new Set<string>();
    const results: { title: string; url: string; snippet: string; outletId: string | null }[] = [];

    const queries = [
      `${claim} India fact check news`,
      `${claim} India`,
      ...DOMAIN_QUERIES.map((d) => `${claim} site:${d}`),
    ];

    for (const q of queries) {
      try {
        const hits = await exaSearch(apiKey, q, perQuery);
        for (const h of hits) {
          const url = h.url?.trim();
          if (!url || seen.has(url)) continue;
          seen.add(url);
          results.push({
            title: h.title?.trim() || url,
            url,
            snippet: (h.summary || h.text || '').slice(0, 500),
            outletId: outletExternalIdForUrl(url),
          });
        }
      } catch (e) {
        console.warn('verify enrich exa:', e instanceof Error ? e.message : e);
      }
      if (results.length >= 24) break;
    }

    return { results: results.slice(0, 24) };
  },
});