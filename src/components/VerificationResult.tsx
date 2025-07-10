import React, { useState, useEffect } from 'react';
import { useNews } from '@/context/NewsContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, ExternalLink, Share2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { extractHeadlineFromUrl, isValidUrl } from '@/utils/urlExtractor';
import { getVerificationBySlug } from '@/services/firebaseService';
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
          if (data && (data as any).query) {
            setFetchedQuery((data as any).query);
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
      } catch (err) {
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
    <div className={cn('w-full animate-scale-in', className)}>
      <NetworkStatusAlert />
      <div className="glass-card p-4 sm:p-6 lg:p-8 mx-auto max-w-2xl overflow-hidden">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className={cn("flex items-center justify-center p-1.5 sm:p-2 rounded-full", 
            result.veracity === 'true' ? "bg-truth/10" : 
            result.veracity === 'false' ? "bg-falsehood/10" : 
            result.veracity === 'partially-true' ? "bg-amber-500/10" : "bg-neutral/10"
          )}>
            {getStatusIcon()}
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <div className={cn("inline-flex items-center px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full", getStatusColor())}>
              {getStatusText()}
              {typeof result.confidence === 'number' && (
                <span className="ml-1 text-xs opacity-70">{result.confidence}% confidence</span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-foreground mt-1">Verification Complete</h2>
          </div>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Original News Content */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-medium text-foreground/80">Original Content</h3>
            <div className="p-3 sm:p-4 rounded-xl bg-foreground/5 border border-foreground/10">
              <p className="text-foreground text-sm sm:text-base leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                {isLoadingHeadline ? 'Extracting headline...' : originalContent}
              </p>
              {/^https?:\/\//.test(query || content) && (
                <div className="mt-2 pt-2 border-t border-foreground/10">
                  <a 
                    href={query || content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Original URL
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-medium text-foreground/80">AI Explanation</h3>
            <p className="text-foreground text-sm sm:text-base leading-relaxed">{result.explanation || 'No explanation provided.'}</p>
          </div>
          
          {result.correctedInfo && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground/80">Corrected Information</h3>
              <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                <p className="text-foreground text-base leading-relaxed">{result.correctedInfo}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground/80">Sources</h3>
            <div className="space-y-2">
              {result.sources && Array.isArray(result.sources) && result.sources.filter(s => s.url && s.url.startsWith('http')).length > 0 ? (
                result.sources.filter(s => s.url && s.url.startsWith('http')).map((source, index) => (
                  <a 
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200 group"
                  >
                    <span className="text-foreground">{source.name}</span>
                    <ExternalLink className="h-4 w-4 text-foreground/40 group-hover:text-foreground/80 transition-colors duration-200" />
                  </a>
                ))
              ) : (
                <p className="text-foreground/60 text-sm italic">No real sources provided.</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <Button 
              onClick={handleVerifyAnother}
              variant="outline"
              className="flex-1 border border-foreground/10 bg-background/50 hover:bg-foreground/5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verify Another
            </Button>
            <Button
              variant="default"
              className="flex-1 glass-button bg-primary text-white hover:bg-primary/90"
              onClick={handleShareResult}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Result
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
