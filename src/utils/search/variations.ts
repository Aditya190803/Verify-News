export function generateSearchVariations(query: string): string[] {
  if (!query?.trim()) return [];
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const variations = [cleanQuery];
  const words = cleanQuery.split(' ').filter((word) => word.length > 3);
  if (cleanQuery.length > 50) {
    const keyTerms = words.slice(0, 5).join(' ');
    if (keyTerms) variations.push(keyTerms);
  }
  if (words.length > 2) {
    const keyWords = words.filter((w) => !['news', 'latest', 'breaking', 'update'].includes(w.toLowerCase()));
    if (keyWords.length >= 2) variations.push(keyWords.slice(0, 3).join(' '));
  }
  if (cleanQuery.length < 60) variations.push(`"${cleanQuery}"`);
  variations.push(`${cleanQuery} news`, `${cleanQuery} breaking news`, `${cleanQuery} latest`);
  return [...new Set(variations)].filter((v) => v.length > 0);
}