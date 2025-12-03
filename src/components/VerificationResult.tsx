import React, { useState, useEffect } from 'react';
import { useNews } from '@/context/NewsContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, ExternalLink, Share2, RefreshCw, WifiOff, Image, Music, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { extractHeadlineFromUrl, isValidUrl } from '@/utils/urlExtractor';
import { getVerificationBySlug } from '@/services/appwriteService';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface VerificationResultProps {
  className?: string;
}

const VerificationResult = ({ className }: VerificationResultProps) => {
  const { result, status, resetState, newsContent, searchQuery } = useNews();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoadingHeadline, setIsLoadingHeadline] = useState<boolean>(false);
  const [fetchedQuery, setFetchedQuery] = useState('');

  // Get the query from URL params or context
  const query = searchParams.get('q') || fetchedQuery || searchQuery;
  const content = newsContent || query;

  // Fetch original query if we have a slug but no query in context
  useEffect(() => {
    const fetchOriginalData = async () => {
      if (slug && !searchQuery && !searchParams.get('q')) {
        try {
          const data = await getVerificationBySlug(slug);
          if (data && data.query) {
            setFetchedQuery(data.query);
          }
        } catch (error) {
          console.error('Error fetching original data:', error);
        }
      }
    };

    fetchOriginalData();
  }, [slug, searchQuery, searchParams]);

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
          console.error('Error extracting headline:', error);
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
    let slug = '';
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/result\/(\w{8})/);
      if (match) slug = match[1];
    }
    const url = `${window.location.origin}/result/${slug}`;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VerifyNews Result',
          text: 'Check out this verification result on VerifyNews:',
          url,
        });
        shared = true;
      } catch {
        // fallback to copy
      }
    }
    if (!shared) {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Result link copied to clipboard.',
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
                    <ul className="space-y-1">
                      {result.mediaAnalysis.manipulationIndicators.map((indicator, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
            <div className="space-y-2">
              {result.sources && Array.isArray(result.sources) && result.sources.filter(s => s.url && s.url.startsWith('http')).length > 0 ? (
                result.sources.filter(s => s.url && s.url.startsWith('http')).map((source, index) => (
                  <a 
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
                  >
                    <span className="text-sm text-foreground">{source.name}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No sources available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex gap-3">
          <Button 
            onClick={handleVerifyAnother}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verify Another
          </Button>
          <Button
            onClick={handleShareResult}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
