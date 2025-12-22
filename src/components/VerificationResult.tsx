import { useState, useEffect, memo, useRef } from 'react';
import { useNews } from '@/context/NewsContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, ExternalLink, Share2, RefreshCw, WifiOff, Image, Music, Video, FileText, ThumbsUp, ThumbsDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { extractHeadlineFromUrl, isValidUrl } from '@/utils/urlExtractor';
import { getVerificationBySlug, voteOnVerification } from '@/services/appwrite';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RELIABLE_SOURCES } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Network Status Component
const NetworkStatusAlert = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert && isOnline) return null;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        {!isOnline ? (
          "No internet connection detected. Some features may be limited."
        ) : (
          "Network connectivity restored."
        )}
      </AlertDescription>
    </Alert>
  );
};

// Virtualized List Component for Sources
interface VirtualizedSourceListProps {
  sources: { name: string; url: string }[];
  height?: number;
  itemHeight?: number;
}

const VirtualizedSourceList = memo(({ sources, height = 300, itemHeight = 56 }: VirtualizedSourceListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 2, sources.length);
  
  const visibleSources = sources.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: Math.min(height, sources.length * itemHeight) }}
      onScroll={handleScroll}
    >
      <div style={{ height: sources.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSources.map((source, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{source.name}</span>
                  {RELIABLE_SOURCES.some(rs => source.name.toLowerCase().includes(rs.toLowerCase())) && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">
                      <ShieldCheck className="h-3 w-3" />
                      Trusted
                    </div>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Virtualized Grid Component for Fact-Check Comparisons
interface VirtualizedFactCheckGridProps {
  items: { source: string; verdict: string; url?: string }[];
  height?: number;
  itemHeight?: number;
}

const VirtualizedFactCheckGrid = memo(({ items, height = 250, itemHeight = 80 }: VirtualizedFactCheckGridProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemsPerRow = 2;
  const visibleRows = Math.ceil(height / itemHeight);
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const startRow = Math.floor(scrollTop / itemHeight);
  const endRow = Math.min(startRow + visibleRows + 2, totalRows);

  const visibleItems = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const index = row * itemsPerRow + col;
      if (index < items.length) {
        visibleItems.push({ item: items[index], index, row, col });
      }
    }
  }

  const offsetY = startRow * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: Math.min(height, totalRows * itemHeight) }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalRows * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleItems.map(({ item, index }) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{item.source}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                    item.verdict.toLowerCase().includes('true') ? "bg-green-100 text-green-700" :
                    item.verdict.toLowerCase().includes('false') ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  )}>
                    {item.verdict}
                  </span>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    View full report <ExternalLink className="h-2 w-2" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Virtualized List Component for Manipulation Indicators
interface VirtualizedIndicatorListProps {
  indicators: string[];
  height?: number;
  itemHeight?: number;
}

const VirtualizedIndicatorList = memo(({ indicators, height = 200, itemHeight = 32 }: VirtualizedIndicatorListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 2, indicators.length);
  
  const visibleIndicators = indicators.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: Math.min(height, indicators.length * itemHeight) }}
      onScroll={handleScroll}
    >
      <div style={{ height: indicators.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleIndicators.map((indicator, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              <div className="flex items-start gap-2 text-sm text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <span>{indicator}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

interface VerificationResultProps {
  className?: string;
}

const VerificationResult = memo(({ className }: VerificationResultProps) => {
  const { result, status, resetState, newsContent, searchQuery } = useNews();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoadingHeadline, setIsLoadingHeadline] = useState<boolean>(false);
  const [fetchedQuery, setFetchedQuery] = useState('');
  const [docId, setDocId] = useState<string | null>(null);
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [hasVoted, setHasVoted] = useState<'up' | 'down' | null>(null);

  // Get the query from URL params or context
  const query = searchParams.get('q') || fetchedQuery || searchQuery;
  const content = newsContent || query;

  // Fetch original query if we have a slug but no query in context
  useEffect(() => {
    const fetchOriginalData = async () => {
      if (slug && !searchQuery && !searchParams.get('q')) {
        try {
          const data = await getVerificationBySlug(slug);
          if (data) {
            if (data.query) setFetchedQuery(data.query);
            if (data.id) setDocId(data.id);
            setVotes({ 
              up: data.upvotes || 0, 
              down: data.downvotes || 0 
            });
          }
        } catch (error) {
          logger.error('Error fetching original data:', error);
        }
      }
    };

    fetchOriginalData();
  }, [slug, searchQuery, searchParams]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!docId || hasVoted) return;

    try {
      await voteOnVerification(docId, type);
      setVotes(prev => ({
        ...prev,
        [type]: prev[type] + 1
      }));
      setHasVoted(type);
      toast({
        title: "Vote recorded",
        description: "Thank you for your feedback!",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Extract headline if query is a URL
  useEffect(() => {
    const extractContent = async () => {
      const currentQuery = query || content;
      if (currentQuery && isValidUrl(currentQuery)) {
        setIsLoadingHeadline(true);
        try {
          const headline = await extractHeadlineFromUrl(currentQuery);
          setOriginalContent(headline);
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

    extractContent();
  }, [query, content]);

  if (status !== 'verified' || !result) {
    return null;
  }
  const getStatusIcon = () => {
    switch (result.veracity) {
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
    switch (result.veracity) {
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

  const getStatusText = () => {
    switch (result.veracity) {
      case 'true':
        return 'True';
      case 'false':
        return 'False';
      case 'partially-true':
        return 'Partially True';
      default:
        return 'Unverified';
    }
  };

  // Try to get slug from URL if not present in result
  const handleShareResult = async () => {
    let currentSlug = slug || '';
    if (!currentSlug && typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/result\/(\w{8})/);
      if (match) currentSlug = match[1];
    }
    
    const url = `${window.location.origin}/result/${currentSlug}`;
    const reportText = `
🔍 VerifyNews Report
-------------------
Content: ${originalContent}
Veracity: ${getStatusText()} (${result.confidence}%)
Provider: ${result.provider || 'AI'}
Analysis: ${result.explanation}

Check the full report here: ${url}
    `.trim();

    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VerifyNews Result',
          text: reportText,
          url,
        });
        shared = true;
      } catch {
        // fallback to copy
      }
    }
    if (!shared) {
      await navigator.clipboard.writeText(`${reportText}\n\nFull report: ${url}`);
      toast({
        title: 'Report copied',
        description: 'Full verification report copied to clipboard.',
        duration: 3000,
      });
    }
  };

  const handleVerifyAnother = () => {
    resetState(); // Clear all search/verification state
    navigate('/', { replace: true }); // Navigate to home page
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <NetworkStatusAlert />
      
      {/* Result Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Status Header */}
        <div className={cn(
          "px-6 py-5 border-b",
          result.veracity === 'true' ? "bg-truth/5 border-truth/20" : 
          result.veracity === 'false' ? "bg-falsehood/5 border-falsehood/20" : 
          result.veracity === 'partially-true' ? "bg-warning/5 border-warning/20" : "bg-muted/50 border-border"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center justify-center h-12 w-12 rounded-full",
              result.veracity === 'true' ? "bg-truth/10" : 
              result.veracity === 'false' ? "bg-falsehood/10" : 
              result.veracity === 'partially-true' ? "bg-warning/10" : "bg-muted"
            )}>
              {getStatusIcon()}
            </div>
            <div>
              <div className={cn(
                "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full mb-1",
                getStatusColor()
              )}>
                {getStatusText()}
                {typeof result.confidence === 'number' && (
                  <span className="ml-1.5 opacity-75">• {result.confidence}%</span>
                )}
                {result.provider && (
                  <span className="ml-1.5 opacity-75">• via {result.provider}</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-foreground">Verification Complete</h2>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Content */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Content Verified</h3>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                {isLoadingHeadline ? 'Loading...' : originalContent}
              </p>
              {/^https?:\/\//.test(query || content) && (
                <a 
                  href={query || content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View source
                </a>
              )}
            </div>
          </div>
          
          {/* Explanation */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Analysis</h3>
            <p className="text-sm text-foreground leading-relaxed">{result.explanation || 'No explanation provided.'}</p>
          </div>

          {/* Sentiment Analysis */}
          {result.sentiment && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Sentiment & Tone</h3>
              <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">{result.sentiment.label}</p>
                  <p className="text-xs text-muted-foreground">{result.sentiment.emotionalTone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        result.sentiment.score > 0 ? "bg-truth" : 
                        result.sentiment.score < 0 ? "bg-falsehood" : "bg-muted-foreground"
                      )}
                      style={{ width: `${Math.abs(result.sentiment.score) * 100}%`, marginLeft: result.sentiment.score < 0 ? '0' : 'auto' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {result.sentiment.score > 0 ? '+' : ''}{result.sentiment.score.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Media Analysis */}
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
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground leading-relaxed">{result.mediaAnalysis.description}</p>
                  </div>
                )}
                {result.mediaAnalysis.transcription && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Transcription</p>
                    <p className="text-sm text-foreground leading-relaxed bg-background/50 p-3 rounded border border-border">
                      {result.mediaAnalysis.transcription}
                    </p>
                  </div>
                )}
                {result.mediaAnalysis.manipulationIndicators && result.mediaAnalysis.manipulationIndicators.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Manipulation Indicators</p>
                    <VirtualizedIndicatorList
                      indicators={result.mediaAnalysis.manipulationIndicators}
                      height={result.mediaAnalysis.manipulationIndicators.length > 6 ? 200 : result.mediaAnalysis.manipulationIndicators.length * 32}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fact-check Comparison */}
          {result.factCheckComparison && result.factCheckComparison.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Fact-Checkers</h3>
              <VirtualizedFactCheckGrid
                items={result.factCheckComparison}
                height={result.factCheckComparison.length > 4 ? 250 : result.factCheckComparison.length * 40}
              />
            </div>
          )}
          
          {/* Corrected Info */}
          {result.correctedInfo && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Correction</h3>
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <p className="text-sm text-foreground leading-relaxed">{result.correctedInfo}</p>
              </div>
            </div>
          )}
          
          {/* Sources */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Sources</h3>
            {result.sources && Array.isArray(result.sources) && result.sources.filter(s => s.url && s.url.startsWith('http')).length > 0 ? (
              <VirtualizedSourceList
                sources={result.sources.filter(s => s.url && s.url.startsWith('http'))}
                height={result.sources.length > 10 ? 300 : result.sources.length * 56}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">No sources available</p>
            )}
          </div>
        </div>
        
        {/* Community Voting */}
        {docId && (
          <div className="px-6 py-4 border-t border-border bg-muted/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Was this verification helpful?</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('up')}
                  disabled={!!hasVoted}
                  className={cn(
                    "h-8 px-3 gap-1.5",
                    hasVoted === 'up' && "text-green-600 bg-green-50 hover:bg-green-50"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs font-semibold">{votes.up}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('down')}
                  disabled={!!hasVoted}
                  className={cn(
                    "h-8 px-3 gap-1.5",
                    hasVoted === 'down' && "text-red-600 bg-red-50 hover:bg-red-50"
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="text-xs font-semibold">{votes.down}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex flex-wrap gap-3">
          <Button 
            onClick={handleVerifyAnother}
            variant="outline"
            className="flex-1 min-w-[140px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verify Another
          </Button>
          <Button
            onClick={handleShareResult}
            className="flex-1 min-w-[140px]"
          >
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
