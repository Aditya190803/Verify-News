import { useState, useCallback } from 'react';
import { comprehensiveNewsSearch, extractNewsFromSearch } from '@/utils/searchUtils';
import { sanitizeSearchQuery } from '@/lib/sanitize';
import { NewsArticle } from '@/types/news';
import { logger } from '@/lib/logger';

interface UseSearchProps {
  onSearchStart: () => void;
  onSearchEnd: (articles: NewsArticle[]) => void;
  onSearchError: (error: unknown) => void;
}

export const useSearch = ({ onSearchStart, onSearchEnd, onSearchError }: UseSearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const searchNews = useCallback(
    async (query: string) => {
      try {
        onSearchStart();
        const sanitizedQuery = sanitizeSearchQuery(query);
        if (!sanitizedQuery) throw new Error('Invalid search query');
        setSearchQuery(sanitizedQuery);

        const searchResults = await comprehensiveNewsSearch(sanitizedQuery);
        const allExtractedArticles: NewsArticle[] = [];
        searchResults.forEach((result) => {
          allExtractedArticles.push(...extractNewsFromSearch(result, query));
        });

        const uniqueArticles = allExtractedArticles.filter(
          (article, index, arr) =>
            index === arr.findIndex((a) => a.url === article.url && a.title === article.title),
        );

        if (uniqueArticles.length === 0) throw new Error('No news articles found for this query');

        const topArticles = uniqueArticles.slice(0, 15);
        onSearchEnd(topArticles);
        return topArticles;
      } catch (error) {
        logger.error('Error searching news:', error);
        onSearchError(error);
        throw error;
      }
    },
    [onSearchStart, onSearchEnd, onSearchError],
  );

  return { searchQuery, setSearchQuery, searchNews };
};