import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Clock, Eye, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRecentVerifications, VerificationDocument } from '@/services/appwriteService';
import { SkeletonVerificationCard } from '@/components/ui/skeleton-loaders';
import { NoContentEmptyState } from '@/components/ui/empty-states';
import { ErrorState } from '@/components/ui/error-states';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const Feed = () => {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [veracityFilter, setVeracityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent');

  useEffect(() => {
    loadVerifications();
  }, [veracityFilter]);

  const loadVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = veracityFilter === 'all' ? undefined : veracityFilter;
      const data = await getRecentVerifications(20, filter);
      setVerifications(data);
    } catch (err) {
      setError('Failed to load verifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortedVerifications = [...verifications].sort((a, b) => {
    if (sortBy === 'views') {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const getVeracityIcon = (veracity?: string) => {
    switch (veracity?.toLowerCase()) {
      case 'true':
      case 'mostly true':
        return <CheckCircle className="h-4 w-4" />;
      case 'false':
      case 'mostly false':
        return <XCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getVeracityStyles = (veracity?: string) => {
    switch (veracity?.toLowerCase()) {
      case 'true':
      case 'mostly true':
        return 'bg-success/10 text-success border-success/20';
      case 'false':
      case 'mostly false':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Header Section */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl font-bold mb-2">Public feed</h1>
            <p className="text-muted-foreground">
              See what others have verified recently
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={veracityFilter} onValueChange={setVeracityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All results</SelectItem>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="mostly true">Mostly true</SelectItem>
                <SelectItem value="false">False</SelectItem>
                <SelectItem value="mostly false">Mostly false</SelectItem>
                <SelectItem value="uncertain">Uncertain</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                onClick={() => setSortBy('recent')}
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </Button>
              <Button
                variant={sortBy === 'views' ? 'default' : 'outline'}
                onClick={() => setSortBy('views')}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Popular
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonVerificationCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Couldn't load feed"
              message={error}
              onRetry={loadVerifications}
            />
          ) : sortedVerifications.length === 0 ? (
            <NoContentEmptyState
              type="feed"
              onAction={() => navigate('/')}
              actionLabel="Verify something"
            />
          ) : (
            <div className="space-y-4">
              {sortedVerifications.map((verification) => (
                <Card
                  key={verification.id}
                  className="p-6 hover:border-border/80 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/result/${verification.slug}`)}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {verification.title || verification.query || 'Verification'}
                      </h3>
                      {verification.articleTitle && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {verification.articleTitle}
                        </p>
                      )}
                    </div>
                    {verification.veracity && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'flex items-center gap-1.5 flex-shrink-0 px-3 py-1',
                          getVeracityStyles(verification.veracity)
                        )}
                      >
                        {getVeracityIcon(verification.veracity)}
                        <span className="capitalize">{verification.veracity}</span>
                      </Badge>
                    )}
                  </div>

                  {verification.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {verification.content}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(verification.timestamp), { addSuffix: true })}
                    </div>
                    {verification.viewCount !== undefined && verification.viewCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {verification.viewCount} views
                      </div>
                    )}
                    {verification.confidence && (
                      <div className="ml-auto">
                        {Math.round(verification.confidence * 100)}% confidence
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-8 border-t border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} VerifyNews
        </div>
      </footer>
    </div>
  );
};

export default Feed;
