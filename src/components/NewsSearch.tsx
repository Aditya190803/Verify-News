
import React, { useState } from 'react';
import { useNews } from '@/context/NewsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsSearchProps {
  className?: string;
}

const NewsSearch = ({ className }: NewsSearchProps) => {
  const { searchNews, status, searchQuery, setSearchQuery } = useNews();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    setError('');
    await searchNews(searchQuery);
  };
  return (
    <div className={cn('w-full animate-fade-in', className)} style={{ animationDelay: '100ms' }}>
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 lg:p-8 mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center px-2.5 sm:px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
            <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            News Search
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-foreground">Find news to verify</h2>
          <p className="mt-1 text-xs sm:text-sm text-foreground/60">
            Search for news stories or topics and we'll find relevant articles to verify
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex w-full items-center space-x-2">              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for news (e.g., 'climate change', 'COVID-19 vaccine')"
                className="flex-1 bg-background border border-input rounded-lg px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-colors"
                disabled={status === 'searching'}
              />
              <Button 
                type="submit"
                disabled={status === 'searching'} 
                className="bg-primary text-primary-foreground rounded-lg px-3 sm:px-4 hover:bg-primary/90 active:scale-[0.98] transition-all"
                size="sm"
              >
                {status === 'searching' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>                ) : (
                  <>
                    <Search className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">Search</span>
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsSearch;
