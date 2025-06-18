import React, { createContext, useContext, useCallback, ReactNode } from 'react';

interface SearchHistoryContextType {
  refreshSearchHistory: () => void;
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined);

export const useSearchHistoryContext = () => {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    // Return a no-op function if context is not available
    return {
      refreshSearchHistory: () => {},
    };
  }
  return context;
};

interface SearchHistoryProviderProps {
  children: ReactNode;
  onRefreshHistory?: () => void;
}

export const SearchHistoryProvider = ({ children, onRefreshHistory }: SearchHistoryProviderProps) => {
  const refreshSearchHistory = useCallback(() => {
    if (onRefreshHistory) {
      onRefreshHistory();
    }
  }, [onRefreshHistory]);

  const value = {
    refreshSearchHistory,
  };

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
};
