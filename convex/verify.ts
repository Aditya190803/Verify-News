'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import { createHash } from 'crypto';
import { chatJson } from './lib/bigPickle';

type SearchResponse = { title?: string; url?: string; snippet?: string };
type VerificationResult = {
  veracity: string;
  confidence: number;
  explanation: string;
  sources: { name: string; url: string }[];
  correctedInfo?: string;
  provider?: string;
};

function constructPrompt(content: string, searchResults: SearchResponse[]): string {
  const searchContext =
    searchResults.length > 0
      ? `Search Results:\n${JSON.stringify(searchResults, null, 2)}`
      : 'No search results available.';
  return `Verify the following news content:
"${content}"

${searchContext}

Respond ONLY with a JSON object in this format:
{
  "veracity": "true" | "false" | "partially-true" | "unverified",
  "confidence": number (0-100),
  "explanation": "string (2-3 sentences)",
  "sources": [{"name": "string", "url": "string"}]
}`;
}

function parseAIResponse(text: string): VerificationResult {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(json) as VerificationResult;
  } catch {
    console.error('verify: JSON parse failed', cleaned.slice(0, 400));
    throw new Error('AI returned invalid JSON');
  }
}

async function verifyBigPickle(content: string, searchResults: SearchResponse[]): Promise<VerificationResult> {
  const raw = await chatJson(
    'You are a fact-checking assistant. Reply with valid JSON only, no markdown.',
    constructPrompt(content, searchResults),
  );
  return parseAIResponse(raw);
}

export const run = action({
  args: {
    content: v.string(),
    articleUrl: v.optional(v.string()),
    searchResults: v.optional(
      v.array(
        v.object({
          title: v.optional(v.string()),
          url: v.optional(v.string()),
          snippet: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const content = args.content.trim();
    if (!content) throw new Error('content is required');

    await ctx.runMutation(internal.verifications.assertCanVerifyInternal, {});

    const clientSearch = (args.searchResults ?? []) as SearchResponse[];
    let searchResults = clientSearch;
    try {
      const exa = await ctx.runAction(internal.verifyEnrich.searchCoverageForVerify, { content });
      const merged = new Map<string, SearchResponse>();
      for (const r of clientSearch) {
        if (r.url) merged.set(r.url, r);
      }
      for (const r of exa.results) {
        if (!merged.has(r.url)) {
          merged.set(r.url, { title: r.title, url: r.url, snippet: r.snippet });
        }
      }
      searchResults = [...merged.values()];
    } catch (e) {
      console.warn('verify: server Exa merge skipped', e instanceof Error ? e.message : e);
    }
    let data: VerificationResult;
    let success = false;
    try {
      if (process.env.OPENCODE_API_KEY) {
        data = await verifyBigPickle(content, searchResults);
        data.provider = 'Big Pickle';
        success = true;
      } else {
        data = {
          veracity: 'unverified',
          confidence: 0,
          explanation: 'No AI keys on server. Set OPENCODE_API_KEY in Convex.',
          sources: args.articleUrl ? [{ name: 'Original', url: args.articleUrl }] : [],
        };
      }
    } catch (e) {
      data = {
        veracity: 'unverified',
        confidence: 0,
        explanation: e instanceof Error ? e.message : 'verify failed',
        sources: args.articleUrl ? [{ name: 'Original', url: args.articleUrl }] : [],
      };
    }

    if (args.articleUrl && !data.sources.some((s) => s.url === args.articleUrl)) {
      data.sources.unshift({ name: 'Original Article', url: args.articleUrl });
    }

    const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 32);
    await ctx.runMutation(internal.verifications.save, {
      userId,
      slug: contentHash,
      contentHash: contentHash,
      veracity: data.veracity,
      confidence: data.confidence,
      resultJson: JSON.stringify({
        success,
        data,
        slug: contentHash,
        contentPreview: content.slice(0, 120),
      }),
    });

    return { success, data, slug: contentHash };
  },
});