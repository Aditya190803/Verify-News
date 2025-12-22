import { useState, useCallback } from 'react';
import { comprehensiveNewsSearch, extractNewsFromSearch } from '@/utils/searchUtils';
import { sanitizeSearchQuery } from '@/lib/sanitize';
import { NewsArticle } from '@/types/news';
import { saveSearchToHistory } from '@/services/appwrite';
import { logger } from '@/lib/logger';

interface UseSearchProps {
  userId?: string;
  onSearchStart: () => void;
  onSearchEnd: (articles: NewsArticle[]) => void;
  onSearchError: (error: unknown) => void;
  refreshHistory: () => void;
}

export const useSearch = ({ userId, onSearchStart, onSearchEnd, onSearchError, refreshHistory }: UseSearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const searchNews = useCallback(async (query: string, slug?: string, title?: string) => {
    try {
      onSearchStart();
      const sanitizedQuery = sanitizeSearchQuery(query);
      if (!sanitizedQuery) {
        throw new Error("Invalid search query");
      }
      setSearchQuery(sanitizedQuery);
      
      const searchResults = await comprehensiveNewsSearch(sanitizedQuery);
      const allExtractedArticles: NewsArticle[] = [];
      
      searchResults.forEach(result => {
        const articles = extractNewsFromSearch(result, query);
        allExtractedArticles.push(...articles);
      });
      
      const uniqueArticles = allExtractedArticles.filter((article, index, arr) => 
        index === arr.findIndex(a => a.url === article.url && a.title === article.title)
      );
      
      if (uniqueArticles.length === 0) {
        throw new Error("No news articles found for this query");
      }
      
      const topArticles = uniqueArticles.slice(0, 15);
      onSearchEnd(topArticles);
      
      if (userId) {
        await saveSearchToHistory(userId, sanitizedQuery, topArticles[0], slug, title);
        refreshHistory();
      }
      
      return topArticles;
    } catch (error) {
      logger.error('Error searching news:', error);
      onSearchError(error);
      throw error;
    }
  }, [userId, onSearchStart, onSearchEnd, onSearchError, refreshHistory]);

  return { searchQuery, setSearchQuery, searchNews };
};
