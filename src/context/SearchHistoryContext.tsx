import React, { createContext, useContext, useCallback, ReactNode, useRef } from 'react';

interface SearchHistoryContextType {
  refreshSearchHistory: () => void;
  registerRefreshFunction: (fn: () => void) => void;
  unregisterRefreshFunction: () => void;
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined);

export const useSearchHistoryContext = () => {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    // Return a no-op function if context is not available
    return {
      refreshSearchHistory: () => {},
      registerRefreshFunction: () => {},
      unregisterRefreshFunction: () => {},
    };
  }
  return context;
};

interface SearchHistoryProviderProps {
  children: ReactNode;
}

export const SearchHistoryProvider = ({ children }: SearchHistoryProviderProps) => {
  const refreshFunctionRef = useRef<(() => void) | null>(null);

  const registerRefreshFunction = useCallback((fn: () => void) => {
    refreshFunctionRef.current = fn;
  }, []);

  const unregisterRefreshFunction = useCallback(() => {
    refreshFunctionRef.current = null;
  }, []);

  const refreshSearchHistory = useCallback(() => {
    if (refreshFunctionRef.current) {
      refreshFunctionRef.current();
    }
  }, []);

  const value = {
    refreshSearchHistory,
    registerRefreshFunction,
    unregisterRefreshFunction,
  };

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
};
