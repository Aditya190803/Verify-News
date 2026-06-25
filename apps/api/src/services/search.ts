import type { SearchResponse } from '@verify-news/shared';

export async function searchTavily(query: string): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: query.slice(0, 400),
      search_depth: 'basic',
      max_results: 5,
    }),
  });

  if (!response.ok) throw new Error(`Tavily ${response.status}`);
  const data = (await response.json()) as {
    results: { title: string; content: string; url: string }[];
  };

  return {
    webPages: {
      value: data.results.map((r) => ({
        title: r.title,
        snippet: r.content,
        url: r.url,
      })),
    },
  };
}

export async function searchForVerify(content: string): Promise<SearchResponse[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  try {
    const q = content.trim().slice(0, 200);
    const one = await searchTavily(q);
    return [one];
  } catch {
    return [];
  }
}