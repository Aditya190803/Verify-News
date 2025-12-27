import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyWithFallback, verifyMediaWithGemini } from '@/services/aiProviders';
import { comprehensiveNewsSearch } from '@/utils/searchUtils';
import {
  saveVerificationToCollection,
  saveVerificationToHistory
} from '@/services/appwrite';
import { getLLMGeneratedTitle } from '@/utils/llmHelpers';
import { handleAppwriteError, handleAIError } from '@/utils/errorHandling';
import { VerificationResult, VerificationStatus, NewsArticle, MediaFile, SearchResponse } from '@/types/news';
import { logger } from '@/lib/logger';
import { searchResultsCache, verificationTextCache } from '@/lib/verificationCache';

/**
 * Creates a fallback verification result when all providers fail
 *
 * @param errorMessage The error message to include in the explanation
 * @param articleUrl Optional URL of the original article to include as a source
 * @returns A fallback VerificationResult object
 */
function createFallbackResult(errorMessage: string, articleUrl?: string): VerificationResult {
  return {
    veracity: 'unverified',
    confidence: 0,
    explanation: `⚠️ Verification failed: ${errorMessage}. Please try again later or verify manually.`,
    sources: articleUrl ? [{ name: "Original Article", url: articleUrl }] : []
  };
}

interface UseVerificationProps {
  userId?: string;
  refreshHistory: () => void;
  onStatusChange: (status: VerificationStatus) => void;
  onResultReady: (result: VerificationResult) => void;
}

