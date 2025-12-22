import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchHistoryContext } from '../context/SearchHistoryContext';
import { getLLMGeneratedTitle } from '@/utils/llmHelpers';
import { NewsArticle, VerificationResult, VerificationStatus, MediaFile } from '@/types/news';
import { useSearch } from './useSearch';
import { useVerification } from './useVerification';
import { urlExtractor, extractHeadlineFromUrl } from '@/utils/urlExtractor';

export function useNewsState() {
  const [newsContent, setNewsContent] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  
  const { currentUser } = useAuth();
  const { refreshSearchHistory } = useSearchHistoryContext();

  const { searchQuery, setSearchQuery, searchNews } = useSearch({
    userId: currentUser?.uid,
    onSearchStart: () => setStatus('searching'),
    onSearchEnd: (newArticles) => {
      setArticles(newArticles);
      setSelectedArticle(newArticles[0]);
      setNewsContent(newArticles[0].snippet);
      setStatus('idle');
    },
    onSearchError: () => setStatus('error'),
    refreshHistory: refreshSearchHistory
  });

  const { verifyNews, verifyMedia } = useVerification({
    userId: currentUser?.uid,
    refreshHistory: refreshSearchHistory,
    onStatusChange: setStatus,
    onResultReady: setResult
  });

  const resetState = useCallback(() => {
    setSearchQuery('');
    setNewsContent('');
    setStatus('idle');
    setResult(null);
    setArticles([]);
    setSelectedArticle(null);
    setMediaFile(null);
  }, [setSearchQuery]);

  const handleUnifiedInput = async (value: string, media?: MediaFile) => {
    if (!value.trim() && !media) return;

    const slug = Math.random().toString(36).substring(2, 15);
    const llmTitle = await getLLMGeneratedTitle(value || 'Media Verification');

    if (media) {
      await verifyMedia(media, value, slug, llmTitle);
      return slug;
    }

    const extractedUrls = urlExtractor(value);
    const isOnlyUrl = extractedUrls.length === 1 && extractedUrls[0] === value.trim();

    if (isOnlyUrl) {
      setStatus('verifying');
      const url = extractedUrls[0];
      const title = await extractHeadlineFromUrl(url);
      await verifyNews(title || url, url, null, slug, llmTitle);
    } else if (extractedUrls.length > 0) {
      const searchResults = await searchNews(value, slug, llmTitle);
      if (searchResults && searchResults.length > 0) {
        await verifyNews(searchResults[0].snippet, value, searchResults[0], slug, llmTitle);
      }
    } else {
      await verifyNews(value, value, null, slug, llmTitle);
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
    mediaFile,
    setMediaFile,
    searchNews,
    verifyNews: () => verifyNews(newsContent, searchQuery, selectedArticle),
    resetState,
    handleUnifiedInput,
  };
}
