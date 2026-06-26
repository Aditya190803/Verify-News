function extractBasicKeywords(content: string): string[] {
  const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const commonWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who',
  ]);
  return words.filter((w) => !commonWords.has(w)).filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 10);
}

export async function extractKeywordsWithLLM(content: string): Promise<string[]> {
  return extractBasicKeywords(content);
}

export async function generateKeywordSearchQueries(content: string): Promise<string[]> {
  const queries: string[] = [`"${content.substring(0, 100)}"`];
  const keywords = await extractKeywordsWithLLM(content);
  keywords.forEach((keyword) => {
    queries.push(`"${keyword}"`, `${keyword} news`, `${keyword} latest`);
  });
  for (let i = 0; i < keywords.length - 1 && i < 5; i++) {
    for (let j = i + 1; j < keywords.length && j < 6; j++) {
      queries.push(`"${keywords[i]}" "${keywords[j]}"`, `${keywords[i]} ${keywords[j]}`);
    }
  }
  keywords.forEach((keyword) => {
    queries.push(`${keyword} confirmed`, `${keyword} verified`, `${keyword} reports`);
  });
  return [...new Set(queries)].slice(0, 25);
}