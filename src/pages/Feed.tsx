import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Clock, Eye, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRecentVerifications, VerificationDocument } from '@/services/appwrite';
import { SkeletonVerificationCard } from '@/components/ui/skeleton-loaders';
import { NoContentEmptyState } from '@/components/ui/empty-states';
import { ErrorState } from '@/components/ui/error-states';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/logger';

const Feed = () => {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [veracityFilter, setVeracityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'votes'>('recent');
  const [timeRange, setTimeRange] = useState<string>('all');

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = veracityFilter === 'all' ? undefined : veracityFilter;
      
      let dateRange;
      if (timeRange !== 'all') {
        const now = new Date();
        const start = new Date();
        if (timeRange === '24h') start.setHours(now.getHours() - 24);
        if (timeRange === '7d') start.setDate(now.getDate() - 7);
        if (timeRange === '30d') start.setDate(now.getDate() - 30);
        dateRange = { start: start.toISOString(), end: now.toISOString() };
      }

      const data = await getRecentVerifications(20, filter, sortBy, dateRange);
      setVerifications(data);
    } catch (err) {
      setError('Failed to load verifications');
      logger.error('Error loading verifications:', err);
    } finally {
      setLoading(false);
    }
  }, [veracityFilter, sortBy, timeRange]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const sortedVerifications = verifications; // Already sorted by API

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
            <div className="flex flex-wrap gap-3 flex-1">
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

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
              <Button
                variant={sortBy === 'votes' ? 'default' : 'outline'}
                onClick={() => setSortBy('votes')}
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Helpful
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
