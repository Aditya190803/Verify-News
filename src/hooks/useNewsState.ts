import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchHistoryContext } from '../context/SearchHistoryContext';
import { getLLMGeneratedTitle } from '@/utils/llmHelpers';
import { NewsArticle, VerificationResult, VerificationStatus, MediaFile } from '@/types/news';
import { useSearch } from './useSearch';
import { useVerification } from './useVerification';
import { urlExtractor, extractHeadlineFromUrl } from '@/utils/urlExtractor';

/**
 * useNewsState - Core state management hook for news verification workflow
 * 
 * This hook orchestrates the entire news verification process, managing:
 * - Search queries and results
 * - Verification status and results
 * - Article selection
 * - Media file handling
 * 
 * ## State Flow
 * 
 * 1. **Idle State**: Initial state, waiting for user input
 * 2. **Searching**: When user submits a query, searches for related articles
 * 3. **Ranking**: AI ranks search results by relevance (optional)
 * 4. **Verifying**: AI analyzes content for truthfulness
 * 5. **Verified**: Results available, verification complete
 * 6. **Error**: Something went wrong during the process
 * 
 * ## Unified Input Handling
 * 
 * The `handleUnifiedInput` function intelligently handles different input types:
 * - **URLs**: Extracts headline and verifies the article
 * - **Text with URLs**: Searches for related articles, then verifies
 * - **Plain text**: Directly verifies the claim
 * - **Media files**: Processes images/audio/video for verification
 * 
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   status,
 *   result,
 *   handleUnifiedInput,
 *   resetState
 * } = useNewsState();
 * 
 * // Handle user input
 * const slug = await handleUnifiedInput("Is climate change real?");
 * 
 * // Navigate to results
 * navigate(`/result/${slug}`);
 * ```
 * 
 * @returns {NewsContextType} State and functions for news verification
 */
export function useNewsState() {
  // Core state for the verification workflow
  const [newsContent, setNewsContent] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  
  // Auth and history context for user-specific features
  const { currentUser } = useAuth();
  const { refreshSearchHistory } = useSearchHistoryContext();

  /**
   * Search hook - handles news article search
   * Automatically updates status and stores results
   */
  const { searchQuery, setSearchQuery, searchNews } = useSearch({
    userId: currentUser?.uid,
    onSearchStart: () => setStatus('searching'),
    onSearchEnd: (newArticles) => {
      setArticles(newArticles);
      setSelectedArticle(newArticles[0]);
      setNewsContent(newArticles[0].snippet);
      setStatus('idle');
    },
    onSearchError: () => setStatus('error'),
    refreshHistory: refreshSearchHistory
  });

  /**
   * Verification hook - handles AI-powered fact-checking
   * Supports both text and media verification
   */
  const { verifyNews, verifyMedia } = useVerification({
    userId: currentUser?.uid,
    refreshHistory: refreshSearchHistory,
    onStatusChange: setStatus,
    onResultReady: setResult
  });

  /**
   * Reset all state to initial values
   * Call this when starting a new verification or clearing the form
   */
  const resetState = useCallback(() => {
    setSearchQuery('');
    setNewsContent('');
    setStatus('idle');
    setResult(null);
    setArticles([]);
    setSelectedArticle(null);
    setMediaFile(null);
  }, [setSearchQuery]);

  /**
   * Handle unified input - intelligently processes different input types
   * 
   * @param value - The text input (claim, URL, or mixed content)
   * @param media - Optional media file for image/audio/video verification
   * @returns The slug for the verification result page
   */
  const handleUnifiedInput = async (value: string, media?: MediaFile) => {
    if (!value.trim() && !media) return;

    // Generate unique slug and title for this verification
    const slug = Math.random().toString(36).substring(2, 15);
    const llmTitle = await getLLMGeneratedTitle(value || 'Media Verification');

    // Handle media verification (images, audio, video)
    if (media) {
      await verifyMedia(media, value, slug, llmTitle);
      return slug;
    }

    // Extract URLs from the input
    const extractedUrls = urlExtractor(value);
    const isOnlyUrl = extractedUrls.length === 1 && extractedUrls[0] === value.trim();

    if (isOnlyUrl) {
      // Input is a single URL - extract headline and verify
      setStatus('verifying');
      const url = extractedUrls[0];
      const title = await extractHeadlineFromUrl(url);
      await verifyNews(title || url, url, null, slug, llmTitle);
    } else if (extractedUrls.length > 0) {
      // Input contains URLs with text - search for articles first
      const searchResults = await searchNews(value, slug, llmTitle);
      if (searchResults && searchResults.length > 0) {
        await verifyNews(searchResults[0].snippet, value, searchResults[0], slug, llmTitle);
      }
    } else {
      // Plain text claim - verify directly
      await verifyNews(value, value, null, slug, llmTitle);
    }
    
    return slug;
  };

  return {
    searchQuery,
    setSearchQuery,
    newsContent,
    setNewsContent,
    status,
    setStatus,
    result,
    setResult,
    articles,
    setArticles,
    selectedArticle,
    setSelectedArticle,
    mediaFile,
    setMediaFile,
    searchNews,
    verifyNews: () => verifyNews(newsContent, searchQuery, selectedArticle),
    resetState,
    handleUnifiedInput,
  };
}
