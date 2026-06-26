import type { NewsArticle, SearchArticle, SearchResponse } from '@/types/news';
import { scoreArticleRelevance } from './scoring';

export function extractNewsFromSearch(results: SearchResponse, query: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  if (results?.webPages?.value?.length) {
    for (const result of results.webPages.value) {
      if (result.name && result.snippet) {
        articles.push({
          title: result.name,
          snippet: result.snippet,
          url: result.url || result.displayUrl || '',
          summary: result.summary || result.snippet,
          datePublished: result.datePublished,
          dateLastCrawled: result.dateLastCrawled,
        });
      }
    }
  }
  if (articles.length === 0 && results?.value?.length) {
    for (const result of results.value) {
      if (result.name && result.snippet) {
        articles.push({
          title: result.name,
          snippet: result.snippet,
          url: result.url || result.displayUrl || '',
          summary: result.summary || result.snippet,
        });
      }
    }
  }
  return articles
    .sort((a, b) => {
      const articleA: SearchArticle = { name: a.title, snippet: a.snippet, url: a.url };
      const articleB: SearchArticle = { name: b.title, snippet: b.snippet, url: b.url };
      return scoreArticleRelevance(articleB, query) - scoreArticleRelevance(articleA, query);
    })
    .slice(0, 10);
}