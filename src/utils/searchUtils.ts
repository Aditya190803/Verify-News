/**
 * @fileoverview News search utilities for the verification application.
 * Provides functions for searching news via LangSearch API, extracting keywords,
 * and performing comprehensive multi-source news searches.
 *
 * This module handles:
 * - Multi-provider search (LangSearch, Tavily)
 * - Keyword extraction and query generation
 * - Search result ranking and scoring
 * - Caching and fallback mechanisms
 * - Comprehensive multi-source searches
 *
 * @module utils/searchUtils
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { rankSearchResultsWithFallback } from '@/services/aiProviders';
import { RELIABLE_SOURCES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { SearchArticle, SearchResponse, NewsArticle } from '@/types/news';

/**
 * Helper function to retrieve API keys from environment variables.
 *
 * Supports both Vite (import.meta.env) and Node.js (process.env) environments.
 *
 * @param {string} name - The environment variable name (e.g., 'VITE_LANGSEARCH_API_KEY')
 * @returns {string|undefined} The API key or undefined if not found
 *
 * @example
 * ```ts
 * const apiKey = getApiKey('VITE_LANGSEARCH_API_KEY');
 * if (!apiKey) {
 *   throw new Error('API key not configured');
 * }
 * ```
 */
const getApiKey = (name: string) => import.meta.env[name] || (typeof process !== 'undefined' ? process.env[name] : undefined);

// Cache configuration
const SEARCH_CACHE_KEY = 'verify_news_search_cache';
const CACHE_EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Interface for cached search results.
 *
 * @property {number} timestamp - Unix timestamp when the cache was created
 * @property {SearchResponse[]} results - The cached search results
 */
interface CachedSearch {
  timestamp: number;
  results: SearchResponse[];
}

/**
 * Retrieves the search cache from localStorage.
 *
 * @returns {Record<string, CachedSearch>} Cached search results keyed by query
 * @throws {Error} May throw if localStorage is unavailable
 *
 * @example
 * ```ts
 * const cache = getSearchCache();
 * if (cache["climate change"]) {
 *   // Use cached results
 * }
 * ```
 */
