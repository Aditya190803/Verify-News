/**
 * @fileoverview News search utilities for the verification application.
 * Provides functions for searching news via LangSearch API, extracting keywords,
 * and performing comprehensive multi-source news searches.
 * @module utils/searchUtils
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/** Represents a search result article from the LangSearch API */
interface SearchArticle {
  name?: string;
  title?: string;
  snippet?: string;
  url?: string;
  displayUrl?: string;
  summary?: string;
  datePublished?: string;
  dateLastCrawled?: string;
}

/** Represents the structured search response from LangSearch */
interface SearchResponse {
  _type?: string;
  queryContext?: {
    originalQuery: string;
  };
  webPages?: {
    webSearchUrl?: string;
    totalEstimatedMatches?: number | null;
    value: SearchArticle[];
  };
  results?: SearchArticle[];
  value?: SearchArticle[];
  data?: {
    webPages?: {
      value: SearchArticle[];
    };
  };
  error?: string;
  message?: string;
}

/** Represents a processed news article for display */
interface NewsArticle {
  title: string;
  snippet: string;
  url: string;
  summary?: string;
  datePublished?: string;
  dateLastCrawled?: string;
}

/**
 * Search LangSearch API for news articles on a given topic.
 * Implements retry logic with multiple query variations for better results.
 * 
 * @param {string} query - The search query string
 * @returns {Promise<SearchResponse>} The search results with webPages.value array
 * @throws {Error} When all search attempts fail
 * 
 * @example
 * ```ts
 * const results = await searchLangSearch("climate change policy");
 * console.log(results.webPages.value.length); // Number of articles found
 * ```
 */
