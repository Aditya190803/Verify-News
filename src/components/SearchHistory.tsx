import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { SearchHistoryItem } from '@/services/firebaseService';
import { useNews } from '@/context/NewsContext';
import { Clock, Search, FileCheck, ExternalLink, ChevronDown, ChevronUp, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchHistoryProps {
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

// Create a global refresh function that can be called from anywhere
let globalRefreshHistory: (() => void) | null = null;

export const refreshSearchHistoryGlobally = () => {
  if (globalRefreshHistory) {
    globalRefreshHistory();
  }
};

const SearchHistory = ({ className, onClose, showCloseButton = false }: SearchHistoryProps) => {
  const { currentUser } = useAuth();
  const { searchNews } = useNews();
  const { history, loading, refreshHistory } = useSearchHistory();
  const [isExpanded, setIsExpanded] = useState(false);

  // Set the global refresh function
  useEffect(() => {
    globalRefreshHistory = refreshHistory;
    return () => {
      globalRefreshHistory = null;
    };
  }, [refreshHistory]);

  const handleSearchClick = async (item: SearchHistoryItem) => {
    try {
      await searchNews(item.query);
    } catch (error) {
      console.error('Error re-running search:', error);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine how many items to show
  const maxItemsWhenCollapsed = 5;
  const displayedHistory = isExpanded ? history : history.slice(0, maxItemsWhenCollapsed);
  const hasMoreItems = history.length > maxItemsWhenCollapsed;

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };  if (!currentUser) {
    return (
      <div className={cn('w-full lg:w-80 p-4 sm:p-6 border-r border-border bg-card/50 min-h-screen', className)}>
        {showCloseButton && onClose && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="text-center">
          <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">Search History</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Sign in to see your search history and save your verification results.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className={cn('w-full lg:w-80 p-4 sm:p-6 border-r border-border bg-card/50 min-h-screen', className)}>      
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Search History
          {history.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              ({history.length})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button
              onClick={refreshHistory}
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={loading}
            >
              Refresh
            </Button>
          )}          {showCloseButton && onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Close Search History"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (        <div className="text-center text-muted-foreground">
          <Search className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 opacity-50" />
          <p className="text-xs sm:text-sm">No search history yet.</p>
          <p className="text-xs mt-1">Start searching to see your history here.</p>
        </div>      ) : (
        <ScrollArea className="h-[calc(100vh-160px)] sm:h-[calc(100vh-200px)]">
          <div className="space-y-2 sm:space-y-3">
            {displayedHistory.map((item, index) => (
              <div
                key={item.id || index}
                className="group p-2.5 sm:p-3 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                onClick={() => handleSearchClick(item)}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {item.resultType === 'verification' ? (
                      <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    )}
                    <p className="text-xs sm:text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {item.query}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>
                
                {item.articleTitle && (
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.articleTitle}
                    </p>
                  </div>
                )}
                
                <div className="mt-1.5 sm:mt-2 flex gap-1">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    item.resultType === 'verification' 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {item.resultType === 'verification' ? 'Verified' : 'Search'}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Show More/Show Less Button */}
            {hasMoreItems && (
              <Button
                onClick={toggleExpanded}
                variant="ghost"
                size="sm"
                className="w-full mt-3 flex items-center justify-center gap-2 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show Less ({maxItemsWhenCollapsed} of {history.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show More ({history.length - maxItemsWhenCollapsed} more)
                  </>
                )}
              </Button>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SearchHistory;
