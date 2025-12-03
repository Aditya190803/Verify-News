import React from 'react';
import { CheckCircle, Search, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchHistoryItem } from '@/services/appwriteService';

interface SearchHistoryItemCardProps {
  item: SearchHistoryItem;
  index: number;
  deletingId: string | null;
  onItemClick: (item: SearchHistoryItem) => void;
  onDeleteItem: (e: React.MouseEvent, itemId: string) => void;
}

/**
 * Format a timestamp into a human-readable "time ago" string
 */
function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return `${Math.floor(diffInDays / 7)}w ago`;
}

/**
 * Individual history item card component
 * Displays query, type badge, timestamp, and delete button
 */
export const SearchHistoryItemCard: React.FC<SearchHistoryItemCardProps> = ({
  item,
  index,
  deletingId,
  onItemClick,
  onDeleteItem,
}) => {
  const isDeleting = deletingId === item.id;
  const isVerification = item.resultType === 'verification';

  return (
    <div
      key={item.id || index}
      className="group p-3 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer relative"
      onClick={() => onItemClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(item);
        }
      }}
      aria-label={`${isVerification ? 'Verification' : 'Search'}: ${item.query}`}
    >
      {item.id && (
        <Button
          onClick={(e) => onDeleteItem(e, item.id!)}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
          disabled={isDeleting}
          aria-label="Delete this item"
        >
          {isDeleting ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      )}
      
      <div className="flex items-start gap-2 pr-6">
        {isVerification ? (
          <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {item.query}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isVerification 
                ? "bg-secondary/10 text-secondary"
                : "bg-primary/10 text-primary"
            )}>
              {isVerification ? 'Verified' : 'Search'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(item.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryItemCard;
