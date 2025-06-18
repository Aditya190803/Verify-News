
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchDuckDuckGo, extractNewsFromSearch } from '../utils/searchUtils';
import { verifyNewsWithGemini, getMockVerificationResult } from '../utils/geminiApi';
import { 
  saveVerificationToUserHistory, 
  saveVerificationToCollection, 
  saveSearchToHistory, 
  saveVerificationToHistory 
} from '../services/firebaseService';
import { refreshSearchHistoryGlobally } from '../components/SearchHistory';
import { NewsArticle, VerificationResult, VerificationStatus } from '@/types/news';

export const useNewsState = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newsContent, setNewsContent] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const searchNews = async (query: string) => {
    try {
      setStatus('searching');
      setSearchQuery(query);
      
      // Search DuckDuckGo
      const searchResults = await searchDuckDuckGo(query);
      
      // Extract news articles
      const extractedArticles = extractNewsFromSearch(searchResults, query);
      
      if (extractedArticles.length === 0) {
        throw new Error("No news articles found for this query");
      }
      
      setArticles(extractedArticles);
      
      // Select the first article by default
      setSelectedArticle(extractedArticles[0]);
      setNewsContent(extractedArticles[0].snippet);
        // Save search to history if user is logged in
      if (currentUser) {
        await saveSearchToHistory(currentUser.uid, query, extractedArticles[0]);
        // Refresh the search history UI
        refreshSearchHistoryGlobally();
      }
      
      setStatus('idle');
    } catch (error) {
      console.error('Error searching news:', error);
      setStatus('error');
    }
  };

  const verifyNews = async () => {
    try {
      setStatus('verifying');

      // Check if news content is empty
      if (!newsContent.trim()) {
        throw new Error("News content cannot be empty");
      }

      // Try to verify with Gemini API
      try {
        let parsedResult = await verifyNewsWithGemini(
          newsContent, 
          searchQuery, 
          selectedArticle?.url
        );
        
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
        
        // Determine verification type
        const isUrl = newsContent.trim().match(/^https?:\/\/.+/);
        const verificationType = isUrl ? 'url' : 'text';
        
        // Navigate to results page
        navigate(`/results?q=${encodeURIComponent(searchQuery || newsContent)}&type=${verificationType}`);
        
        // Save to Firebase
        if (currentUser) {
          await saveVerificationToUserHistory(
            currentUser.uid,
            searchQuery,
            newsContent,
            parsedResult,
            selectedArticle
          );
            // Also save to search history
          await saveVerificationToHistory(
            currentUser.uid,
            searchQuery,
            newsContent,
            parsedResult,
            selectedArticle
          );
          // Refresh the search history UI
          refreshSearchHistoryGlobally();
        }
        
        await saveVerificationToCollection(
          searchQuery,
          newsContent,
          parsedResult,
          currentUser?.uid || 'anonymous',
          selectedArticle
        );
        
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        
        // Fall back to mock data if API call fails
        console.log("Falling back to mock verification data");
        
        // Mock verification logic as fallback
        const mockResults = getMockVerificationResult(selectedArticle?.url);        setResult(mockResults);
        setStatus('verified');
        
        // Determine verification type
        const isUrl = newsContent.trim().match(/^https?:\/\/.+/);
        const verificationType = isUrl ? 'url' : 'text';
        
        // Navigate to results page
        navigate(`/results?q=${encodeURIComponent(searchQuery || newsContent)}&type=${verificationType}`);

        // Save the mock result to Firebase
        try {
          if (currentUser) {
            await saveVerificationToUserHistory(
              currentUser.uid,
              searchQuery,
              newsContent,
              mockResults,
              selectedArticle
            );
          }
          
          await saveVerificationToCollection(
            searchQuery,
            newsContent,
            mockResults,
            currentUser?.uid || 'anonymous',
            selectedArticle
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
    setSearchQuery('');
    setNewsContent('');
    setResult(null);
    setStatus('idle');
    setArticles([]);
    setSelectedArticle(null);
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
  };
};
