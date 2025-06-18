
import React from 'react';
import { useNews } from '@/context/NewsContext';
import { cn } from '@/lib/utils';
import { ExternalLink, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewsArticlesProps {
  className?: string;
}

const NewsArticles = ({ className }: NewsArticlesProps) => {
  const { 
    articles, 
    selectedArticle, 
    setSelectedArticle, 
    setNewsContent,
    verifyNews
  } = useNews();

  if (articles.length === 0) {
    return null;
  }

  const selectArticle = (article: typeof articles[0]) => {
    setSelectedArticle(article);
    setNewsContent(article.snippet);
  };

  // Extract domain from URL for display
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (e) {
      return 'Unknown source';
    }
  };
  return (
    <div className={cn('w-full animate-fade-in', className)} style={{ animationDelay: '200ms' }}>
      <div className="glass-card dark:bg-gray-800/60 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-foreground">Search Results</h2>
          <p className="mt-1 text-xs sm:text-sm text-foreground/60">
            Select an article to verify
          </p>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {articles.map((article, index) => (
            <div 
              key={index}
              onClick={() => selectArticle(article)}
              className={cn(
                "p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                selectedArticle === article
                  ? "border-primary/50 bg-primary/5"
                  : "border-foreground/10 hover:border-foreground/20 bg-foreground/5"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 mb-2">{article.title}</h3>
                  
                  {article.url && (
                    <div className="flex items-center mt-1 mb-2">
                      <LinkIcon className="h-3 w-3 text-primary/70 mr-1 flex-shrink-0" />
                      <Badge variant="outline" className="text-xs bg-primary/5 hover:bg-primary/10 truncate">
                        {extractDomain(article.url)}
                      </Badge>
                    </div>
                  )}
                  
                  <p className="text-xs sm:text-sm text-foreground/70 line-clamp-2 mb-2">{article.snippet}</p>
                  
                  {article.url && (
                    <a 
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 text-xs text-primary hover:text-primary/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View source <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </div>
                
                {selectedArticle === article && (
                  <div className="ml-3 sm:ml-4 text-primary flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {selectedArticle && (
          <div className="mt-4 sm:mt-6">
            <Button
              onClick={() => verifyNews()}
              className="w-full glass-button dark:bg-primary/90 dark:hover:bg-primary/80 text-sm sm:text-base py-2 sm:py-3"
            >
              Verify Selected Article
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsArticles;
