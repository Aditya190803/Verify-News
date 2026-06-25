import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SearchResponse, VerificationResult } from '@verify-news/shared';
import { z } from 'zod';

const ResultSchema = z.object({
  veracity: z.enum(['true', 'false', 'unverified', 'partially-true', 'verified', 'misleading']),
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
  sources: z.array(z.object({ name: z.string(), url: z.string() })).default([]),
  correctedInfo: z.string().optional(),
});

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
  const parsed = JSON.parse(cleaned) as unknown;
  const result = ResultSchema.safeParse(parsed);
  if (!result.success) {
    return parsed as VerificationResult;
  }
  return result.data as VerificationResult;
}

async function verifyOpenRouter(
  content: string,
  searchResults: SearchResponse[],
): Promise<VerificationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? 'mistralai/devstral-2512:free';
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: constructPrompt(content, searchResults) }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return parseAIResponse(data.choices[0].message.content);
}

async function verifyGemini(
  content: string,
  searchResults: SearchResponse[],
): Promise<VerificationResult> {
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

export async function verifyContent(
  content: string,
  searchResults: SearchResponse[] = [],
  articleUrl?: string,
): Promise<{ success: boolean; data: VerificationResult; provider?: string }> {
  const providers: { name: string; fn: () => Promise<VerificationResult> }[] = [];
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({ name: 'OpenRouter', fn: () => verifyOpenRouter(content, searchResults) });
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: 'Gemini', fn: () => verifyGemini(content, searchResults) });
  }
  if (providers.length === 0) {
    return {
      success: false,
      data: {
        veracity: 'unverified',
        confidence: 0,
        explanation: 'No AI keys on server. Set OPENROUTER_API_KEY or GEMINI_API_KEY.',
        sources: articleUrl ? [{ name: 'Original', url: articleUrl }] : [],
      },
    };
  }

  let lastErr: Error | null = null;
  for (const p of providers) {
    try {
      const data = await p.fn();
      if (articleUrl && !data.sources.some((s) => s.url === articleUrl)) {
        data.sources.unshift({ name: 'Original Article', url: articleUrl });
      }
      return { success: true, data: { ...data, provider: p.name }, provider: p.name };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }

  return {
    success: false,
    data: {
      veracity: 'unverified',
      confidence: 0,
      explanation: `All providers failed: ${lastErr?.message ?? 'unknown'}`,
      sources: articleUrl ? [{ name: 'Original', url: articleUrl }] : [],
    },
  };
}