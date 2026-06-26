import { logger } from '@/lib/logger';
import type { SearchResponse } from '@/types/news';
import { getExaApiKey, getTavilyApiKey } from './env';

function normalizeQuery(query: string): string {
  return query.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
}

export async function searchExa(query: string): Promise<SearchResponse> {
  if (!query?.trim()) throw new Error('Search query cannot be empty');
  const apiKey = getExaApiKey();
  if (!apiKey) throw new Error('Exa API key not configured');

  const q = normalizeQuery(query);
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: q,
      numResults: 10,
      type: 'auto',
      contents: { text: { maxCharacters: 1200 }, highlights: { maxCharacters: 400 } },
    }),
  });
  if (!response.ok) throw new Error(`Exa API returned ${response.status}`);

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      text?: string;
      summary?: string;
      highlights?: string[];
    }>;
  };

  const value =
    data.results?.map((r) => {
      const snippet =
        r.summary ||
        r.text?.slice(0, 800) ||
        (r.highlights?.length ? r.highlights.join(' ') : '') ||
        '';
      return { name: r.title || r.url || 'Result', url: r.url || '', snippet, summary: r.summary };
    }) ?? [];

  if (!value.length) throw new Error('No results from Exa');
  return { webPages: { value } };
}

export async function searchTavily(query: string): Promise<SearchResponse> {
  const apiKey = getTavilyApiKey();
  if (!apiKey) throw new Error('Tavily API key not configured');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: false,
      include_images: false,
      max_results: 5,
    }),
  });
  if (!response.ok) throw new Error(`Tavily API returned ${response.status}`);
  const data = await response.json();
  return {
    webPages: {
      value: data.results.map((r: { title: string; content: string; url: string }) => ({
        name: r.title,
        snippet: r.content,
        url: r.url,
      })),
    },
  };
}

/** @deprecated Use searchExa — alias for tests / old imports */
export const searchLangSearch = searchExa;

export async function searchMultipleSources(query: string): Promise<SearchResponse[]> {
  const searches = [
    query,
    `${query} site:thehindu.com`,
    `${query} site:indianexpress.com`,
    `${query} site:ndtv.com`,
    `${query} site:reuters.com`,
  ];
  const allResults: SearchResponse[] = [];
  let successfulSearches = 0;
  let failedSearches = 0;
  for (const searchQuery of searches) {
    try {
      let result;
      try {
        result = await searchExa(searchQuery);
      } catch {
        result = await searchTavily(searchQuery);
      }
      if (result) {
        allResults.push(result);
        successfulSearches++;
        failedSearches = 0;
      }
      if (successfulSearches >= 2) break;
      await new Promise((r) => setTimeout(r, 100));
    } catch (error) {
      logger.warn(`Search failed for: ${searchQuery}`, error);
      failedSearches++;
      if (failedSearches >= 3) break;
    }
  }
  return allResults;
}