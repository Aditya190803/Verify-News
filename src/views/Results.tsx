import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import VerificationResult from '@/components/VerificationResult';
import { useNews } from '@/context/NewsContext';
import { fetchVerificationBySlug } from '@/services/aggregation';
import { VerificationResult as VerificationResultType } from '@/types/news';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ShareButtons } from '@/components/ui/share-buttons';
import { SEO } from '@/components/SEO';
import { SkeletonResultPage } from '@/components/ui/skeleton-loaders';
import { logger } from '@/lib/logger';

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    result: contextResult,
    status: contextStatus,
    setResult,
    setStatus,
    resetState,
    setSearchQuery,
    setNewsContent,
  } = useNews();
  const { slug } = useParams();

  const urlSlug = slug || searchParams.get('slug');
  const [loading, setLoading] = useState(!!urlSlug);
  const [fetching, setFetching] = useState(false);
  const [fetchedResult, setFetchedResult] = useState<VerificationResultType | null>(null);
  const [fetchedQuery, setFetchedQuery] = useState('');

  const query = searchParams.get('q') || fetchedQuery;

  useEffect(() => {
    if (!urlSlug) return;
    setLoading(true);
    setFetching(true);
    fetchVerificationBySlug(urlSlug)
      .then((row) => {
        const data = row?.result?.data;
        if (!data) {
          setFetchedResult(null);
          setStatus('error');
          return;
        }
        const parsedResult = data as VerificationResultType;
        const preview = row.result?.contentPreview ?? parsedResult.explanation ?? '';
        setFetchedResult(parsedResult);
        setFetchedQuery(preview);
        setSearchQuery(preview);
        setNewsContent(preview);
        setResult(parsedResult);
        setStatus('verified');
      })
      .catch((error) => {
        logger.error('Error fetching by slug:', error);
        setFetchedResult(null);
        setStatus('error');
      })
      .finally(() => {
        setLoading(false);
        setFetching(false);
      });
  }, [urlSlug, setResult, setStatus, setSearchQuery, setNewsContent]);

  const result = urlSlug ? fetchedResult : contextResult;
  const status = urlSlug ? (loading ? 'verifying' : fetchedResult ? 'verified' : 'error') : contextStatus;

  useEffect(() => {
    if (!urlSlug && (!query || (!result && status !== 'verifying'))) {
      navigate('/', { replace: true });
    }
  }, [urlSlug, query, result, status, navigate]);

  const handleBack = () => {
    resetState();
    navigate('/', { replace: true });
  };

  if (!urlSlug && !query) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            disabled={loading || fetching}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {result && <ShareButtons title={query} />}
        </div>
        {loading || fetching ? (
          <SkeletonResultPage />
        ) : result ? (
          <>
            <SEO title={query} description={result.explanation} />
            <VerificationResult result={result} query={query} />
          </>
        ) : (
          <p className="text-muted-foreground text-center">Result not found.</p>
        )}
      </main>
    </div>
  );
};

export default Results;