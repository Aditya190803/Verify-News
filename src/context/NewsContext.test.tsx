import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsProvider, useNews } from './NewsContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the hooks and services
vi.mock('../hooks/useNewsState', () => ({
  useNewsState: () => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    newsContent: '',
    setNewsContent: vi.fn(),
    status: 'idle',
    setStatus: vi.fn(),
    result: null,
    setResult: vi.fn(),
    articles: [],
    setArticles: vi.fn(),
    selectedArticle: null,
    setSelectedArticle: vi.fn(),
    mediaFile: null,
    setMediaFile: vi.fn(),
    searchNews: vi.fn(),
    verifyNews: vi.fn(),
    resetState: vi.fn(),
    handleUnifiedInput: vi.fn(),
  }),
}));

vi.mock('./AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    currentUser: null,
    loading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    socialLogin: vi.fn(),
    resetPassword: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock('./SearchHistoryContext', () => ({
  SearchHistoryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSearchHistoryContext: () => ({
    searchHistory: [],
    loading: false,
    refreshSearchHistory: vi.fn(),
    deleteHistoryItem: vi.fn(),
    clearHistory: vi.fn(),
  }),
}));

// Test component to consume the context
const TestConsumer = () => {
  const { status, searchQuery, newsContent, articles } = useNews();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="searchQuery">{searchQuery}</span>
      <span data-testid="newsContent">{newsContent}</span>
      <span data-testid="articlesCount">{articles.length}</span>
    </div>
  );
};

describe('NewsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default values', () => {
    render(
      <BrowserRouter>
        <NewsProvider>
          <TestConsumer />
        </NewsProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('searchQuery')).toHaveTextContent('');
    expect(screen.getByTestId('newsContent')).toHaveTextContent('');
    expect(screen.getByTestId('articlesCount')).toHaveTextContent('0');
  });

  it('throws error when useNews is called outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useNews must be used within a NewsProvider');
    
    consoleError.mockRestore();
  });

  it('has proper display name', () => {
    expect(NewsProvider.displayName).toBe('NewsProvider');
  });
});
