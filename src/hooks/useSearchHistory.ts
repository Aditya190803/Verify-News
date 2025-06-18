import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserSearchHistory, SearchHistoryItem } from '@/services/firebaseService';

export const useSearchHistory = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSearchHistory = useCallback(async () => {
    if (!currentUser) {
      setHistory([]);
      return;
    }
    
    setLoading(true);
    try {
      const userHistory = await getUserSearchHistory(currentUser.uid);
      setHistory(userHistory);
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  const refreshHistory = useCallback(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  return {
    history,
    loading,
    refreshHistory,
  };
};
