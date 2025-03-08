
/**
 * Utility functions for searching news via DuckDuckGo
 */

/**
 * Search DuckDuckGo for news on a given topic
 * @param query The search query
 * @returns The search results
 */
export const searchDuckDuckGo = async (query: string) => {
  try {
    // Using the DuckDuckGo API via a proxy to avoid CORS issues
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&t=VerifyNews`);
    
    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching DuckDuckGo:', error);
    throw error;
  }
};

/**
 * Score the relevance of a news article based on keywords and content
 * @param article The article to score
 * @param query The search query
 * @returns A relevance score (higher is more relevant)
 */
const scoreArticleRelevance = (article: any, query: string) => {
  const queryTerms = query.toLowerCase().split(' ');
  let score = 0;
  
  // Score based on title match
  const title = article.title?.toLowerCase() || '';
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 5;
  });
  
  // Score based on content match
  const snippet = article.snippet?.toLowerCase() || '';
  queryTerms.forEach(term => {
    if (snippet.includes(term)) score += 3;
  });
  
  // Bonus for having a URL
  if (article.url) score += 2;
  
  // Bonus for known reputable sources
  const reputableDomains = [
    'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com', 
    'washingtonpost.com', 'theguardian.com', 'npr.org', 'wsj.com', 
    'bloomberg.com', 'cnn.com', 'nbcnews.com', 'abcnews.go.com', 'cbsnews.com'
  ];
  
  if (article.url) {
    try {
      const domain = new URL(article.url).hostname;
      if (reputableDomains.some(d => domain.includes(d))) {
        score += 10;
      }
    } catch (e) {
      // Invalid URL, don't add bonus
    }
  }
  
  return score;
};

/**
 * Extract relevant news articles from DuckDuckGo search results
 * @param results The DuckDuckGo search results
 * @param query The original search query
 * @returns An array of news articles sorted by relevance
 */
export const extractNewsFromSearch = (results: any, query: string) => {
  const articles = [];
  
  // Extract news from the "RelatedTopics" section
  if (results?.RelatedTopics?.length > 0) {
    for (const topic of results.RelatedTopics) {
      if (topic.Text) {
        articles.push({
          title: topic.Text.substring(0, topic.Text.indexOf(' - ') > 0 ? topic.Text.indexOf(' - ') : topic.Text.length),
          snippet: topic.Text,
          url: topic.FirstURL || '',
        });
      }
    }
  }
  
  // If no topics found or if we want to also include the main results
  if (results?.AbstractText) {
    articles.push({
      title: results.Heading || 'News Result',
      snippet: results.AbstractText,
      url: results.AbstractURL || '',
    });
  }
  
  // Sort articles by relevance score
  return articles
    .sort((a, b) => scoreArticleRelevance(b, query) - scoreArticleRelevance(a, query))
    .slice(0, 10); // Limit to top 10 most relevant results
};
