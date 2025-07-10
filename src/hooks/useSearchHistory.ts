import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserSearchHistory, SearchHistoryItem } from '@/services/firebaseService';

export const useSearchHistory = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSearchHistory = useCallback(async () => {
    console.log('🔄 loadSearchHistory called, currentUser:', currentUser?.uid);
    if (!currentUser) {
      console.log('❌ No current user, setting empty history');
      setHistory([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log('📡 Fetching search history...');
      const userHistory = await getUserSearchHistory(currentUser.uid);
      console.log('📚 Received history:', userHistory);
      setHistory(userHistory);
    } catch (error) {
      console.error('❌ Error loading search history:', error);
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
