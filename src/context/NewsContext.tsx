
import React, { createContext, useContext, ReactNode } from 'react';
import { useNewsState } from '../hooks/useNewsState';
import { NewsContextType } from '@/types/news';

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const newsState = useNewsState();

  return (
    <NewsContext.Provider value={newsState}>
      {children}
    </NewsContext.Provider>
  );
};

// Add display name for better debugging
NewsProvider.displayName = 'NewsProvider';

export const useNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};
