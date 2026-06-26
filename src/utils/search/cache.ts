import { logger } from '@/lib/logger';
import type { SearchResponse } from '@/types/news';

const SEARCH_CACHE_KEY = 'verify_news_search_cache';
export const CACHE_EXPIRATION_MS = 1000 * 60 * 60 * 24;

interface CachedSearch {
  timestamp: number;
  results: SearchResponse[];
}

export function getSearchCache(): Record<string, CachedSearch> {
  try {
    const cache = localStorage.getItem(SEARCH_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

export function saveSearchCache(cache: Record<string, CachedSearch>) {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    logger.warn('Failed to save search cache:', e);
  }
}

export function readCachedResults(normalizedContent: string): SearchResponse[] | null {
  const cache = getSearchCache();
  const entry = cache[normalizedContent];
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= CACHE_EXPIRATION_MS) return null;
  return entry.results;
}

export function writeCachedResults(normalizedContent: string, results: SearchResponse[]) {
  const cache = getSearchCache();
  cache[normalizedContent] = { timestamp: Date.now(), results };
  saveSearchCache(cache);
}