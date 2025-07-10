
import React, { createContext, useContext, ReactNode } from 'react';
import { useNewsState } from '../hooks/useNewsState';
import { NewsContextType } from '@/types/news';

// Create the context with proper typing
const NewsContext = createContext<NewsContextType | undefined>(undefined);

// Provider component with proper display name
export function NewsProvider({ children }: { children: ReactNode }) {
  const newsState = useNewsState();

  return (
    <NewsContext.Provider value={newsState}>
      {children}
    </NewsContext.Provider>
  );
}

// Add display name for better debugging and Fast Refresh compatibility
NewsProvider.displayName = 'NewsProvider';

// Custom hook with proper function declaration for Fast Refresh
export function useNews(): NewsContextType {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}

// Add display name for the hook as well
useNews.displayName = 'useNews';
