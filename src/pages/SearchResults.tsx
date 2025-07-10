import React from 'react';
import { useNews } from '@/context/NewsContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import NewsArticles from '@/components/NewsArticles';
import SearchHistory from '@/components/SearchHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Clock, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const SearchResults = () => {
  const { articles, searchQuery, resetState } = useNews();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showSearchHistory, setShowSearchHistory] = useLocalStorage('showSearchHistory', false);

  const toggleSearchHistory = () => {
    setShowSearchHistory(prev => !prev);
  };

  const closeSidebar = () => {
    setShowSearchHistory(false);
  };

  const handleBackToSearch = () => {
    navigate('/', { replace: true });
  };

  const handleGoHome = () => {
    resetState(); // Clear the search results
    navigate('/', { replace: true });
  };

  // If no articles, redirect to home
  if (!articles || articles.length === 0) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar - Full Height */}
      {(currentUser || process.env.NODE_ENV === 'development') && (
        <div className="hidden md:block">
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
        (currentUser || process.env.NODE_ENV === 'development') ? 
          (showSearchHistory ? 'md:ml-80' : 'md:ml-16') : 
          'ml-0'
      }`}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile sidebar overlay */}
          {currentUser && showSearchHistory && (
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
          
          {/* Mobile History Button */}
          {currentUser && (
            <Button
              onClick={toggleSearchHistory}
              variant="outline"
              size="sm"
              className="md:hidden fixed bottom-6 right-6 z-20 bg-background/95 backdrop-blur-sm border-foreground/20 shadow-lg flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              <span>History</span>
            </Button>
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
                  <span className="hidden sm:inline">New Search</span>
                  <span className="sm:hidden">Search</span>
                </Button>
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
              <h1 className="text-xl sm:text-2xl font-semibold mb-2">Search Results</h1>
              <div className="text-sm sm:text-base text-foreground/70">
                <p className="mb-1">
                  <span className="font-medium">Query:</span> {searchQuery}
                </p>
                <p>
                  <span className="font-medium">Found:</span> {articles.length} article{articles.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* News Articles */}
            <NewsArticles />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
