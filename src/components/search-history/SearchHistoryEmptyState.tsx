import React from 'react';
import { Clock, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchHistoryEmptyStateProps {
  type: 'not-logged-in' | 'no-history' | 'no-matches';
  onClose?: () => void;
  showCloseButton?: boolean;
  onClearFilters?: () => void;
}

/**
 * Empty state component for various SearchHistory scenarios
 * - not-logged-in: User needs to sign in
 * - no-history: No history items exist
 * - no-matches: No items match current filters
 */
export const SearchHistoryEmptyState: React.FC<SearchHistoryEmptyStateProps> = ({
  type,
  onClose,
  showCloseButton = false,
  onClearFilters,
}) => {
  if (type === 'not-logged-in') {
    return (
      <div className="p-6 h-full">
        {showCloseButton && onClose && (
          <div className="flex justify-end mb-4">
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="text-center py-12">
          <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
          <h3 className="font-medium mb-2">Search history</h3>
          <p className="text-sm text-muted-foreground">
            Sign in to save your history
          </p>
        </div>
      </div>
    );
  }

  if (type === 'no-history') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
        <p className="text-muted-foreground">No history yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Your searches will appear here
        </p>
      </div>
    );
  }

  if (type === 'no-matches') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <Search className="h-10 w-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
        <p className="text-muted-foreground">No matches</p>
        {onClearFilters && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={onClearFilters}
            className="mt-2"
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default SearchHistoryEmptyState;
