import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { comprehensiveNewsSearch } from '@/utils/searchUtils';
import { verifyViaApi } from '@/services/aggregation';
import { VerificationResult, VerificationStatus, NewsArticle, MediaFile } from '@/types/news';
import { logger } from '@/lib/logger';

function createFallbackResult(errorMessage: string, articleUrl?: string): VerificationResult {
  return {
    veracity: 'unverified',
    confidence: 0,
    explanation: `Verification failed: ${errorMessage}`,
    sources: articleUrl ? [{ name: 'Original Article', url: articleUrl }] : [],
  };
}

interface UseVerificationProps {
  refreshHistory: () => void;
  onStatusChange: (status: VerificationStatus) => void;
  onResultReady: (result: VerificationResult) => void;
}

export const useVerification = ({
  refreshHistory,
  onStatusChange,
  onResultReady,
}: UseVerificationProps) => {
  const navigate = useNavigate();

  const verifyNews = useCallback(
    async (
      content: string,
      query: string,
      selectedArticle?: NewsArticle | null,
      forcedSlug?: string,
    ) => {
      try {
        onStatusChange('verifying');
        if (!content.trim()) throw new Error('Please provide news content to verify');

        let searchPayload: unknown[] = [];
        try {
          const currentSearchResults = await comprehensiveNewsSearch(content || query);
          searchPayload = currentSearchResults.flatMap((r) => r.value ?? r.results ?? []);
        } catch (searchError) {
          logger.warn('Search skipped for verify:', searchError);
        }

        const { success, data } = await verifyViaApi(
          content,
          selectedArticle?.url,
          searchPayload,
        );

        const parsedResult = success ? data : createFallbackResult(data.explanation, selectedArticle?.url);

        if (selectedArticle?.url && !parsedResult.sources.some((s) => s.url === selectedArticle.url)) {
          parsedResult.sources.unshift({
            name: selectedArticle.title || 'Original Article',
            url: selectedArticle.url,
          });
        }

        onResultReady(parsedResult);
        onStatusChange('verified');
        refreshHistory();

        const slug = forcedSlug ?? parsedResult.id ?? content.slice(0, 32);
        navigate(`/result/${slug}`);
      } catch (error) {
        logger.error('Verification failed:', error);
        onStatusChange('error');
        throw error;
      }
    },
    [refreshHistory, onStatusChange, onResultReady, navigate],
  );

  const verifyMedia = useCallback(
    async (_mediaFile: MediaFile, _query?: string, forcedSlug?: string) => {
      onStatusChange('error');
      throw new Error('Media verify is not enabled; use text or URL.');
    },
    [onStatusChange],
  );

  return { verifyNews, verifyMedia };
};