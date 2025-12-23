
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, ReactNode, Component, ErrorInfo } from 'react';
import { useNewsState } from '../hooks/useNewsState';
import { NewsContextType } from '@/types/news';
import { logger } from '@/lib/logger';

// Create the context with proper typing
const NewsContext = createContext<NewsContextType | undefined>(undefined);

// Error Boundary for NewsContext
class NewsContextErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    logger.error('NewsContext ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: _errorInfo.componentStack
    });
    // Error is handled by error boundary, no need to re-throw
  }

  render() {
    if (this.state.hasError) {
      // Still render children so the error boundary doesn't break the entire app
      // The error will be caught by parent error boundaries
      return this.props.children;
    }
    return this.props.children;
  }
}

// Provider component with proper display name and error handling
export function NewsProvider({ children }: { children: ReactNode }) {
  try {
    const newsState = useNewsState();
    
    // Log state changes for debugging
    logger.debug('NewsContext initialized with state:', {
      hasSearchQuery: !!newsState.searchQuery,
      hasArticles: newsState.articles.length > 0,
      status: newsState.status
    });

    return (
      <NewsContextErrorBoundary>
        <NewsContext.Provider value={newsState}>
          {children}
        </NewsContext.Provider>
      </NewsContextErrorBoundary>
    );
  } catch (error) {
    logger.error('Failed to initialize NewsProvider:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return null to prevent app crash, but log the error
    return null;
  }
}

// Add display name for better debugging and Fast Refresh compatibility
NewsProvider.displayName = 'NewsProvider';

export function useNews(): NewsContextType {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}

// Add display name for the hook as well
useNews.displayName = 'useNews';
