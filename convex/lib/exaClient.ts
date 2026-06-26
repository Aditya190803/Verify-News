export type ExaHit = {
  title?: string;
  url?: string;
  text?: string;
  summary?: string;
  publishedDate?: string;
};

export async function exaSearch(apiKey: string, query: string, numResults: number): Promise<ExaHit[]> {
  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      numResults,
      type: 'auto',
      contents: { text: { maxCharacters: 600 }, highlights: { maxCharacters: 300 } },
    }),
  });
  if (!res.ok) throw new Error(`Exa ${res.status}: ${query.slice(0, 80)}`);
  const data = (await res.json()) as { results?: ExaHit[] };
  return data.results ?? [];
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}