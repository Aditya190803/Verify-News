import { rankSearchResultsWithFallback } from '@/services/aiProviders';
import { logger } from '@/lib/logger';
import type { SearchArticle, SearchResponse } from '@/types/news';
import { readCachedResults, writeCachedResults } from './cache';
import { generateKeywordSearchQueries } from './keywords';
import { searchMultipleSources } from './providers';
import { generateSearchVariations } from './variations';

export async function comprehensiveNewsSearch(
  content: string,
  onStatusChange?: (status: 'searching' | 'ranking') => void,
): Promise<SearchResponse[]> {
  logger.info('Starting comprehensive news search...');
  onStatusChange?.('searching');
  const normalizedContent = content.trim().toLowerCase();
  const cached = readCachedResults(normalizedContent);
  if (cached) {
    logger.info('Returning cached search results');
    return cached;
  }

  try {
    const keywordQueries = await generateKeywordSearchQueries(content);
    const basicVariations = generateSearchVariations(content);
    const uniqueQueries = [...new Set([...keywordQueries, ...basicVariations])].slice(0, 3);
    const allResults: SearchResponse[] = [];
    for (const query of uniqueQueries) {
      try {
        allResults.push(...(await searchMultipleSources(query)));
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        logger.warn(`Search failed for query: ${query}`, e);
      }
    }
    const flatResults: SearchArticle[] = [];
    allResults.forEach((res) => {
      if (res.webPages?.value) flatResults.push(...res.webPages.value);
      if (res.results) flatResults.push(...res.results);
      if (res.value) flatResults.push(...res.value);
    });
    const uniqueFlat = Array.from(new Map(flatResults.map((item) => [item.url, item])).values());
    onStatusChange?.('ranking');
    const rankedResults = await rankSearchResultsWithFallback(content, uniqueFlat);
    const finalResults = [{ webPages: { value: rankedResults } }];
    writeCachedResults(normalizedContent, finalResults);
    return finalResults;
  } catch (error) {
    logger.error('Error in comprehensive search:', error);
    return searchMultipleSources(content);
  }
}