import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type HistoryFilterType = 'all' | 'search' | 'verification';

interface SearchHistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: HistoryFilterType;
  onTypeFilterChange: (value: HistoryFilterType) => void;
}

/**
 * Filter controls for SearchHistory panel
 * Includes search input and type filter dropdown
 */
export const SearchHistoryFilters: React.FC<SearchHistoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}) => {
  return (
    <div className="space-y-2 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
          aria-label="Search history"
        />
      </div>
      <Select 
        value={typeFilter} 
        onValueChange={(v) => onTypeFilterChange(v as HistoryFilterType)}
      >
        <SelectTrigger className="h-9" aria-label="Filter by type">
          <Filter className="h-3.5 w-3.5 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="verification">Verifications</SelectItem>
          <SelectItem value="search">Searches</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SearchHistoryFilters;
