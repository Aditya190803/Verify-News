
import React from 'react';
import { useNews } from '@/context/NewsContext';
import { cn } from '@/lib/utils';
import { ExternalLink, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    } catch {
      return 'Unknown source';
    }
  };
  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-3">
        {articles.map((article, index) => (
          <div 
            key={index}
            onClick={() => selectArticle(article)}
            className={cn(
              "p-4 rounded-lg border cursor-pointer transition-all",
              selectedArticle === article
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 bg-card"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1.5">{article.title}</h3>
                
                {article.url && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <LinkIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {extractDomain(article.url)}
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.snippet}</p>
                
                {article.url && (
                  <a 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View source
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              
              {selectedArticle === article && (
                <div className="text-primary flex-shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedArticle && (
        <div className="mt-4">
          <Button
            onClick={() => verifyNews()}
            className="w-full"
          >
            Verify Selected Article
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsArticles;
