import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNewsState } from './useNewsState';
import React from 'react';

// Mock all dependencies
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
  }),
}));

vi.mock('../context/SearchHistoryContext', () => ({
  useSearchHistoryContext: () => ({
    refreshSearchHistory: vi.fn(),
  }),
}));

vi.mock('../utils/searchUtils', () => ({
  searchLangSearch: vi.fn(),
  extractNewsFromSearch: vi.fn().mockReturnValue([]),
  comprehensiveNewsSearch: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/aiProviders', () => ({
  verifyWithFallback: vi.fn().mockResolvedValue({
    veracity: 'true',
    confidence: 85,
    explanation: 'Test explanation',
    sources: [],
    provider: 'Groq'
  }),
  verifyMediaWithGemini: vi.fn().mockResolvedValue({
    veracity: 'true',
    confidence: 80,
    explanation: 'Media verified',
    sources: [],
    provider: 'Gemini'
  }),
  rankSearchResultsWithFallback: vi.fn().mockImplementation((_, results) => Promise.resolve(results)),
  generateTitleWithFallback: vi.fn().mockResolvedValue('Test Title'),
  fileToBase64: vi.fn().mockResolvedValue('base64data'),
  getMediaTypeFromMime: vi.fn().mockReturnValue('image')
}));

vi.mock('../services/appwriteService', () => ({
  saveVerificationToCollection: vi.fn(),
  saveSearchToHistory: vi.fn(),
  saveVerificationToHistory: vi.fn(),
}));

vi.mock('@/utils/llmHelpers', () => ({
  getLLMGeneratedTitle: vi.fn().mockResolvedValue('Test Title'),
}));

vi.mock('@/utils/errorHandling', () => ({
  handleAppwriteError: vi.fn(),
  handleGeminiError: vi.fn().mockReturnValue('Error occurred'),
}));

vi.mock('@/lib/sanitize', () => ({
  sanitizeNewsContent: vi.fn((s) => s),
  sanitizeSearchQuery: vi.fn((s) => s),
  sanitizeUrl: vi.fn((s) => s),
}));

// Wrapper component for hooks that need router
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(BrowserRouter, null, children);
};

describe('useNewsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.newsContent).toBe('');
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.articles).toEqual([]);
    expect(result.current.selectedArticle).toBeNull();
    expect(result.current.mediaFile).toBeNull();
  });

  it('updates searchQuery', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    act(() => {
      result.current.setSearchQuery('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
  });

  it('updates newsContent', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    act(() => {
      result.current.setNewsContent('test content');
    });

    expect(result.current.newsContent).toBe('test content');
  });

  it('updates status', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    act(() => {
      result.current.setStatus('verifying');
    });

    expect(result.current.status).toBe('verifying');
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    // Set some values first
    act(() => {
      result.current.setSearchQuery('test query');
      result.current.setNewsContent('test content');
      result.current.setStatus('verified');
    });

    // Then reset
    act(() => {
      result.current.resetState();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.newsContent).toBe('');
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.articles).toEqual([]);
    expect(result.current.selectedArticle).toBeNull();
    expect(result.current.mediaFile).toBeNull();
  });

  it('updates articles array', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    const testArticles = [
      { title: 'Article 1', snippet: 'Snippet 1', url: 'http://example.com/1' },
      { title: 'Article 2', snippet: 'Snippet 2', url: 'http://example.com/2' },
    ];

    act(() => {
      result.current.setArticles(testArticles);
    });

    expect(result.current.articles).toEqual(testArticles);
    expect(result.current.articles).toHaveLength(2);
  });

  it('updates selectedArticle', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    const testArticle = { title: 'Test', snippet: 'Test snippet', url: 'http://example.com' };

    act(() => {
      result.current.setSelectedArticle(testArticle);
    });

    expect(result.current.selectedArticle).toEqual(testArticle);
  });

  it('updates mediaFile', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    const testMediaFile = {
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      type: 'image' as const,
      mimeType: 'image/jpeg',
    };

    act(() => {
      result.current.setMediaFile(testMediaFile);
    });

    expect(result.current.mediaFile).toEqual(testMediaFile);
  });

  it('updates result', () => {
    const { result } = renderHook(() => useNewsState(), { wrapper });

    const testResult = {
      veracity: 'true' as const,
      confidence: 90,
      explanation: 'Test explanation',
      sources: [{ name: 'Test Source', url: 'http://example.com' }],
    };

    act(() => {
      result.current.setResult(testResult);
    });

    expect(result.current.result).toEqual(testResult);
  });
});
