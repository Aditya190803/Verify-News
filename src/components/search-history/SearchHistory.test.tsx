import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchHistoryItemCard } from './SearchHistoryItemCard';
import { SearchHistoryEmptyState } from './SearchHistoryEmptyState';
import { SearchHistoryFilters, HistoryFilterType } from './SearchHistoryFilters';
import { SearchHistoryHeader } from './SearchHistoryHeader';
import { SearchHistoryLoading } from './SearchHistoryLoading';

// ========================================
// SearchHistoryItemCard Tests
// ========================================
describe('SearchHistoryItemCard', () => {
  const mockItem = {
    id: 'item1',
    query: 'Test query for verification',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    resultType: 'verification' as const,
    slug: 'testslug',
    userId: 'user123',
  };

  const defaultProps = {
    item: mockItem,
    index: 0,
    deletingId: null,
    onItemClick: vi.fn(),
    onDeleteItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the query text', () => {
    render(<SearchHistoryItemCard {...defaultProps} />);
    expect(screen.getByText('Test query for verification')).toBeInTheDocument();
  });

  it('shows verification badge for verification items', () => {
    render(<SearchHistoryItemCard {...defaultProps} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('shows search badge for search items', () => {
    const searchItem = { ...mockItem, resultType: 'search' as const };
    render(<SearchHistoryItemCard {...defaultProps} item={searchItem} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('shows time ago format', () => {
    render(<SearchHistoryItemCard {...defaultProps} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('calls onItemClick when clicked', async () => {
    const user = userEvent.setup();
    render(<SearchHistoryItemCard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /verification: test query/i }));
    
    expect(defaultProps.onItemClick).toHaveBeenCalledWith(mockItem);
  });

  it('calls onItemClick on Enter key', async () => {
    const user = userEvent.setup();
    render(<SearchHistoryItemCard {...defaultProps} />);
    
    const card = screen.getByRole('button', { name: /verification: test query/i });
    card.focus();
    await user.keyboard('{Enter}');
    
    expect(defaultProps.onItemClick).toHaveBeenCalledWith(mockItem);
  });

  it('shows delete button on hover', () => {
    render(<SearchHistoryItemCard {...defaultProps} />);
    // The delete button should exist but be hidden by CSS
    expect(screen.getByRole('button', { name: /delete this item/i })).toBeInTheDocument();
  });

  it('calls onDeleteItem when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchHistoryItemCard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /delete this item/i }));
    
    expect(defaultProps.onDeleteItem).toHaveBeenCalled();
  });

  it('shows loading spinner when deleting', () => {
    render(<SearchHistoryItemCard {...defaultProps} deletingId="item1" />);
    
    const deleteButton = screen.getByRole('button', { name: /delete this item/i });
    expect(deleteButton).toBeDisabled();
  });

  it('formats "Just now" for recent items', () => {
    const recentItem = { 
      ...mockItem, 
      timestamp: new Date().toISOString() 
    };
    render(<SearchHistoryItemCard {...defaultProps} item={recentItem} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('formats days ago correctly', () => {
    const twoDaysAgo = { 
      ...mockItem, 
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
    };
    render(<SearchHistoryItemCard {...defaultProps} item={twoDaysAgo} />);
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });
});

// ========================================
// SearchHistoryEmptyState Tests
// ========================================
describe('SearchHistoryEmptyState', () => {
  it('renders not-logged-in state correctly', () => {
    render(<SearchHistoryEmptyState type="not-logged-in" />);
    
    expect(screen.getByText('Search history')).toBeInTheDocument();
    expect(screen.getByText('Sign in to save your history')).toBeInTheDocument();
  });

  it('renders no-history state correctly', () => {
    render(<SearchHistoryEmptyState type="no-history" />);
    
    expect(screen.getByText('No history yet')).toBeInTheDocument();
    expect(screen.getByText('Your searches will appear here')).toBeInTheDocument();
  });

  it('renders no-matches state correctly', () => {
    render(<SearchHistoryEmptyState type="no-matches" />);
    
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('shows clear filters button when provided', async () => {
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    
    render(<SearchHistoryEmptyState type="no-matches" onClearFilters={onClearFilters} />);
    
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);
    
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('shows close button when showCloseButton is true', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SearchHistoryEmptyState 
        type="not-logged-in" 
        showCloseButton 
        onClose={onClose} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('returns null for unknown type', () => {
    // @ts-expect-error - Testing invalid type
    const { container } = render(<SearchHistoryEmptyState type="unknown" />);
    expect(container.firstChild).toBeNull();
  });
});

// ========================================
// SearchHistoryFilters Tests
// ========================================
describe('SearchHistoryFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    typeFilter: 'all' as HistoryFilterType,
    onTypeFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<SearchHistoryFilters {...defaultProps} />);
    
    expect(screen.getByRole('textbox', { name: /search history/i })).toBeInTheDocument();
  });

  it('renders type filter dropdown', () => {
    render(<SearchHistoryFilters {...defaultProps} />);
    
    expect(screen.getByRole('combobox', { name: /filter by type/i })).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const user = userEvent.setup();
    render(<SearchHistoryFilters {...defaultProps} />);
    
    const searchInput = screen.getByRole('textbox', { name: /search history/i });
    await user.type(searchInput, 'test');
    
    expect(defaultProps.onSearchChange).toHaveBeenCalled();
  });

  it('displays current search query value', () => {
    render(<SearchHistoryFilters {...defaultProps} searchQuery="existing query" />);
    
    const searchInput = screen.getByRole('textbox', { name: /search history/i });
    expect(searchInput).toHaveValue('existing query');
  });
});

// ========================================
// SearchHistoryHeader Tests
// ========================================
describe('SearchHistoryHeader', () => {
  const defaultProps = {
    historyCount: 10,
    filteredCount: 8,
    totalCount: 10,
    loading: false,
    onRefresh: vi.fn(),
    onClearAll: vi.fn(),
    onClose: vi.fn(),
    showCloseButton: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    render(<SearchHistoryHeader {...defaultProps} />);
    
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('shows filtered count in parentheses', () => {
    render(<SearchHistoryHeader {...defaultProps} />);
    
    expect(screen.getByText('(8)')).toBeInTheDocument();
  });

  it('hides count when no history', () => {
    render(<SearchHistoryHeader {...defaultProps} historyCount={0} />);
    
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('renders refresh button when history exists', () => {
    render(<SearchHistoryHeader {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /refresh history/i })).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchHistoryHeader {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /refresh history/i }));
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  it('disables refresh button while loading', () => {
    render(<SearchHistoryHeader {...defaultProps} loading />);
    
    expect(screen.getByRole('button', { name: /refresh history/i })).toBeDisabled();
  });

  it('renders clear all button when history exists', () => {
    render(<SearchHistoryHeader {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /clear all history/i })).toBeInTheDocument();
  });

  it('shows close button when showCloseButton is true', () => {
    render(<SearchHistoryHeader {...defaultProps} showCloseButton />);
    
    expect(screen.getByRole('button', { name: /close history panel/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchHistoryHeader {...defaultProps} showCloseButton />);
    
    await user.click(screen.getByRole('button', { name: /close history panel/i }));
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('hides action buttons when no history', () => {
    render(<SearchHistoryHeader {...defaultProps} historyCount={0} />);
    
    expect(screen.queryByRole('button', { name: /refresh history/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear all history/i })).not.toBeInTheDocument();
  });
});

// ========================================
// SearchHistoryLoading Tests
// ========================================
describe('SearchHistoryLoading', () => {
  it('renders loading skeletons', () => {
    render(<SearchHistoryLoading />);
    
    // Should render multiple skeleton items
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
