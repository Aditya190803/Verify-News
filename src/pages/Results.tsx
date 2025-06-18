import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import VerificationResult from '@/components/VerificationResult';
import SearchHistory from '@/components/SearchHistory';
import { useNews } from '@/context/NewsContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { History } from 'lucide-react';

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();  const { result, status } = useNews();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  
  const query = searchParams.get('q');
  const type = searchParams.get('type');
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
      
      <div className="flex-1 flex">        {/* Desktop Sidebar */}
        {currentUser && !isMobile && (
          <div className="w-64 border-r border-foreground/10 bg-background/50 backdrop-blur-sm">
            <SearchHistory />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
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
            </div>

            {/* Verification Result */}
            <div className="space-y-6">
              <VerificationResult />
                {/* Additional Actions */}
              {result && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleBackToSearch}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Verify Another
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
