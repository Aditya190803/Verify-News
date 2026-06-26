import { RELIABLE_SOURCES } from '@/lib/constants';
import type { SearchArticle } from '@/types/news';

export function scoreArticleRelevance(article: SearchArticle, query: string): number {
  let score = 0;
  const queryTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const title = (article.title || article.name || '').toLowerCase();
  score += queryTerms.filter((term) => title.includes(term)).length * 10;
  const snippet = (article.snippet || '').toLowerCase();
  score += queryTerms.filter((term) => snippet.includes(term)).length * 5;
  if (article.datePublished) {
    try {
      const daysOld = (Date.now() - new Date(article.datePublished).getTime()) / 86_400_000;
      if (daysOld < 7) score += 15;
      else if (daysOld < 30) score += 10;
      else if (daysOld < 90) score += 5;
      else if (daysOld < 365) score += 2;
    } catch {
      /* ignore */
    }
  }
  const url = (article.url || '').toLowerCase();
  if (RELIABLE_SOURCES.some((d) => url.includes(d))) score += 25;
  if (['snopes.com', 'politifact.com', 'factcheck.org', 'fullfact.org'].some((d) => url.includes(d))) score += 30;
  if (url.includes('.gov') || url.includes('.edu')) score += 20;
  if (['infowars.com', 'naturalnews.com', 'beforeitsnews.com'].some((d) => url.includes(d))) score -= 50;
  const suspicious = ['clickbait', 'viral', 'shocking', 'unbelievable', 'free-money'];
  if (suspicious.some((p) => title.includes(p) || snippet.includes(p))) score -= 15;
  const snippetLength = (article.snippet || '').length;
  if (snippetLength > 200) score += 8;
  else if (snippetLength > 100) score += 4;
  if (article.summary && article.summary.length > 0) score += 3;
  if (url.startsWith('https://')) score += 2;
  const queryPhrase = query.toLowerCase();
  if (title.includes(queryPhrase)) score += 25;
  if (snippet.includes(queryPhrase)) score += 15;
  return Math.max(0, score);
}