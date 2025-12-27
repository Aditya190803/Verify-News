import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchHistoryItem } from '@/types/news';

interface RecentVerificationsProps {
  verifications: SearchHistoryItem[];
}

const RecentVerifications = ({ verifications }: RecentVerificationsProps) => {
  const navigate = useNavigate();

  const getVeracityStyles = (veracity?: string) => {
    if (!veracity) return 'bg-muted text-muted-foreground';
    const lower = veracity.toLowerCase();
    if (lower.includes('true')) return 'bg-success/10 text-success';
    if (lower.includes('false')) return 'bg-destructive/10 text-destructive';
    return 'bg-warning/10 text-warning';
  };

  const getVeracityIcon = (veracity?: string) => {
    if (!veracity) return <HelpCircle className="h-4 w-4" />;
    const lower = veracity.toLowerCase();
    if (lower.includes('true')) return <CheckCircle className="h-4 w-4" />;
    if (lower.includes('false')) return <XCircle className="h-4 w-4" />;
    return <HelpCircle className="h-4 w-4" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold">Recent verifications</h2>
        <Link to="/">
          <Button variant="outline" size="sm">
            Verify more
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {verifications.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 cursor-pointer transition-colors"
            onClick={() => navigate(`/result/${item.slug}`)}
          >
            <div className={cn('rounded-lg p-2', getVeracityStyles(item.veracity))}>
              {getVeracityIcon(item.veracity)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-1">
                {item.title || item.query}
              </h3>
              {item.articleTitle && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {item.articleTitle}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {item.veracity && (
                  <Badge variant="outline" className={cn('text-xs', getVeracityStyles(item.veracity))}>
                    {item.veracity}
                  </Badge>
                )}
                {item.confidence && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.confidence)}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentVerifications;