export const useVerification = ({ userId, refreshHistory, onStatusChange, onResultReady }: UseVerificationProps) => {
  const navigate = useNavigate();
  
  // Create a memoized version of comprehensiveNewsSearch to avoid duplicate API calls
  const searchCacheRef = useRef<Record<string, Promise<SearchResponse[]>>>({});
  
  // Memoized search to avoid duplicate API calls for the same content
  const memoizedComprehensiveNewsSearch = useCallback(async (content: string, statusCallback?: (status: string) => void): Promise<SearchResponse[]> => {
    const cacheKey = content.trim();
    
    // Check if we already have a pending request for this content
    if (await searchCacheRef.current[cacheKey]) {
      logger.debug('Returning pending search promise for duplicate request');
      return searchCacheRef.current[cacheKey];
    }
    
    // Check cache first
    const cachedResult = searchResultsCache.get<SearchResponse[]>(cacheKey);
    if (cachedResult) {
      logger.debug('Returning cached search results');
      return cachedResult;
    }
    
    // Create a new promise for this search
    const searchPromise = comprehensiveNewsSearch(cacheKey, statusCallback)
      .then(results => {
        // Cache the results
        searchResultsCache.set(cacheKey, results);
        // Clean up the pending promise
        delete searchCacheRef.current[cacheKey];
        return results;
      })
      .catch(error => {
        // Clean up the pending promise on error
        delete searchCacheRef.current[cacheKey];
        throw error;
      });
    
    // Store the promise to handle duplicate requests
    searchCacheRef.current[cacheKey] = searchPromise;
    
    return searchPromise;
  }, []);

  const generateSlug = () => Math.random().toString(36).substring(2, 15);

  const verifyNews = useCallback(async (
    content: string, 
    query: string, 
    selectedArticle?: NewsArticle | null,
    forcedSlug?: string,
    forcedTitle?: string
  ) => {
    try {
      onStatusChange('verifying');

      if (!content.trim()) {
        throw new Error("Please provide news content to verify");
      }

      // Check cache first for verification results
      const cacheKey = content.trim().toLowerCase();
      const cachedVerification = verificationTextCache.get<VerificationResult>(cacheKey, 'verification');
      
      if (cachedVerification) {
        logger.info('Returning cached verification result');
        
        // Still add selected article source if needed
        if (selectedArticle?.url) {
          const articleUrlExists = cachedVerification.sources.some(s => s.url === selectedArticle.url);
          if (!articleUrlExists) {
            cachedVerification.sources.unshift({
              name: selectedArticle.title || "Original Article",
              url: selectedArticle.url
            });
          }
        }
        
        onResultReady(cachedVerification);
        onStatusChange('verified');
        
        const slug = forcedSlug || generateSlug();
        const llmTitle = forcedTitle || await getLLMGeneratedTitle(content || query);
        
        if (userId) {
          try {
            await saveVerificationToHistory(userId, query, cachedVerification, selectedArticle || null, slug, llmTitle);
            refreshHistory();
          } catch (appwriteError) {
            handleAppwriteError(appwriteError, 'verification save');
          }
        }
        
        await saveVerificationToCollection(query, content, cachedVerification, userId || 'anonymous', selectedArticle || null, slug, llmTitle);
        navigate(`/result/${slug}`);
        return;
      }

      let currentSearchResults = [];
      try {
        currentSearchResults = await memoizedComprehensiveNewsSearch(content || query, (status) => {
          onStatusChange(status as VerificationStatus);
        });
      } catch (searchError) {
        logger.warn("Could not fetch current search results:", searchError);
        currentSearchResults = [{
          value: [{
            title: "Search Error",
            snippet: `Search for "${content || query}" - Unable to fetch real-time results.`,
            url: ""
          }]
        }];
      }

      try {
        const parsedResult = await verifyWithFallback(
          content, 
          currentSearchResults
        );
        
        // Cache the verification result
        verificationTextCache.set(cacheKey, parsedResult, 'verification');
        logger.info('Cached verification result for future requests');
        
        if (selectedArticle?.url) {
          const articleUrlExists = parsedResult.sources.some(s => s.url === selectedArticle.url);
          if (!articleUrlExists) {
            parsedResult.sources.unshift({
              name: selectedArticle.title || "Original Article",
              url: selectedArticle.url
            });
          }
        }

        onResultReady(parsedResult);
        onStatusChange('verified');
        
        const slug = forcedSlug || generateSlug();
        const llmTitle = forcedTitle || await getLLMGeneratedTitle(content || query);
        
        if (userId) {
          try {
            await saveVerificationToHistory(userId, query, parsedResult, selectedArticle || null, slug, llmTitle);
            refreshHistory();
          } catch (appwriteError) {
            handleAppwriteError(appwriteError, 'verification save');
          }
        }
        
        await saveVerificationToCollection(query, content, parsedResult, userId || 'anonymous', selectedArticle || null, slug, llmTitle);
        navigate(`/result/${slug}`);
        
      } catch (error) {
        const errorMessage = handleAIError(error);
        
        // Fallback result if all providers fail
        const fallbackResult = createFallbackResult(errorMessage, selectedArticle?.url);
        
        onResultReady(fallbackResult);
        onStatusChange('verified');
        
        const slug = forcedSlug || generateSlug();
        navigate(`/result/${slug}`);
      }
    } catch (error) {
      logger.error('Verification failed:', error);
      onStatusChange('error');
      throw error;
    }
  }, [userId, refreshHistory, onStatusChange, onResultReady, navigate, memoizedComprehensiveNewsSearch]);

  const verifyMedia = useCallback(async (mediaFile: MediaFile, query?: string, forcedSlug?: string, forcedTitle?: string) => {
    try {
      onStatusChange('verifying');
      const slug = forcedSlug || generateSlug();
      const llmTitle = forcedTitle || query || `Media Verification ${new Date().toLocaleDateString()}`;
      
      const result = await verifyMediaWithGemini(mediaFile, query);
      onResultReady(result);
      onStatusChange('verified');
      
      if (userId) {
        try {
          await saveVerificationToHistory(userId, query || 'Media upload', result, null, slug, llmTitle);
          refreshHistory();
        } catch (e) {
          handleAppwriteError(e, 'media verification save');
        }
      }
      
      await saveVerificationToCollection(query || 'Media upload', 'Media content', result, userId || 'anonymous', null, slug, llmTitle, mediaFile);
      navigate(`/result/${slug}`);
    } catch (error) {
      logger.error('Media verification failed:', error);
      onStatusChange('error');
      throw error;
    }
  }, [userId, refreshHistory, onStatusChange, onResultReady, navigate]);

  return { verifyNews, verifyMedia };
};
