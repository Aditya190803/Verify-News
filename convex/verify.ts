'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import { createHash } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  return JSON.parse(cleaned) as VerificationResult;
}

async function verifyGemini(content: string, searchResults: SearchResponse[]): Promise<VerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(constructPrompt(content, searchResults));
  return parseAIResponse(result.response.text());
}

export const run = action({
  args: {
    content: v.string(),
    articleUrl: v.optional(v.string()),
    searchResults: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const content = args.content.trim();
    if (!content) throw new Error('content is required');

    await ctx.runMutation(internal.verifications.assertCanVerifyInternal, {});

    const searchResults = (args.searchResults ?? []) as SearchResponse[];
    let data: VerificationResult;
    let success = false;
    try {
      if (process.env.GEMINI_API_KEY) {
        data = await verifyGemini(content, searchResults);
        data.provider = 'Gemini';
        success = true;
      } else {
        data = {
          veracity: 'unverified',
          confidence: 0,
          explanation: 'No AI keys on server. Set GEMINI_API_KEY in Convex.',
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
      contentHash,
      veracity: data.veracity,
      confidence: data.confidence,
      resultJson: JSON.stringify({ success, data }),
    });

    return { success, data };
  },
});