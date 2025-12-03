import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useSearchHistoryContext } from '@/context/SearchHistoryContext';
import { SearchHistoryItem } from '@/services/appwriteService';
import { useNews } from '@/context/NewsContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SearchHistoryHeader,
  SearchHistoryFilters,
  SearchHistoryItemCard,
  SearchHistoryEmptyState,
  SearchHistoryLoading,
  type HistoryFilterType,
} from '@/components/search-history';

interface SearchHistoryProps {
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

/**
 * SearchHistory component displays user's search and verification history
 * with filtering, search, and management capabilities.
 */
const SearchHistory = ({ className, onClose, showCloseButton = false }: SearchHistoryProps) => {
  const { currentUser } = useAuth();
  const { searchNews } = useNews();
  const { history, loading, refreshHistory, deleteItem, clearHistory, total } = useSearchHistory();
  const { registerRefreshFunction, unregisterRefreshFunction } = useSearchHistoryContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<HistoryFilterType>('all');
  const navigate = useNavigate();

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.resultType === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.query?.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [history, searchQuery, typeFilter]);

  useEffect(() => {
    registerRefreshFunction(refreshHistory);
    return () => {
      unregisterRefreshFunction();
    };
  }, [refreshHistory, registerRefreshFunction, unregisterRefreshFunction]);

  const handleSearchClick = useCallback(async (item: SearchHistoryItem) => {
    try {
      if (item.resultType === 'verification' && item.slug) {
        navigate(`/result/${item.slug}`);
      } else {
        navigate('/');
        await searchNews(item.query);
      }
      onClose?.();
    } catch (error) {
      console.error('Error handling history item click:', error);
    }
  }, [navigate, searchNews, onClose]);

  const handleDeleteItem = useCallback(async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setDeletingId(itemId);
    await deleteItem(itemId);
    setDeletingId(null);
  }, [deleteItem]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('all');
  }, []);

  if (!currentUser) {
    return (
      <div className={cn('h-full', className)}>
        <SearchHistoryEmptyState 
          type="not-logged-in" 
          onClose={onClose}
          showCloseButton={showCloseButton}
        />
      </div>
    );
  }

  return (
    <div className={cn('p-4 h-full flex flex-col', className)}>
      <SearchHistoryHeader
        historyCount={history.length}
        filteredCount={filteredHistory.length}
        totalCount={total}
        loading={loading}
        onRefresh={refreshHistory}
        onClearAll={clearHistory}
        onClose={onClose}
        showCloseButton={showCloseButton}
      />

      {history.length > 0 && (
        <SearchHistoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
      )}

      {loading ? (
        <SearchHistoryLoading />
      ) : history.length === 0 ? (
        <SearchHistoryEmptyState type="no-history" />
      ) : filteredHistory.length === 0 ? (
        <SearchHistoryEmptyState 
          type="no-matches" 
          onClearFilters={handleClearFilters}
        />
      ) : (
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-2">
            {filteredHistory.map((item, index) => (
              <SearchHistoryItemCard
                key={item.id || index}
                item={item}
                index={index}
                deletingId={deletingId}
                onItemClick={handleSearchClick}
                onDeleteItem={handleDeleteItem}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SearchHistory;
