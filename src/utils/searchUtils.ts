
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
 * Extract relevant news articles from DuckDuckGo search results
 * @param results The DuckDuckGo search results
 * @returns An array of news articles
 */
export const extractNewsFromSearch = (results: any) => {
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
  
  return articles;
};
