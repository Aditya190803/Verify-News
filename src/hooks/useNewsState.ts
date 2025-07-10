
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearchHistoryContext } from '../context/SearchHistoryContext';
import { searchLangSearch, extractNewsFromSearch, comprehensiveNewsSearch } from '../utils/searchUtils';
import { verifyNewsWithGemini, getMockVerificationResult } from '../utils/geminiApi';
import { 
  saveVerificationToUserHistory, 
  saveVerificationToCollection, 
  saveSearchToHistory, 
  saveVerificationToHistory 
} from '../services/firebaseService';
import { getLLMGeneratedTitle } from '@/utils/llmHelpers';
import { handleFirebaseError, handleGeminiError } from '@/utils/errorHandling';
import { NewsArticle, VerificationResult, VerificationStatus } from '@/types/news';

export function useNewsState() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newsContent, setNewsContent] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const { currentUser } = useAuth();
  const { refreshSearchHistory } = useSearchHistoryContext();
  const navigate = useNavigate();

  // Store user email in localStorage for Firestore history
  useEffect(() => {
    if (currentUser && currentUser.email) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('userEmail', currentUser.email);
      }
    }
  }, [currentUser]);
  const searchNews = async (query: string, slug?: string, title?: string) => {
    try {
      setStatus('searching');
      setSearchQuery(query);
      
      // Use comprehensive search with LLM keyword extraction
      const searchResults = await comprehensiveNewsSearch(query);
      
      // Extract and combine articles from all search results
      let allExtractedArticles: NewsArticle[] = [];
      
      searchResults.forEach(result => {
        const articles = extractNewsFromSearch(result, query);
        allExtractedArticles.push(...articles);
      });
      
      // Remove duplicates and sort by relevance
      const uniqueArticles = allExtractedArticles.filter((article, index, arr) => 
        index === arr.findIndex(a => a.url === article.url && a.title === article.title)
      );
      
      if (uniqueArticles.length === 0) {
        throw new Error("No news articles found for this query");
      }
      
      setArticles(uniqueArticles.slice(0, 15)); // Limit to top 15 articles
      
      // Select the first article by default
      setSelectedArticle(uniqueArticles[0]);
      setNewsContent(uniqueArticles[0].snippet);
        // Save search to history if user is logged in
      if (currentUser) {
        await saveSearchToHistory(currentUser.uid, query, uniqueArticles[0], slug, title);
        // Refresh the search history UI
        refreshSearchHistory();
      }
      
      setStatus('idle');
      return uniqueArticles; // Return the articles for use in handleUnifiedInput
    } catch (error) {
      console.error('Error searching news:', error);
      setStatus('error');
      throw error; // Re-throw so handleUnifiedInput can catch it
    }
  };

  const verifyNews = async () => {
    try {
      setStatus('verifying');

      // Check if news content is empty
      if (!newsContent.trim()) {
        throw new Error("Please provide news content to verify");
      }

      console.log("🔍 Starting news verification process...");

      // Perform real-time search to get current information
      let currentSearchResults = [];
      try {
        console.log("🌐 Searching for current information...");
        currentSearchResults = await comprehensiveNewsSearch(newsContent || searchQuery);
        console.log(`✅ Found ${currentSearchResults.length} search results for verification`);
      } catch (searchError) {
        console.warn("⚠️ Could not fetch current search results:", searchError);
        // Continue with verification even if search fails - just inform Gemini about the limitation
        currentSearchResults = [{
          RelatedTopics: [{
            Text: `Search for "${newsContent || searchQuery}" - Unable to fetch real-time results due to connectivity issues. Please rely on your training data and note this limitation in your response.`
          }]
        }];
      }

      // Try to verify with Gemini API
      try {
        let parsedResult = await verifyNewsWithGemini(
          newsContent, 
          searchQuery, 
          selectedArticle?.url,
          currentSearchResults
        );
        
        console.log("✅ Gemini verification completed successfully");
        
        // Ensure the article URL is included as a source if not already present
        if (selectedArticle?.url) {
          const articleUrlExists = parsedResult.sources.some(
            (source: { url: string }) => source.url === selectedArticle.url
          );
          
          if (!articleUrlExists) {
            parsedResult.sources.unshift({
              name: selectedArticle.title || "Original Article",
              url: selectedArticle.url
            });
          }
        }        // Set the verification result
        setResult(parsedResult);
        setStatus('verified');
        
        // Generate slug for the verification
        const slug = generateSlug();
        const llmTitle = await getLLMGeneratedTitle(newsContent || searchQuery);
        
        // Save to Firebase with error handling
        try {
          if (currentUser) {
            await saveVerificationToUserHistory(
              currentUser.uid,
              searchQuery,
              newsContent,
              parsedResult,
              selectedArticle,
              slug,
              llmTitle
            );
              // Also save to search history
            await saveVerificationToHistory(
              currentUser.uid,
              searchQuery,
              newsContent,
              parsedResult,
              selectedArticle,
              slug,
              llmTitle
            );
            // Refresh the search history UI
            refreshSearchHistory();
          }
          
          await saveVerificationToCollection(
            searchQuery,
            newsContent,
            parsedResult,
            currentUser?.uid || 'anonymous',
            selectedArticle,
            slug,
            llmTitle
          );
        } catch (firebaseError) {
          handleFirebaseError(firebaseError, 'verification save');
          // Continue without throwing - verification result is still valid
        }
        
        // Navigate to result page with slug
        navigate(`/result/${slug}`);
        
      } catch (error) {
        console.error("🚨 Gemini API verification failed:", error);
        
        // Get user-friendly error message
        const errorMessage = handleGeminiError(error);
        
        console.log(`⚠️ USING FALLBACK VERIFICATION - ${errorMessage}`);
        
        // Mock verification logic as fallback
        const mockResults = getMockVerificationResult(selectedArticle?.url);
        mockResults.explanation = `⚠️ This is a demo result. Real verification temporarily unavailable (${errorMessage}). Please verify this information through multiple trusted news sources.`;
        setResult(mockResults);
        setStatus('verified');
        
        // Generate slug for the mock verification
        const slug = generateSlug();
        const llmTitle = await getLLMGeneratedTitle(newsContent || searchQuery);
        
        // Navigate to result page with slug
        navigate(`/result/${slug}`);

        // Save the mock result to Firebase
        try {
          if (currentUser) {
            await saveVerificationToUserHistory(
              currentUser.uid,
              searchQuery,
              newsContent,
              mockResults,
              selectedArticle,
              slug,
              llmTitle
            );
          }
          
          await saveVerificationToCollection(
            searchQuery,
            newsContent,
            mockResults,
            currentUser?.uid || 'anonymous',
            selectedArticle,
            slug,
            llmTitle
          );
        } catch (firestoreError) {
          console.error('Error saving verification to Firestore:', firestoreError);
        }
      }
    } catch (error) {
      console.error('Error verifying news:', error);
      setStatus('error');
    }
  };

  const resetState = () => {
    console.log('🔄 Resetting news state...');
    setSearchQuery('');
    setNewsContent('');
    setResult(null);
    setStatus('idle');
    setArticles([]);
    setSelectedArticle(null);
    console.log('✅ News state reset complete');
  };

  // Helper to generate a unique 8-char alphanumeric slug
  function generateSlug() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  // Unified handler for all input types, always saves with a slug
  const handleUnifiedInput = async (input: string) => {
    const value = input.trim();
    if (!value) return;
    const slug = generateSlug();
    const llmTitle = await getLLMGeneratedTitle(value);
    // URL detection
    if (/^https?:\/\//.test(value)) {
      // Directly verify the URL
      setStatus('verifying');
      let verificationResult;
      try {
        // Get current search results for URL verification
        const searchResults = await comprehensiveNewsSearch(value);
        verificationResult = await verifyNewsWithGemini(value, value, value, searchResults);
        setResult(verificationResult);
        setStatus('verified');
      } catch (error) {
        setStatus('error');
        verificationResult = getMockVerificationResult();
        setResult(verificationResult);
      }
      setNewsContent(value);
      setSearchQuery(value);
      
      // Save with error handling
      try {
        if (currentUser) {
          await saveVerificationToUserHistory(
            currentUser.uid,
            value,
            value,
            verificationResult,
            null,
            slug,
            llmTitle
          );
          await saveVerificationToHistory(
            currentUser.uid,
            value,
            value,
            verificationResult,
            null,
            slug,
            llmTitle
          );
        }
        await saveVerificationToCollection(
          value,
          value,
          verificationResult,
          currentUser?.uid || 'anonymous',
          null,
          slug,
          llmTitle
        );
      } catch (firebaseError) {
        handleFirebaseError(firebaseError, 'URL verification save');
      }
      
      navigate(`/result/${slug}`);
    } else if (value.length < 80) {
      // Treat as topic: verify the topic directly without searching for news
      setStatus('verifying');
      setSearchQuery(value);
      let verificationResult;
      try {
        // Get current search results for topic verification
        const searchResults = await comprehensiveNewsSearch(value);
        verificationResult = await verifyNewsWithGemini(value, `Topic: ${value}`, undefined, searchResults);
        setResult(verificationResult);
        setStatus('verified');
      } catch (error) {
        setStatus('error');
        verificationResult = getMockVerificationResult();
        setResult(verificationResult);
      }
      setNewsContent(`Topic: ${value}`);
      
      // Save the verification
      if (currentUser) {
        await saveVerificationToUserHistory(
          currentUser.uid,
          value,
          `Topic: ${value}`,
          verificationResult,
          null,
          slug,
          llmTitle
        );
        await saveVerificationToHistory(
          currentUser.uid,
          value,
          `Topic: ${value}`,
          verificationResult,
          null,
          slug,
          llmTitle
        );
        refreshSearchHistory();
      }
      
      // Save to global collection
      await saveVerificationToCollection(
        value,
        `Topic: ${value}`,
        verificationResult,
        currentUser?.uid || 'anonymous',
        null,
        slug,
        llmTitle
      );
      navigate(`/result/${slug}`);
    } else {
      // Treat as pasted news
      setStatus('verifying');
      let verificationResult;
      try {
        // Get current search results for pasted news verification
        const searchResults = await comprehensiveNewsSearch(value);
        verificationResult = await verifyNewsWithGemini(value, value, undefined, searchResults);
        setResult(verificationResult);
        setStatus('verified');
      } catch (error) {
        setStatus('error');
        verificationResult = getMockVerificationResult();
        setResult(verificationResult);
      }
      setNewsContent(value);
      setSearchQuery(value);
      if (currentUser) {
        await saveVerificationToUserHistory(
          currentUser.uid,
          value,
          value,
          verificationResult,
          null,
          slug,
          llmTitle
        );
        await saveVerificationToHistory(
          currentUser.uid,
          value,
          value,
          verificationResult,
          null,
          slug,
          llmTitle
        );
      }
      await saveVerificationToCollection(
        value,
        value,
        verificationResult,
        currentUser?.uid || 'anonymous',
        null,
        slug,
        llmTitle
      );
      navigate(`/result/${slug}`);
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
    searchNews,
    verifyNews,
    resetState,
    handleUnifiedInput,
  };
}