export const searchLangSearch = async (query: string): Promise<SearchResponse> => {
  try {
    console.log(`🔍 Searching for: "${query}"`);
    
    // Check if API key is available
    if (!import.meta.env.VITE_LANGSEARCH_API_KEY) {
      console.warn('⚠️ LangSearch API key not found, falling back to simulation');
      throw new Error('LangSearch API key not configured');
    }
    
    // Try multiple approaches for better search success
    const searchAttempts = [
      // Original query
      query,
      // Simplified query (remove quotes and special chars)
      query.replace(/[""]/g, '').replace(/[^\w\s]/g, ' ').trim(),
      // Key terms only
      query.split(' ').slice(0, 3).join(' ')
    ];
    
    for (let attempt = 0; attempt < searchAttempts.length; attempt++) {
      const searchQuery = searchAttempts[attempt];
      if (!searchQuery.trim()) continue;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000 + (attempt * 1000)); // Progressive timeout
        
        const url = `https://api.langsearch.com/v1/web-search`;
        
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_LANGSEARCH_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            freshness: "noLimit",
            summary: true,
            count: 10
          })
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`LangSearch API returned ${response.status}`);
        }
        
        const data: SearchResponse = await response.json();
        
        console.log('🔍 LangSearch response structure:', {
          hasData: !!data,
          hasDataData: !!data?.data,
          hasWebPages: !!data?.data?.webPages,
          hasValue: !!data?.data?.webPages?.value,
          valueLength: data?.data?.webPages?.value?.length || 0,
          topLevelKeys: Object.keys(data || {}),
          dataKeys: Object.keys(data?.data || {}),
          errorMessage: data?.error || data?.message
        });
        
        // Check multiple possible response formats
        let searchResults: SearchResponse | null = null;
        let resultCount = 0;
        
        if (data?.data?.webPages?.value && data.data.webPages.value.length > 0) {
          searchResults = data.data as SearchResponse;
          resultCount = data.data.webPages.value.length;
        } else if (data?.webPages?.value && data.webPages.value.length > 0) {
          searchResults = data;
          resultCount = data.webPages.value.length;
        } else if (data?.results && data.results.length > 0) {
          // Alternative format - convert to expected format
          searchResults = {
            webPages: {
              value: data.results
            }
          };
          resultCount = data.results.length;
        } else if (data?.value && data.value.length > 0) {
          searchResults = {
            webPages: {
              value: data.value
            }
          };
          resultCount = data.value.length;
        }
        
        if (searchResults && resultCount > 0) {
          console.log(`✅ LangSearch search successful (attempt ${attempt + 1}) - Found ${resultCount} results`);
          return searchResults;
        } else if (attempt === searchAttempts.length - 1) {
          console.warn('⚠️ LangSearch returned empty results for all attempts');
          console.warn('📋 Raw response:', JSON.stringify(data, null, 2).substring(0, 1000));
          throw new Error('No results from LangSearch');
        }
        
      } catch (fetchError) {
        if (attempt === searchAttempts.length - 1) {
          const err = fetchError as Error;
          if (err.name === 'AbortError') {
            console.warn('⏰ LangSearch API timeout - falling back to alternative search');
          } else {
            console.warn('❌ LangSearch API error:', err.message);
          }
          throw fetchError;
        }
        // Continue to next attempt
        console.warn(`🔄 Search attempt ${attempt + 1} failed, trying next approach...`);
      }
    }
    
    throw new Error('All search attempts failed');
  } catch (error) {
    const err = error as Error;
    console.warn('🔄 Falling back to search simulation due to:', err.message);
    
    // Generic fallback with context for verification
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const contextualFallback = `Search context: Unable to retrieve real-time search results for "${query}". Current date is ${currentDate}. For verification, recommend cross-referencing with multiple reliable news sources and official statements.`;
    
    return {
      _type: "SearchResponse",
      queryContext: {
        originalQuery: query
      },
      webPages: {
        webSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        totalEstimatedMatches: null,
        value: [
          {
            name: `Verification Context for: ${query}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            displayUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: contextualFallback,
            summary: contextualFallback,
            datePublished: undefined,
            dateLastCrawled: undefined
          }
        ]
      }
    };
  }
};

/**
 * Scores the relevance of a news article based on query term matching.
 * Higher scores indicate more relevant articles.
 * 
 * @param {SearchArticle} article - The article to score
 * @param {string} query - The original search query
 * @returns {number} A relevance score (higher is more relevant)
 */
const scoreArticleRelevance = (article: SearchArticle, query: string): number => {
  const queryTerms = query.toLowerCase().split(' ');
  let score = 0;
  
  // Score based on title match
  const title = (article.title || article.name || '').toLowerCase();
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 5;
  });
  
  // Score based on content match
  const snippet = (article.snippet || '').toLowerCase();
  queryTerms.forEach(term => {
    if (snippet.includes(term)) score += 3;
  });
  
  // Bonus for having a URL (content availability)
  if (article.url) score += 2;
  
  // Score based on content length (more detailed articles)
  if (article.snippet && article.snippet.length > 100) score += 2;
  
  return score;
};

/**
 * Extracts and normalizes news articles from LangSearch response.
 * Articles are sorted by relevance to the original query.
 * 
 * @param {SearchResponse} results - The raw search results from LangSearch
 * @param {string} query - The original search query for relevance scoring
 * @returns {NewsArticle[]} Array of processed articles sorted by relevance
 * 
 * @example
 * ```ts
 * const results = await searchLangSearch("election results");
 * const articles = extractNewsFromSearch(results, "election results");
 * articles.forEach(article => console.log(article.title));
 * ```
 */
export const extractNewsFromSearch = (results: SearchResponse, query: string): NewsArticle[] => {
  const articles: NewsArticle[] = [];
  
  // Extract news from LangSearch webPages.value format
  if (results?.webPages?.value && results.webPages.value.length > 0) {
    for (const result of results.webPages.value) {
      if (result.name && result.snippet) {
        articles.push({
          title: result.name,
          snippet: result.snippet,
          url: result.url || result.displayUrl || '',
          summary: result.summary || result.snippet,
          datePublished: result.datePublished,
          dateLastCrawled: result.dateLastCrawled
        });
      }
    }
  }
  
  // Fallback: Check for any other format that might exist
  if (articles.length === 0 && results?.value && results.value.length > 0) {
    for (const result of results.value) {
      if (result.name && result.snippet) {
        articles.push({
          title: result.name,
          snippet: result.snippet,
          url: result.url || result.displayUrl || '',
          summary: result.summary || result.snippet
        });
      }
    }
  }
  
  // Sort articles by relevance score
  return articles
    .sort((a, b) => {
      const articleA = { name: a.title, snippet: a.snippet, url: a.url };
      const articleB = { name: b.title, snippet: b.snippet, url: b.url };
      return scoreArticleRelevance(articleB, query) - scoreArticleRelevance(articleA, query);
    })
    .slice(0, 10); // Limit to top 10 most relevant results
};

/**
 * Searches multiple news sources for comprehensive coverage.
 * Includes major news outlets and Indian news sources.
 * 
 * @param {string} query - The search query
 * @returns {Promise<SearchResponse[]>} Combined results from multiple sources
 * 
 * @example
 * ```ts
 * const results = await searchMultipleSources("technology policy");
 * console.log(`Found ${results.length} source responses`);
 * ```
 */
export const searchMultipleSources = async (query: string): Promise<SearchResponse[]> => {
  const searches = [
    // General search
    `${query}`,
    // Key news sources only (reduced list)
    `${query} site:reuters.com`,
    `${query} site:bbc.com`,
    `${query} site:timesofindia.indiatimes.com`,
    `${query} site:ndtv.com`,
  ];

  const allResults: SearchResponse[] = [];
  let successfulSearches = 0;
  
  let failedSearches = 0;
  const maxFailures = 3; // Stop after 3 consecutive failures
  
  for (const searchQuery of searches) {
    try {
      const result = await searchLangSearch(searchQuery);
      if (result) {
        allResults.push(result);
        successfulSearches++;
        failedSearches = 0; // Reset failure counter on success
      }
      
      // Break early if we have enough results per query
      if (successfulSearches >= 2) {
        console.log("✅ Got enough search results for this query, stopping early");
        break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`Search failed for: ${searchQuery}`, error);
      failedSearches++;
      
      // Circuit breaker: stop if too many consecutive failures
      if (failedSearches >= maxFailures) {
        console.warn("🚫 Too many search failures, stopping remaining searches");
        break;
      }
    }
  }
  
  console.log(`✅ Completed ${successfulSearches}/${searches.length} sources for query: "${query.substring(0, 50)}..."`);
  return allResults;
};

/**
 * Generates search query variations for comprehensive coverage.
 * Creates multiple search approaches from a single query.
 * 
 * @param {string} query - The original search query
 * @returns {string[]} Array of search variations
 */
export const generateSearchVariations = (query: string): string[] => {
  const variations = [query];
  
  // Create variations with different search approaches
  const words = query.split(' ').filter(word => word.length > 3);
  
  // Add combinations of key words
  if (words.length > 2) {
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        variations.push(`${words[i]} ${words[j]}`);
      }
    }
  }
  
  // Add quoted exact phrases for important terms
  variations.push(`"${query}"`);
  
  // Add news-specific searches
  variations.push(`${query} news`);
  variations.push(`${query} breaking news`);
  variations.push(`${query} latest`);
  
  return [...new Set(variations)]; // Remove duplicates
};

/**
 * Uses LLM to extract keywords from news content for verification.
 * Falls back to basic keyword extraction if LLM is unavailable.
 * 
 * @param {string} content - The news content to analyze
 * @returns {Promise<string[]>} Array of extracted keywords
 * 
 * @example
 * ```ts
 * const keywords = await extractKeywordsWithLLM(newsArticle);
 * // Returns: ["Tesla", "Elon Musk", "electric vehicles", "factory"]
 * ```
 */
export const extractKeywordsWithLLM = async (content: string): Promise<string[]> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('Gemini API key not available, falling back to basic keyword extraction');
      return extractBasicKeywords(content);
    }

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Extract the most important keywords and phrases from this news content that would be useful for fact-checking and verification searches. Focus on:
    - Names of people, organizations, companies
    - Specific locations, places, airports
    - Technical terms, model numbers, specifications  
    - Event types and actions
    - Numbers, quantities, dates
    - Any unique identifiers or specific details

    Return only a comma-separated list of keywords/phrases, no explanations.

    News content: "${content}"
    
    Keywords:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keywords = response.text()
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 2 && keyword.length < 50)
      .slice(0, 15); // Limit to 15 most important keywords

    return keywords;
  } catch (error) {
    console.error('Error extracting keywords with LLM:', error);
    return extractBasicKeywords(content);
  }
};

/**
 * Fallback basic keyword extraction without LLM.
 * Removes common words and returns unique terms.
 * 
 * @param {string} content - The news content
 * @returns {string[]} Array of basic keywords
 */
const extractBasicKeywords = (content: string): string[] => {
  const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'end', 'few', 'got', 'let', 'put', 'say', 'she', 'too', 'use'];
  
  return words
    .filter(word => !commonWords.includes(word))
    .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
    .slice(0, 10);
};

/**
 * Generates comprehensive search queries based on LLM-extracted keywords.
 * Creates targeted queries for fact-checking verification.
 * 
 * @param {string} content - The news content to create queries for
 * @returns {Promise<string[]>} Array of targeted search queries
 */
export const generateKeywordSearchQueries = async (content: string): Promise<string[]> => {
  const queries: string[] = [];
  
  // Original content as exact search (first 100 characters)
  queries.push(`"${content.substring(0, 100)}"`);
  
  // Get LLM-extracted keywords
  const keywords = await extractKeywordsWithLLM(content);
  
  // Individual keyword searches
  keywords.forEach(keyword => {
    queries.push(`"${keyword}"`);
    queries.push(`${keyword} news`);
    queries.push(`${keyword} latest`);
  });
  
  // Keyword combinations (2-word combinations)
  for (let i = 0; i < keywords.length - 1 && i < 5; i++) {
    for (let j = i + 1; j < keywords.length && j < 6; j++) {
      queries.push(`"${keywords[i]}" "${keywords[j]}"`);
      queries.push(`${keywords[i]} ${keywords[j]}`);
    }
  }
  
  // Add verification-focused searches
  keywords.forEach(keyword => {
    queries.push(`${keyword} confirmed`);
    queries.push(`${keyword} verified`);
    queries.push(`${keyword} reports`);
  });
  
  return [...new Set(queries)].slice(0, 25); // Limit to 25 most relevant queries
};

/**
 * Performs a comprehensive news search using LLM-extracted keywords.
 * Searches multiple sources with various query strategies.
 * 
 * @param {string} content - The news content to verify
 * @returns {Promise<SearchResponse[]>} Combined search results
 * 
 * @example
 * ```ts
 * const results = await comprehensiveNewsSearch(newsArticleText);
 * const allArticles = results.flatMap(r => extractNewsFromSearch(r, newsArticleText));
 * ```
 */
export const comprehensiveNewsSearch = async (content: string): Promise<SearchResponse[]> => {
  console.log('Starting comprehensive news search...');
  
  const allResults: SearchResponse[] = [];
  
  try {
    // 1. Get LLM-extracted keyword queries
    const keywordQueries = await generateKeywordSearchQueries(content);
    console.log('Generated keyword queries:', keywordQueries.length);
    
    // 2. Get basic search variations
    const basicVariations = generateSearchVariations(content);
    console.log('Generated basic variations:', basicVariations.length);
    
    // 3. Combine all search queries but limit more aggressively
    const allQueries = [...keywordQueries, ...basicVariations];
    const uniqueQueries = [...new Set(allQueries)].slice(0, 3); // Reduced to 3 to prevent timeouts
    
    console.log('Total unique queries to search:', uniqueQueries.length);
    
    // 4. Search each query across multiple sources
    for (let i = 0; i < uniqueQueries.length; i++) {
      const query = uniqueQueries[i];
      
      try {
        console.log(`🔍 Processing query ${i + 1}/${uniqueQueries.length}: "${query.substring(0, 50)}..."`);
        // Search multiple sources for each query
        const sourceResults = await searchMultipleSources(query);
        allResults.push(...sourceResults);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
      }
    }
    
    console.log('Comprehensive search completed. Total results:', allResults.length);
    return allResults;
    
  } catch (error) {
    console.error('Error in comprehensive search:', error);
    // Fallback to basic search
    return await searchMultipleSources(content);
  }
};