const getSearchCache = (): Record<string, CachedSearch> => {
  try {
    const cache = localStorage.getItem(SEARCH_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
};

/**
 * Saves search results to localStorage cache.
 *
 * @param {Record<string, CachedSearch>} cache - The cache object to save
 * @returns {void}
 *
 * @example
 * ```ts
 * const cache = getSearchCache();
 * cache["query"] = {
 *   timestamp: Date.now(),
 *   results: searchResults
 * };
 * saveSearchCache(cache);
 * ```
 */
const saveSearchCache = (cache: Record<string, CachedSearch>) => {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    logger.warn('Failed to save search cache:', e);
  }
};

/**
 * Search Tavily API as a backup search provider.
 *
 * Tavily provides a reliable alternative search source when LangSearch fails or is unavailable.
 * It offers web search capabilities with structured results that can be used for fact-checking.
 *
 * @param {string} query - The search query string to send to Tavily API
 * @returns {Promise<SearchResponse>} The search results in standardized format
 * @throws {Error} When Tavily API key is missing or API request fails
 *
 * @example
 * ```ts
 * const results = await searchTavily("climate change policy");
 * // Returns: { webPages: { value: [{ name, snippet, url }] } }
 * ```
 *
 * @see searchLangSearch - Primary search function
 * @see searchMultipleSources - Multi-source search with fallback
 */
export const searchTavily = async (query: string): Promise<SearchResponse> => {
  try {
    const apiKey = getApiKey('VITE_TAVILY_API_KEY');
    if (!apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        max_results: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Map Tavily results to SearchResponse format
    return {
      webPages: {
        value: data.results.map((r: { title: string; content: string; url: string }) => ({
          name: r.title,
          snippet: r.content,
          url: r.url
        }))
      }
    };
  } catch (error) {
    logger.error('Tavily search failed:', error);
    throw error;
  }
};

/**
 * Search LangSearch API for news articles on a given topic.
 *
 * This is the primary search function that implements intelligent retry logic with multiple
 * query variations to maximize search success. It handles various response formats and
 * provides comprehensive error handling.
 *
 * **Search Strategy:**
 * 1. Cleans and normalizes the query
 * 2. Extracts meaningful keywords (removes stop words)
 * 3. Attempts multiple query variations with progressive timeouts
 * 4. Handles multiple response formats from the API
 * 5. Falls back to contextual simulation if all attempts fail
 *
 * **Query Variations Tried:**
 * - Cleaned query (most reliable)
 * - Meaningful keywords only (topic-focused)
 * - Original query (as last resort)
 *
 * **Response Format Handling:**
 * - Standard: `data.webPages.value`
 * - Direct: `webPages.value`
 * - Alternative: `results`
 * - Minimal: `value`
 *
 * @param {string} query - The search query string (can be news content, headline, or topic)
 * @returns {Promise<SearchResponse>} The search results with webPages.value array
 * @throws {Error} When all search attempts fail
 *
 * @example
 * ```ts
 * // Basic usage
 * const results = await searchLangSearch("climate change policy");
 * const articles = results.webPages.value;
 *
 * // With error handling
 * try {
 *   const results = await searchLangSearch("breaking news");
 * } catch (error) {
 *   console.error("Search failed:", error.message);
 * }
 * ```
 *
 * @see searchTavily - Backup search provider
 * @see searchMultipleSources - Multi-source search
 * @see comprehensiveNewsSearch - Full verification search
 */
export const searchLangSearch = async (query: string): Promise<SearchResponse> => {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }
  try {
    const apiKey = getApiKey('VITE_LANGSEARCH_API_KEY');
    // Check if API key is available
    if (!apiKey) {
      logger.warn('LangSearch API key not found, falling back to simulation');
      throw new Error('LangSearch API key not configured');
    }
    
    // Try multiple approaches for better search success
    // Preserve : and . for search operators like site:reuters.com
    const cleanQuery = query.replace(/["']/g, '').replace(/[^\w\s:.]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract meaningful keywords (skip common stop words)
    const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'will', 'be', 'to', 'of', 'in', 'that', 'this', 'it', 'for', 'with', 'on', 'at', 'by']);
    const keywords = cleanQuery.split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
      .slice(0, 6)
      .join(' ');

    const searchAttempts = [
      // 1. Cleaned query (most reliable)
      cleanQuery,
      // 2. Meaningful keywords only (topic-focused)
      keywords,
      // 3. Original query (as last resort)
      query.trim()
    ].filter((q, i, self) => q && self.indexOf(q) === i); // Unique non-empty queries
    
    for (let attempt = 0; attempt < searchAttempts.length; attempt++) {
      const searchQuery = searchAttempts[attempt];
      if (!searchQuery.trim()) continue;
      
      try {
        const controller = new AbortController();
        // Increased timeout: 5s for first attempt, then progressive
        const timeoutMs = 5000 + (attempt * 2000);
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        logger.debug(`LangSearch attempt ${attempt + 1} with query: "${searchQuery}" (timeout: ${timeoutMs}ms)`);
        
        const url = `https://api.langsearch.com/v1/web-search`;
        
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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
        
        logger.debug('🔍 LangSearch response structure:', {
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
          logger.info(`LangSearch search successful (attempt ${attempt + 1}) - Found ${resultCount} results`);
          return searchResults;
        } else if (attempt === searchAttempts.length - 1) {
          logger.warn('LangSearch returned empty results for all attempts');
          logger.warn('Raw response:', JSON.stringify(data, null, 2).substring(0, 1000));
          throw new Error('No results from LangSearch');
        }
        
      } catch (fetchError) {
        const err = fetchError as Error;
        if (attempt === searchAttempts.length - 1) {
          if (err.name === 'AbortError') {
            logger.warn('LangSearch API timeout - falling back to alternative search');
          } else {
            logger.warn('LangSearch API error:', err.message);
          }
          throw fetchError;
        }
        // Continue to next attempt
        logger.warn(`Search attempt ${attempt + 1} failed (${err.name === 'AbortError' ? 'Timeout' : err.message}), trying next approach...`);
      }
    }
    
    throw new Error('All search attempts failed');
  } catch (error) {
    const err = error as Error;
    logger.warn('Falling back to search simulation due to:', err.message);
    
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
 * Scores the relevance of a news article based on multiple factors.
 *
 * This function implements a comprehensive scoring algorithm that evaluates articles
 * based on content relevance, source credibility, timeliness, and other quality indicators.
 * Higher scores indicate more relevant and credible articles.
 *
 * **Scoring Factors (weighted):**
 *
 * 1. **Title Relevance (10x weight)**: Exact term matches in article title
 * 2. **Content Relevance (5x weight)**: Term matches in snippet/content
 * 3. **Freshness (15-2 points)**:
 *    - < 7 days: +15 points
 *    - < 30 days: +10 points
 *    - < 90 days: +5 points
 *    - < 365 days: +2 points
 * 4. **Source Credibility (25 points)**: Known reliable domains
 * 5. **Fact-Check Domains (30 points)**: Snopes, Politifact, FactCheck, FullFact
 * 6. **Official Sources (20 points)**: .gov, .edu domains
 * 7. **Content Length (8-4 points)**: Longer content preferred
 * 8. **Summary Presence (3 points)**: Articles with summaries
 * 9. **HTTPS (2 points)**: Secure sources
 * 10. **Exact Phrase Match (25-15 points)**: Bonus for exact query matches
 *
 * **Penalties:**
 * - Misinformation domains: -50 points
 * - Suspicious patterns (clickbait, viral, etc.): -15 points
 *
 * @param {SearchArticle} article - The article to score
 * @param {string} query - The original search query
 * @returns {number} A relevance score (higher is more relevant, minimum 0)
 *
 * @example
 * ```ts
 * const score = scoreArticleRelevance(article, "climate change");
 * // Returns: 85 (highly relevant)
 * ```
 *
 * @see extractNewsFromSearch - Uses this for sorting
 */
const scoreArticleRelevance = (article: SearchArticle, query: string): number => {
  let score = 0;
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  // 1. Title relevance (highest weight)
  const title = (article.title || article.name || '').toLowerCase();
  const titleMatches = queryTerms.filter(term => title.includes(term)).length;
  score += titleMatches * 10; // 10 points per term match
  
  // 2. Content/snippet relevance
  const snippet = (article.snippet || '').toLowerCase();
  const snippetMatches = queryTerms.filter(term => snippet.includes(term)).length;
  score += snippetMatches * 5; // 5 points per term match
  
  // 3. Content freshness (prefer recent articles)
  if (article.datePublished) {
    try {
      const pubDate = new Date(article.datePublished);
      const daysOld = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysOld < 7) score += 15; // Recent articles (< 1 week)
      else if (daysOld < 30) score += 10; // Recent (< 1 month)
      else if (daysOld < 90) score += 5; // Somewhat recent (< 3 months)
      else if (daysOld < 365) score += 2; // Older (< 1 year)
    } catch {
      // Ignore date parsing errors
    }
  }
  
  // 4. Source credibility (based on domain)
  const url = (article.url || '').toLowerCase();
  
  const isCredible = RELIABLE_SOURCES.some(domain => url.includes(domain));
  if (isCredible) score += 25; // Significant boost for credible sources

  // 5. Fact-check specific boost
  const factCheckDomains = ['snopes.com', 'politifact.com', 'factcheck.org', 'fullfact.org'];
  const isFactCheck = factCheckDomains.some(domain => url.includes(domain));
  if (isFactCheck) score += 30; // Even higher boost for fact-checkers

  // 6. Official government sources
  if (url.includes('.gov') || url.includes('.edu')) {
    score += 20;
  }
  
  // Penalize known misinformation domains
  const unreliableDomains = [
    'infowars.com', 'naturalnews.com', 'beforeitsnews.com'
  ];
  if (unreliableDomains.some(domain => url.includes(domain))) {
    score -= 50; // Significant penalty
  }
  
  // 7. Penalty for suspicious patterns
  const suspiciousPatterns = ['clickbait', 'viral', 'shocking', 'unbelievable', 'free-money'];
  if (suspiciousPatterns.some(pattern => title.includes(pattern) || snippet.includes(pattern))) {
    score -= 15;
  }
  
  // 8. Content length (more detailed articles are usually better)
  const snippetLength = (article.snippet || '').length;
  if (snippetLength > 200) score += 8;
  else if (snippetLength > 100) score += 4;
  
  // 6. Presence of summary/description
  if (article.summary && article.summary.length > 0) score += 3;
  
  // 7. URL quality (prefer HTTPS and clean URLs)
  if (url.startsWith('https://')) score += 2;
  
  // 8. Query match density (exact phrase match)
  const queryPhrase = query.toLowerCase();
  if (title.includes(queryPhrase)) score += 25; // Bonus for exact phrase in title
  if (snippet.includes(queryPhrase)) score += 15; // Bonus for exact phrase in content
  
  // Ensure minimum score is 0
  return Math.max(0, score);
};

/**
 * Extracts and normalizes news articles from LangSearch response.
 *
 * This function processes raw search results into a standardized format and sorts them
 * by relevance. It handles multiple response formats and ensures consistent output.
 *
 * **Processing Steps:**
 * 1. Extracts articles from `webPages.value` (primary format)
 * 2. Falls back to alternative formats if needed
 * 3. Validates required fields (name/snippet)
 * 4. Scores each article for relevance
 * 5. Sorts by relevance score (highest first)
 * 6. Limits to top 10 results
 *
 * **Output Format:**
 * ```typescript
 * {
 *   title: string,
 *   snippet: string,
 *   url: string,
 *   summary?: string,
 *   datePublished?: string,
 *   dateLastCrawled?: string
 * }
 * ```
 *
 * @param {SearchResponse} results - The raw search results from LangSearch
 * @param {string} query - The original search query for relevance scoring
 * @returns {NewsArticle[]} Array of processed articles sorted by relevance (max 10)
 *
 * @example
 * ```ts
 * const results = await searchLangSearch("election results");
 * const articles = extractNewsFromSearch(results, "election results");
 * // Returns: [{ title, snippet, url, summary, ... }] sorted by relevance
 * ```
 *
 * @see scoreArticleRelevance - Scoring algorithm used
 * @see searchLangSearch - Source of raw results
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
 *
 * This function performs parallel searches across different query variations and sources
 * to gather diverse perspectives on the topic. It implements circuit breaking to prevent
 * cascading failures and optimizes for getting sufficient results quickly.
 *
 * **Search Strategy:**
 * - General search: Original query
 * - Site-specific searches: Reuters, BBC, Times of India, NDTV
 * - Circuit breaker: Stops after 3 consecutive failures
 * - Early termination: Stops after 2 successful searches
 * - Rate limiting: 100ms delay between requests
 *
 * **Fallback Chain:**
 * 1. Try LangSearch API
 * 2. If LangSearch fails, try Tavily API
 * 3. If both fail, log warning and continue
 *
 * @param {string} query - The search query string
 * @returns {Promise<SearchResponse[]>} Combined results from multiple sources
 *
 * @example
 * ```ts
 * // Get comprehensive coverage
 * const results = await searchMultipleSources("technology policy");
 *
 * // Process combined results
 * const allArticles = results.flatMap(res =>
 *   res.webPages?.value || []
 * );
 * ```
 *
 * @see searchLangSearch - Primary search function
 * @see searchTavily - Backup search function
 * @see comprehensiveNewsSearch - Full verification search
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
      let result;
      try {
        result = await searchLangSearch(searchQuery);
      } catch (langSearchError) {
        logger.warn(`LangSearch failed for: ${searchQuery}, trying Tavily...`);
        try {
          result = await searchTavily(searchQuery);
        } catch (_tavilyError) {
          throw langSearchError; // Re-throw original error if Tavily also fails
        }
      }

      if (result) {
        allResults.push(result);
        successfulSearches++;
        failedSearches = 0; // Reset failure counter on success
      }
      
      // Break early if we have enough results per query
      if (successfulSearches >= 2) {
        logger.info("Got enough search results for this query, stopping early");
        break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.warn(`Search failed for: ${searchQuery}`, error);
      failedSearches++;
      
      // Circuit breaker: stop if too many consecutive failures
      if (failedSearches >= maxFailures) {
        logger.warn("Too many search failures, stopping remaining searches");
        break;
      }
    }
  }
  
  logger.info(`Completed ${successfulSearches}/${searches.length} sources for query: "${query.substring(0, 50)}..."`);
  return allResults;
};

/**
 * Generates search query variations for comprehensive coverage.
 *
 * This function creates multiple search approaches from a single query to maximize
 * the chances of finding relevant results. It uses different strategies based on
 * query characteristics.
 *
 * **Variation Strategies:**
 *
 * 1. **Cleaned Query**: Normalized version (removes special chars, extra spaces)
 * 2. **Key Terms**: Extracts important words (filters out common terms)
 * 3. **Topic-Focused**: For long queries, extracts 5 key terms
 * 4. **Quoted Exact**: Exact phrase search (if query < 60 chars)
 * 5. **News-Specific**: Appends "news", "breaking news", "latest"
 *
 * **Processing Steps:**
 * - Normalizes input (removes special chars, handles whitespace)
 * - Filters out common stop words
 * - Creates combinations based on query length
 * - Removes duplicates
 * - Limits to relevant variations
 *
 * @param {string} query - The original search query
 * @returns {string[]} Array of search variations (unique, non-empty)
 *
 * @example
 * ```ts
 * const variations = generateSearchVariations("Tesla Model 3 production");
 * // Returns: [
 * //   "Tesla Model 3 production",
 * //   "Tesla Model 3 production news",
 * //   "Tesla Model 3 production breaking news",
 * //   "Tesla Model 3 production latest"
 * // ]
 * ```
 *
 * @see generateKeywordSearchQueries - LLM-powered query generation
 * @see searchMultipleSources - Uses these variations
 */
export const generateSearchVariations = (query: string): string[] => {
  if (!query || query.trim().length === 0) return [];

  // Normalize query: remove special characters, handle whitespace
  const cleanQuery = query
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const variations = [cleanQuery];
  
  // Create variations with different search approaches
  const words = cleanQuery.split(' ').filter(word => word.length > 3);
  
  // Topic-specific query generation (avoid company-level queries if possible)
  // If the query is very long, extract key terms
  if (cleanQuery.length > 50) {
    const keyTerms = words.slice(0, 5).join(' ');
    if (keyTerms) variations.push(keyTerms);
  }

  // Add combinations of key words
  if (words.length > 2) {
    // Key terms only logic
    const keyWords = words.filter(w => !['news', 'latest', 'breaking', 'update'].includes(w.toLowerCase()));
    if (keyWords.length >= 2) {
      variations.push(keyWords.slice(0, 3).join(' '));
    }
  }
  
  // Add quoted exact phrases for important terms (if not too long)
  if (cleanQuery.length < 60) {
    variations.push(`"${cleanQuery}"`);
  }
  
  // Add news-specific searches
  variations.push(`${cleanQuery} news`);
  variations.push(`${cleanQuery} breaking news`);
  variations.push(`${cleanQuery} latest`);
  
  return [...new Set(variations)].filter(v => v.length > 0); // Remove duplicates and empty
};

/**
 * Uses LLM to extract keywords from news content for verification.
 *
 * This function leverages Google's Gemini AI to intelligently extract the most relevant
 * keywords and phrases from news content. These keywords are then used to generate
 * targeted search queries for fact-checking.
 *
 * **LLM Extraction Strategy:**
 * The AI is prompted to identify:
 * - Names of people, organizations, companies
 * - Specific locations, places, airports
 * - Technical terms, model numbers, specifications
 * - Event types and actions
 * - Numbers, quantities, dates
 * - Unique identifiers or specific details
 *
 * **Fallback Mechanism:**
 * If Gemini API is unavailable or fails, falls back to `extractBasicKeywords()` which:
 * - Uses regex to find words (3+ characters)
 * - Filters out common stop words
 * - Removes duplicates
 * - Limits to top 10 keywords
 *
 * @param {string} content - The news content to analyze
 * @returns {Promise<string[]>} Array of extracted keywords (max 15 from LLM, 10 from basic)
 *
 * @example
 * ```ts
 * const content = "Tesla announces new Model Y production at Berlin factory";
 * const keywords = await extractKeywordsWithLLM(content);
 * // Returns: ["Tesla", "Model Y", "production", "Berlin", "factory"]
 * ```
 *
 * @see extractBasicKeywords - Fallback function
 * @see generateKeywordSearchQueries - Uses these keywords
 * @see comprehensiveNewsSearch - Main search flow
 */
export const extractKeywordsWithLLM = async (content: string): Promise<string[]> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      logger.warn('Gemini API key not available, falling back to basic keyword extraction');
      return extractBasicKeywords(content);
    }

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash" });

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
    logger.error('Error extracting keywords with LLM:', error);
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
/**
 * Fallback basic keyword extraction without LLM.
 *
 * Uses simple regex pattern matching to extract words and filters out common stop words.
 * This is used as a fallback when the LLM-based extraction fails or is unavailable.
 *
 * **Algorithm:**
 * 1. Convert to lowercase
 * 2. Extract words (3+ characters, letters only)
 * 3. Filter out common English stop words
 * 4. Remove duplicates
 * 5. Return top 10 keywords
 *
 * @param {string} content - The news content
 * @returns {string[]} Array of basic keywords (max 10)
 *
 * @example
 * ```ts
 * const keywords = extractBasicKeywords("The quick brown fox jumps");
 * // Returns: ["quick", "brown", "fox", "jumps"]
 * ```
 *
 * @see extractKeywordsWithLLM - Primary function with LLM
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
 *
 * This function creates a diverse set of search queries optimized for fact-checking.
 * It combines exact phrase searches, individual keyword searches, keyword combinations,
 * and verification-focused queries.
 *
 * **Query Generation Strategy:**
 *
 * 1. **Exact Phrase**: First 100 chars of content in quotes
 * 2. **Individual Keywords**: Each keyword as quoted search + news variants
 * 3. **Keyword Combinations**: 2-word combinations of top keywords
 * 4. **Verification Terms**: Keywords + "confirmed", "verified", "reports"
 *
 * **Example Output:**
 * ```ts
 * // Input: "Tesla recalls 2 million vehicles due to software issue"
 * // Output: [
 *   '"Tesla recalls 2 million vehicles due to software issue"',
 *   '"Tesla"', 'Tesla news', 'Tesla latest',
 *   '"2 million"', '2 million news', '2 million latest',
 *   '"software issue"', 'software issue news', 'software issue latest',
 *   '"Tesla" "2 million"', 'Tesla 2 million',
 *   '"Tesla" "software issue"', 'Tesla software issue',
 *   'Tesla confirmed', 'Tesla verified', 'Tesla reports',
 *   '2 million confirmed', '2 million verified', '2 million reports',
 *   // ... (total ~25 queries)
 * ]
 * ```
 *
 * @param {string} content - The news content to create queries for
 * @returns {Promise<string[]>} Array of targeted search queries (max 25)
 *
 * @example
 * ```ts
 * const queries = await generateKeywordSearchQueries(newsContent);
 * // Use with searchMultipleSources for comprehensive verification
 * const results = await searchMultipleSources(queries[0]);
 * ```
 *
 * @see extractKeywordsWithLLM - Keyword extraction
 * @see searchMultipleSources - Query execution
 * @see comprehensiveNewsSearch - Main search flow
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
 *
 * This is the main search function used by the verification system. It orchestrates
 * multiple search strategies to gather comprehensive evidence for fact-checking.
 *
 * **Search Pipeline:**
 *
 * 1. **Cache Check**: Returns cached results if available (< 24 hours old)
 * 2. **Keyword Extraction**: Uses LLM to extract important keywords
 * 3. **Query Generation**: Creates multiple search variations
 * 4. **Multi-Source Search**: Searches each query across multiple sources
 * 5. **Result Deduplication**: Removes duplicate articles by URL
 * 6. **AI Ranking**: Uses AI to rank results by relevance
 * 7. **Cache Storage**: Saves results for future use
 *
 * **Performance Optimizations:**
 * - Limits to 3 unique queries to prevent timeouts
 * - 200ms delay between searches to avoid rate limiting
 * - Early termination if too many failures
 * - Result flattening and deduplication
 *
 * **Error Handling:**
 * - Falls back to basic search if comprehensive search fails
 * - Continues even if individual queries fail
 * - Logs all major steps for debugging
 *
 * @param {string} content - The news content to verify
 * @param {function} [onStatusChange] - Optional callback for status updates
 * @returns {Promise<SearchResponse[]>} Combined search results
 *
 * @example
 * ```ts
 * // Basic usage
 * const results = await comprehensiveNewsSearch(newsArticleText);
 *
 * // With status updates
 * const results = await comprehensiveNewsSearch(
 *   newsArticleText,
 *   (status) => console.log(`Status: ${status}`)
 * );
 *
 * // Process results
 * const allArticles = results.flatMap(r =>
 *   extractNewsFromSearch(r, newsArticleText)
 * );
 * ```
 *
 * @see extractKeywordsWithLLM - Keyword extraction
 * @see generateKeywordSearchQueries - Query generation
 * @see searchMultipleSources - Multi-source search
 * @see rankSearchResultsWithFallback - AI ranking
 * @see extractNewsFromSearch - Result processing
 */
export const comprehensiveNewsSearch = async (
  content: string, 
  onStatusChange?: (status: 'searching' | 'ranking') => void
): Promise<SearchResponse[]> => {
  logger.info('Starting comprehensive news search...');
  if (onStatusChange) onStatusChange('searching');
  
  // Check cache first
  const cache = getSearchCache();
  const normalizedContent = content.trim().toLowerCase();
  if (cache[normalizedContent]) {
    const { timestamp, results } = cache[normalizedContent];
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      logger.info('Returning cached search results');
      return results;
    }
  }

  const allResults: SearchResponse[] = [];
  
  try {
    // 1. Get LLM-extracted keyword queries
    const keywordQueries = await generateKeywordSearchQueries(content);
    logger.info('Generated keyword queries:', keywordQueries.length);
    
    // 2. Get basic search variations
    const basicVariations = generateSearchVariations(content);
    logger.info('Generated basic variations:', basicVariations.length);
    
    // 3. Combine all search queries but limit more aggressively
    const allQueries = [...keywordQueries, ...basicVariations];
    const uniqueQueries = [...new Set(allQueries)].slice(0, 3); // Reduced to 3 to prevent timeouts
    
    logger.info('Total unique queries to search:', uniqueQueries.length);
    
    // 4. Search each query across multiple sources
    for (let i = 0; i < uniqueQueries.length; i++) {
      const query = uniqueQueries[i];
      
      try {
        // Search multiple sources for each query
        const sourceResults = await searchMultipleSources(query);
        allResults.push(...sourceResults);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        logger.warn(`Search failed for query: ${query}`, error);
      }
    }
    
    logger.info('Comprehensive search completed. Total results:', allResults.length);

    // 5. Flatten and rank results
    const flatResults: SearchArticle[] = [];
    allResults.forEach(res => {
      if (res.webPages?.value) flatResults.push(...res.webPages.value);
      if (res.results) flatResults.push(...res.results);
      if (res.value) flatResults.push(...res.value);
    });

    // Remove duplicates by URL
    const uniqueFlatResults = Array.from(new Map(flatResults.map(item => [item.url, item])).values());
    
    logger.info('Ranking unique results:', uniqueFlatResults.length);
    if (onStatusChange) onStatusChange('ranking');
    const rankedResults = await rankSearchResultsWithFallback(content, uniqueFlatResults);

    const finalResults = [{
      webPages: {
        value: rankedResults
      }
    }];

    // Save to cache
    const updatedCache = getSearchCache();
    updatedCache[normalizedContent] = {
      timestamp: Date.now(),
      results: finalResults
    };
    saveSearchCache(updatedCache);

    return finalResults;
    
  } catch (error) {
    logger.error('Error in comprehensive search:', error);
    // Fallback to basic search
    return await searchMultipleSources(content);
  }
};
