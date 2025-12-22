import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserSearchHistory, 
  deleteSearchHistoryItem, 
  clearUserSearchHistory
} from '@/services/appwrite';
import { logger } from '@/lib/logger';
import { SearchHistoryItem } from '@/types/news';

export const useSearchHistory = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const loadSearchHistory = useCallback(async (pageNum: number = 0) => {
    if (!currentUser) {
      setHistory([]);
      setTotal(0);
      return;
    }
    
    setLoading(true);
    try {
      const result = await getUserSearchHistory(currentUser.uid, pageSize, pageNum * pageSize);
      setHistory(result.items);
      setTotal(result.total);
      setPage(pageNum);
    } catch (error) {
      logger.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadSearchHistory(0);
  }, [loadSearchHistory]);

  const refreshHistory = useCallback(() => {
    loadSearchHistory(page);
  }, [loadSearchHistory, page]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!currentUser) return false;
    const success = await deleteSearchHistoryItem(currentUser.uid, itemId);
    if (success) {
      // Optimistically update local state
      setHistory(prev => prev.filter(item => item.id !== itemId));
      setTotal(prev => prev - 1);
    }
    return success;
  }, [currentUser]);

  const clearHistory = useCallback(async () => {
    if (!currentUser) return false;
    const success = await clearUserSearchHistory(currentUser.uid);
    if (success) {
      setHistory([]);
      setTotal(0);
    }
    return success;
  }, [currentUser]);

  const loadMore = useCallback(() => {
    if (history.length < total) {
      loadSearchHistory(page + 1);
    }
  }, [history.length, total, page, loadSearchHistory]);

  return {
    history,
    total,
    loading,
    hasMore: history.length < total,
    refreshHistory,
    deleteItem,
    clearHistory,
    loadMore,
  };
};
