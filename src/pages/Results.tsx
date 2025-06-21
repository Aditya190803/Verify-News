import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import VerificationResult from '@/components/VerificationResult';
import SearchHistory from '@/components/SearchHistory';
import { useNews } from '@/context/NewsContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, ChevronRight, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { History } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { result, status } = useNews();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [showSearchHistory, setShowSearchHistory] = useLocalStorage('showSearchHistory', true);
  
  const query = searchParams.get('q');
  const type = searchParams.get('type');
  const toggleSearchHistory = () => {
    setShowSearchHistory(prev => !prev);
  };

  const closeSidebar = () => {
    setShowSearchHistory(false);
  };
  useEffect(() => {
    // If no query or result, redirect to home
    if (!query || (!result && status !== 'verifying')) {
      navigate('/', { replace: true });
    }
  }, [query, result, status, navigate]);

  const handleBackToSearch = () => {
    navigate('/', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  if (!query) {
    return null;
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex">
        {/* Mobile sidebar overlay */}
        {showSearchHistory && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={closeSidebar}>
            <div className="w-80 h-full bg-background" onClick={(e) => e.stopPropagation()}>
              <SearchHistory 
                onClose={closeSidebar}
                showCloseButton={true}
                className="h-full"
              />
            </div>
          </div>
        )}
          {/* Desktop Sidebar */}
        {(currentUser || process.env.NODE_ENV === 'development') && !isMobile && (
          <div>
            {showSearchHistory ? (
              <div className="w-80 fixed left-0 top-0 h-screen border-r border-foreground/10 bg-background/50 backdrop-blur-sm transform transition-transform duration-300 ease-in-out translate-x-0 z-30">
                <SearchHistory 
                  onClose={closeSidebar}
                  showCloseButton={true}
                  className="h-full overflow-y-auto"
                />
              </div>
            ) : (
              <div className="w-16 fixed left-0 top-0 h-screen border-r border-border bg-card backdrop-blur-sm flex flex-col items-center py-4 shadow-sm z-30">
                <Button
                  onClick={toggleSearchHistory}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 mb-3 hover:bg-accent hover:scale-105 rounded-lg transition-all duration-200 border border-transparent hover:border-border"
                  title="Show Search History"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
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
        )}        {/* Main Content */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${
          (currentUser || process.env.NODE_ENV === 'development') && !isMobile ? 
            (showSearchHistory ? 'ml-80' : 'ml-16') : 
            'ml-0'
        }`}>
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
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline">History</span>
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[80vh]">
                      <div className="p-4">
                        <SearchHistory />
                      </div>
                    </DrawerContent>
                  </Drawer>
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

            {/* Search Info */}
            <div className="mb-6 p-4 sm:p-6 glass-card">
              <h1 className="text-xl sm:text-2xl font-semibold mb-2">Verification Results</h1>
              <div className="text-sm sm:text-base text-foreground/70">
                <p className="mb-1">
                  <span className="font-medium">Query:</span> {query}
                </p>
                {type && (
                  <p>
                    <span className="font-medium">Type:</span> {type === 'url' ? 'URL/Link' : 'Text Content'}
                  </p>
                )}
              </div>
            </div>            {/* Verification Result */}
            <div className="space-y-6">
              <VerificationResult />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
