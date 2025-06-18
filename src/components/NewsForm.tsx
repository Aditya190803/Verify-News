
import React, { useState, useEffect } from 'react';
import { useNews } from '@/context/NewsContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, FileText, SearchX, Link, Type } from 'lucide-react';

interface NewsFormProps {
  className?: string;
}

const NewsForm = ({ className }: NewsFormProps) => {
  const { newsContent, setNewsContent, verifyNews, status, setSearchQuery } = useNews();
  const [error, setError] = useState('');
  const [isUrl, setIsUrl] = useState(false);
  const navigate = useNavigate();

  // Check if content is a URL whenever it changes
  useEffect(() => {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    setIsUrl(urlRegex.test(newsContent.trim()));
  }, [newsContent]);const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsContent.trim()) {
      setError('Please enter some news content to verify');
      return;
    }
    
    setError('');
      // Determine if content is a URL with improved regex
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    const isUrl = urlRegex.test(newsContent.trim());
    
    // Set search query for results page - use the content itself if it's a URL
    setSearchQuery(newsContent.trim());
    
    // For URLs, navigate directly to results page and let it handle the verification
    if (isUrl) {
      navigate(`/results?q=${encodeURIComponent(newsContent.trim())}&type=url`);
    } else {
      // For text content, verify first then navigate
      await verifyNews();
    }
  };
  return (
    <div className={cn('w-full animate-fade-in', className)} style={{ animationDelay: '100ms' }}>
      <div className="glass-card dark:bg-gray-800/60 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6">          <div className="inline-flex items-center px-2.5 sm:px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {isUrl ? (
              <>
                <Link className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                URL Input
              </>
            ) : (
              <>
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                Text Input
              </>
            )}
          </div><h2 className="text-lg sm:text-xl font-medium text-foreground">Verify news content</h2>
          <p className="mt-1 text-xs sm:text-sm text-foreground/60">
            Paste a news article URL, headline, or text content to verify its accuracy using Gemini AI
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">            <textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Paste a news article URL (https://...) or news content here to verify..."
              className={cn(
                "glass-input dark:bg-gray-700/50 dark:border-gray-600/50 w-full min-h-[120px] sm:min-h-[180px] resize-none text-sm sm:text-base transition-colors",
                isUrl && "border-primary/50 bg-primary/5"
              )}
              disabled={status === 'verifying'}
            />
            
            {isUrl && newsContent.trim() && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-primary animate-fade-in">
                <Link className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>URL detected - will verify this article</span>
              </div>
            )}
              {error && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                type="submit"
                disabled={status === 'verifying'} 
                className="glass-button dark:bg-primary/90 dark:hover:bg-primary/80 w-full text-sm sm:text-base"
              >
                {status === 'verifying' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs sm:text-sm">Verifying with Gemini AI...</span>
                  </span>
                ) : (
                  'Verify Content'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsForm;
