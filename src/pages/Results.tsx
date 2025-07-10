import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import VerificationResult from '@/components/VerificationResult';
import SearchHistory from '@/components/SearchHistory';
import { useNews } from '@/context/NewsContext';
import { getVerificationBySlug } from '@/services/firebaseService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, ChevronRight, Clock, History } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { extractHeadlineFromUrl, isValidUrl } from '@/utils/urlExtractor';

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { result: contextResult, status: contextStatus, setResult, setStatus, resetState, setSearchQuery, setNewsContent } = useNews();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [showSearchHistory, setShowSearchHistory] = useLocalStorage('showSearchHistory', false);
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchedResult, setFetchedResult] = useState(null);
  const [fetchedQuery, setFetchedQuery] = useState('');
  const [fetchedType, setFetchedType] = useState('');

  // Prefer slug from /result/:slug, fallback to search param
  const urlSlug = slug || searchParams.get('slug');
  const query = searchParams.get('q') || fetchedQuery;
  const type = searchParams.get('type') || fetchedType;

  // Fetch result by slug if present
  useEffect(() => {
    if (urlSlug) {
      setLoading(true);
      getVerificationBySlug(urlSlug).then((data: any) => {
        console.log('Fetched data by slug:', data); // Debug log
        if (data && data.result) {
          // All documents should have { result: VerificationResult, ... } structure
          setFetchedResult(data.result);
          setFetchedQuery(data.query || '');
          setFetchedType(data.type || '');
          setResult(data.result);
          setStatus('verified');
          // Set the original query/content in context for VerificationResult component
          setSearchQuery(data.query || '');
          setNewsContent(data.newsContent || data.query || '');
        } else {
          console.log('No valid result found in document:', data);
          setFetchedResult(null);
          setStatus('error');
        }
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching by slug:', error);
        setFetchedResult(null);
        setStatus('error');
        setLoading(false);
      });
    }
  }, [urlSlug, setResult, setStatus]);

  const result = urlSlug ? fetchedResult : contextResult;
  const status = urlSlug ? (loading ? 'verifying' : (fetchedResult ? 'verified' : 'error')) : contextStatus;

  const toggleSearchHistory = () => {
    setShowSearchHistory(prev => !prev);
  };

  const closeSidebar = () => {
    setShowSearchHistory(false);
  };

  useEffect(() => {
    // If no query or result, redirect to home
    if (!urlSlug && (!query || (!result && status !== 'verifying'))) {
      navigate('/', { replace: true });
    }
  }, [urlSlug, query, result, status, navigate]);

  const handleBackToSearch = () => {
    resetState(); // Clear all search/verification state 
    navigate('/', { replace: true });
  };

  const handleGoHome = () => {
    resetState(); // Clear all search/verification state
    navigate('/', { replace: true });
  };

  if (!urlSlug && !query) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar - Full Height */}
      {(currentUser || process.env.NODE_ENV === 'development') && !isMobile && (
        <div>
          {showSearchHistory ? (
            <div className="w-80 fixed left-0 top-0 h-screen border-r border-foreground/10 bg-background/95 backdrop-blur-sm transform transition-transform duration-300 ease-in-out translate-x-0 z-30">
              <div className="h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="h-[73px] flex items-center justify-between px-4 border-b border-foreground/10 bg-background/50">
                  <h2 className="text-lg font-semibold text-foreground">Search History</h2>
                  <Button
                    onClick={closeSidebar}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                  <SearchHistory 
                    onClose={closeSidebar}
                    showCloseButton={false}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-16 fixed left-0 top-0 h-screen border-r border-border bg-card/95 backdrop-blur-sm flex flex-col items-center py-4 shadow-sm z-30">
              {/* Collapsed sidebar header area */}
              <div className="h-[65px] flex items-center justify-center">
                <Button
                  onClick={toggleSearchHistory}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-accent hover:scale-105 rounded-lg transition-all duration-200 border border-transparent hover:border-border"
                  title="Show Search History"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Clock className="h-4 w-4 text-primary/60" />
                <div className="writing-mode-vertical text-xs text-muted-foreground/70 font-medium tracking-widest">
                  <span className="block transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    HISTORY
                  </span>
                </div>
              </div>
              
              <div 
                className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 cursor-pointer"
                title="Show Search History"
                onClick={toggleSearchHistory}
              >
                <ChevronRight className="h-3 w-3 text-primary/70" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        (currentUser || process.env.NODE_ENV === 'development') && !isMobile ? 
          (showSearchHistory ? 'ml-80' : 'ml-16') : 
          'ml-0'
      }`}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile sidebar overlay */}
          {showSearchHistory && isMobile && (
            <div className="fixed inset-0 z-40 bg-black/50" onClick={closeSidebar}>
              <div className="w-80 h-full bg-background" onClick={(e) => e.stopPropagation()}>
                <SearchHistory 
                  onClose={closeSidebar}
                  showCloseButton={true}
                  className="h-full"
                />
              </div>
            </div>
          )}
          
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToSearch}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Search</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                
                {currentUser && isMobile && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => setShowSearchHistory(true)}
                  >
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </div>
            
            {/* Verification Result */}
            <div className="space-y-6">
              {status === 'verifying' && <div className="text-center text-muted-foreground">Loading result...</div>}
              {status === 'verified' && result && <VerificationResult />}
              {status === 'error' && <div className="text-center text-destructive">Result not found or unavailable.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
