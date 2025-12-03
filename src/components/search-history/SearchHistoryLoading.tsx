import React from 'react';

interface SearchHistoryLoadingProps {
  itemCount?: number;
}

/**
 * Loading skeleton for SearchHistory panel
 * Displays animated placeholder items while loading
 */
export const SearchHistoryLoading: React.FC<SearchHistoryLoadingProps> = ({
  itemCount = 3,
}) => {
  return (
    <div className="space-y-3" role="status" aria-label="Loading history">
      {Array.from({ length: itemCount }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      ))}
      <span className="sr-only">Loading history items...</span>
    </div>
  );
};

export default SearchHistoryLoading;
