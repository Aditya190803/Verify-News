
import { useNews } from '@/context/NewsContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import NewsArticles from '@/components/NewsArticles';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SearchResults = () => {
  const { articles, searchQuery } = useNews();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  // If no articles, redirect to home
  if (!articles || articles.length === 0) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {articles.length} result{articles.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        </div>
        
        {/* News Articles */}
        <NewsArticles />
      </main>
    </div>
  );
};

export default SearchResults;
