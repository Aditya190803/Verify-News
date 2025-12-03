import React from 'react';
import { Clock, RefreshCw, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SearchHistoryHeaderProps {
  historyCount: number;
  filteredCount: number;
  totalCount: number;
  loading: boolean;
  onRefresh: () => void;
  onClearAll: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

/**
 * Header component for SearchHistory panel
 * Displays title, counts, and action buttons (refresh, clear all, close)
 */
export const SearchHistoryHeader: React.FC<SearchHistoryHeaderProps> = ({
  historyCount,
  filteredCount,
  totalCount,
  loading,
  onRefresh,
  onClearAll,
  onClose,
  showCloseButton = false,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        History
        {historyCount > 0 && (
          <span className="text-xs text-muted-foreground font-normal">
            ({filteredCount})
          </span>
        )}
      </h3>
      <div className="flex items-center gap-1">
        {historyCount > 0 && (
          <>
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={loading}
              aria-label="Refresh history"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:text-destructive"
                  aria-label="Clear all history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {totalCount} items. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onClearAll} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        {showCloseButton && onClose && (
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            aria-label="Close history panel"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchHistoryHeader;
