import { useState, useEffect, memo } from 'react';
import { useNews } from '@/context/NewsContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, ExternalLink, Share2, RefreshCw, Image, Music, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { extractHeadlineFromUrl, isValidUrl } from '@/utils/urlExtractor';
import { logger } from '@/lib/logger';
import { normalizeVeracity, veracityLabel } from '@/lib/veracityUi';
import { NetworkStatusAlert } from '@/components/verification/NetworkStatusAlert';
import { VirtualizedSourceList } from '@/components/verification/VirtualizedSourceList';
import { VirtualizedFactCheckGrid } from '@/components/verification/VirtualizedFactCheckGrid';
import { VirtualizedIndicatorList } from '@/components/verification/VirtualizedIndicatorList';

interface VerificationResultProps {
  className?: string;
}

const VerificationResult = memo(({ className }: VerificationResultProps) => {
  const { result, status, resetState, newsContent, searchQuery } = useNews();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const [originalContent, setOriginalContent] = useState('');
  const [isLoadingHeadline, setIsLoadingHeadline] = useState(false);
  const [fetchedQuery, setFetchedQuery] = useState('');

  const query = searchParams.get('q') || fetchedQuery || searchQuery;
  const content = newsContent || query;
  const veracity = normalizeVeracity(result?.veracity);

  useEffect(() => {
    if (slug && !searchQuery && !searchParams.get('q')) setFetchedQuery(slug);
  }, [slug, searchQuery, searchParams]);

  useEffect(() => {
    const extractContent = async () => {
      const currentQuery = query || content;
      if (currentQuery && isValidUrl(currentQuery)) {
        setIsLoadingHeadline(true);
        try {
          setOriginalContent((await extractHeadlineFromUrl(currentQuery)) || currentQuery);
        } catch (error) {
          logger.error('Error extracting headline:', error);
          setOriginalContent(currentQuery);
        } finally {
          setIsLoadingHeadline(false);
        }
      } else {
        setOriginalContent(currentQuery || 'No content available');
      }
    };
    void extractContent();
  }, [query, content]);

  if (status !== 'verified' || !result) return null;

  const getStatusIcon = () => {
    switch (veracity) {
      case 'true':
        return <Check className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-truth" />;
      case 'false':
        return <X className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-falsehood" />;
      case 'partially-true':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (veracity) {
      case 'true':
        return 'bg-truth/10 text-truth border-truth/20';
      case 'false':
        return 'bg-falsehood/10 text-falsehood border-falsehood/20';
      case 'partially-true':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-neutral/10 text-neutral border-neutral/20';
    }
  };

  const handleShareResult = async () => {
    let currentSlug = slug || '';
    if (!currentSlug && typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/result\/(\w+)/);
      if (match) currentSlug = match[1];
    }
    const url = `${window.location.origin}/result/${currentSlug}`;
    const reportText = `Facets report\nContent: ${originalContent}\nVeracity: ${veracityLabel(result.veracity)} (${result.confidence}%)\n${result.explanation}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Facets result', text: reportText, url });
        return;
      }
    } catch {
      /* clipboard */
    }
    await navigator.clipboard.writeText(reportText);
    toast({ title: 'Report copied', description: 'Verification report copied to clipboard.', duration: 3000 });
  };

  const httpSources = (result.sources ?? []).filter((s) => s.url?.startsWith('http'));

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <NetworkStatusAlert />
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          className={cn(
            'px-6 py-5 border-b',
            veracity === 'true' ? 'bg-truth/5 border-truth/20' :
            veracity === 'false' ? 'bg-falsehood/5 border-falsehood/20' :
            veracity === 'partially-true' ? 'bg-warning/5 border-warning/20' : 'bg-muted/50 border-border',
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-full',
                veracity === 'true' ? 'bg-truth/10' :
                veracity === 'false' ? 'bg-falsehood/10' :
                veracity === 'partially-true' ? 'bg-warning/10' : 'bg-muted',
              )}
            >
              {getStatusIcon()}
            </div>
            <div>
              <div className={cn('inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full mb-1', getStatusColor())}>
                {veracityLabel(result.veracity)}
                {typeof result.confidence === 'number' && <span className="ml-1.5 opacity-75">• {result.confidence}%</span>}
                {result.provider && <span className="ml-1.5 opacity-75">• via {result.provider}</span>}
              </div>
              <h2 className="text-lg font-semibold text-foreground">Verification Complete</h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Content Verified</h3>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {isLoadingHeadline ? 'Loading...' : originalContent}
              </p>
              {/^https?:\/\//.test(query || content) && (
                <a href={query || content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  View source
                </a>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Analysis</h3>
            <p className="text-sm text-foreground leading-relaxed">{result.explanation || 'No explanation provided.'}</p>
          </div>
          {result.mediaAnalysis && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                {result.mediaAnalysis.type === 'image' && <Image className="h-4 w-4" />}
                {result.mediaAnalysis.type === 'audio' && <Music className="h-4 w-4" />}
                {result.mediaAnalysis.type === 'video' && <Video className="h-4 w-4" />}
                {result.mediaAnalysis.type === 'text' && <FileText className="h-4 w-4" />}
                Media Analysis
              </h3>
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                {result.mediaAnalysis.description && (
                  <p className="text-sm text-foreground leading-relaxed">{result.mediaAnalysis.description}</p>
                )}
                {result.mediaAnalysis.transcription && (
                  <p className="text-sm text-foreground leading-relaxed bg-background/50 p-3 rounded border border-border">
                    {result.mediaAnalysis.transcription}
                  </p>
                )}
                {result.mediaAnalysis.manipulationIndicators?.length ? (
                  <VirtualizedIndicatorList indicators={result.mediaAnalysis.manipulationIndicators} height={200} />
                ) : null}
              </div>
            </div>
          )}
          {result.factCheckComparison && result.factCheckComparison.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Fact-Checkers</h3>
              <VirtualizedFactCheckGrid items={result.factCheckComparison} height={250} />
            </div>
          )}
          {result.correctedInfo && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Correction</h3>
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <p className="text-sm text-foreground leading-relaxed">{result.correctedInfo}</p>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Sources</h3>
            {httpSources.length > 0 ? (
              <VirtualizedSourceList sources={httpSources} height={httpSources.length > 10 ? 300 : httpSources.length * 56} />
            ) : (
              <p className="text-sm text-muted-foreground italic">No sources available</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/20 border-t border-border flex flex-wrap gap-3">
          <Button onClick={() => { resetState(); navigate('/', { replace: true }); }} variant="outline" className="flex-1 min-w-[140px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Verify Another
          </Button>
          <Button onClick={() => void handleShareResult()} className="flex-1 min-w-[140px]">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
});

VerificationResult.displayName = 'VerificationResult';
export default VerificationResult;