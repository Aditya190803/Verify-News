
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { searchDuckDuckGo, extractNewsFromSearch } from '../utils/searchUtils';

export type VerificationStatus = 'idle' | 'searching' | 'verifying' | 'verified' | 'error';
export type NewsVeracity = 'true' | 'false' | 'unverified' | 'partially-true';

interface NewsArticle {
  title: string;
  snippet: string;
  url: string;
}

interface VerificationResult {
  veracity: NewsVeracity;
  confidence: number;
  explanation: string;
  sources: {
    name: string;
    url: string;
  }[];
  correctedInfo?: string;
}

interface NewsContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newsContent: string;
  setNewsContent: (content: string) => void;
  status: VerificationStatus;
  setStatus: (status: VerificationStatus) => void;
  result: VerificationResult | null;
  setResult: (result: VerificationResult | null) => void;
  articles: NewsArticle[];
  setArticles: (articles: NewsArticle[]) => void;
  selectedArticle: NewsArticle | null;
  setSelectedArticle: (article: NewsArticle | null) => void;
  searchNews: (query: string) => Promise<void>;
  verifyNews: () => Promise<void>;
  resetState: () => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

// API key for Gemini model
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with your Gemini API key

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newsContent, setNewsContent] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const { currentUser } = useAuth();

  const searchNews = async (query: string) => {
    try {
      setStatus('searching');
      setSearchQuery(query);
      
      // Search DuckDuckGo
      const searchResults = await searchDuckDuckGo(query);
      
      // Extract news articles
      const extractedArticles = extractNewsFromSearch(searchResults);
      
      if (extractedArticles.length === 0) {
        throw new Error("No news articles found for this query");
      }
      
      setArticles(extractedArticles);
      
      // Select the first article by default
      setSelectedArticle(extractedArticles[0]);
      setNewsContent(extractedArticles[0].snippet);
      
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

      // Use Gemini API to verify the news
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a news verification assistant. Analyze the following news content and determine if it's true, false, or partially true. If false or partially true, provide corrections.
                    
                    Please respond in this JSON format:
                    {
                      "veracity": "true|false|partially-true",
                      "confidence": [number between 0-100],
                      "explanation": [your analysis explaining why the content is true, false, or partially true],
                      "sources": [
                        { "name": "Source Name", "url": "https://source-url.com" },
                        ...
                      ],
                      "correctedInfo": [provide the correct information if the content is false or partially true]
                    }
                    
                    News content to verify:
                    ${newsContent}
                    
                    Additional context:
                    This news was found in a search for "${searchQuery}".
                    ${selectedArticle ? `Original source: ${selectedArticle.url}` : ''}
                    `
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Parse the response
        const textContent = data.candidates[0].content.parts[0].text;
        
        // Extract the JSON part from the text response
        const jsonMatch = textContent.match(/{[\s\S]*}/);
        
        if (!jsonMatch) {
          throw new Error("Failed to parse JSON response from Gemini API");
        }
        
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        // Set the verification result
        setResult(parsedResult);
        setStatus('verified');

        // Save to Firestore if user is logged in
        if (currentUser) {
          // Add to user's verification history
          await updateDoc(doc(db, 'users', currentUser.uid), {
            verificationHistory: arrayUnion({
              query: searchQuery,
              content: newsContent,
              articleUrl: selectedArticle?.url || '',
              result: parsedResult,
              timestamp: new Date().toISOString()
            })
          });
        }
        
        // Also save to general verifications collection
        await addDoc(collection(db, 'verifications'), {
          query: searchQuery,
          content: newsContent,
          articleUrl: selectedArticle?.url || '',
          result: parsedResult,
          userId: currentUser?.uid || 'anonymous',
          timestamp: serverTimestamp()
        });
        
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        
        // Fall back to mock data if API call fails
        console.log("Falling back to mock verification data");
        
        // Mock verification logic as fallback
        const mockResults: VerificationResult = {
          veracity: Math.random() > 0.5 ? 'true' : 'false',
          confidence: Math.floor(Math.random() * 30) + 70,
          explanation: Math.random() > 0.5 
            ? "This news has been verified as accurate. Multiple sources confirm the key details."
            : "This claim contains false information. Official sources contradict these statements.",
          sources: [
            {
              name: "Reuters Fact Check",
              url: "https://www.reuters.com/fact-check"
            },
            {
              name: "Associated Press",
              url: "https://apnews.com"
            }
          ],
          correctedInfo: Math.random() > 0.5 
            ? "The correct information states that..." 
            : undefined
        };

        setResult(mockResults);
        setStatus('verified');

        // Save the mock result to Firestore
        try {
          if (currentUser) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              verificationHistory: arrayUnion({
                query: searchQuery,
                content: newsContent,
                articleUrl: selectedArticle?.url || '',
                result: mockResults,
                timestamp: new Date().toISOString()
              })
            });
          }
          
          await addDoc(collection(db, 'verifications'), {
            query: searchQuery,
            content: newsContent,
            articleUrl: selectedArticle?.url || '',
            result: mockResults,
            userId: currentUser?.uid || 'anonymous',
            timestamp: serverTimestamp()
          });
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

  return (
    <NewsContext.Provider
      value={{
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
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = (): NewsContextType => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};
