import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchUserVerificationsForDashboard } from '@/services/aggregation';
import { logger } from '@/lib/logger';
import { SearchHistoryItem } from '@/types/news';

/** Convex verification history (replaces Appwrite search history). */
export const useSearchHistory = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadSearchHistory = useCallback(async () => {
    if (!currentUser) {
      setHistory([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchUserVerificationsForDashboard(50);
      const items: SearchHistoryItem[] = (rows ?? []).map((r) => ({
        id: r.id,
        query: r.query,
        title: r.title,
        timestamp: r.timestamp,
        resultType: 'verification',
        slug: r.slug,
        veracity: r.veracity,
        confidence: r.confidence,
      }));
      setHistory(items);
      setTotal(items.length);
    } catch (error) {
      logger.error('Error loading history:', error);
      setHistory([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteHistoryItem = async (_itemId: string) => {
    await loadSearchHistory();
  };

  const clearHistory = async () => {
    setHistory([]);
    setTotal(0);
  };

  return {
    history,
    total,
    loading,
    page: 0,
    pageSize: 50,
    loadSearchHistory,
    refreshSearchHistory: loadSearchHistory,
    deleteHistoryItem,
    clearHistory,
    setPage: () => {},
  };
};