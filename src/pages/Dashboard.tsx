import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserHistoryByType, SearchHistoryItem } from '@/services/appwriteService';
import { SkeletonDashboard } from '@/components/ui/skeleton-loaders';
import { NoContentEmptyState } from '@/components/ui/empty-states';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalVerifications: number;
  trueCount: number;
  falseCount: number;
  uncertainCount: number;
  recentVerifications: SearchHistoryItem[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [currentUser, navigate]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const verifications = await getUserHistoryByType(currentUser.uid, 'verification', 100);
      
      const trueCount = verifications.filter(v => 
        v.veracity?.toLowerCase().includes('true')
      ).length;
      
      const falseCount = verifications.filter(v => 
        v.veracity?.toLowerCase().includes('false')
      ).length;
      
      const uncertainCount = verifications.filter(v => 
        v.veracity?.toLowerCase().includes('uncertain') || 
        v.veracity?.toLowerCase().includes('mixed')
      ).length;

      setStats({
        totalVerifications: verifications.length,
        trueCount,
        falseCount,
        uncertainCount,
        recentVerifications: verifications.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          <SkeletonDashboard />
        </main>
      </div>
    );
  }

  if (!stats || stats.totalVerifications === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          <NoContentEmptyState
            type="verifications"
            onAction={() => navigate('/')}
            actionLabel="Start verifying"
          />
        </main>
      </div>
    );
  }

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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl font-bold mb-2">Your dashboard</h1>
            <p className="text-muted-foreground">
              Track your verification history and stats
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total verified</p>
              <p className="text-3xl font-bold">{stats.totalVerifications}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">True</p>
              </div>
              <p className="text-3xl font-bold text-success">{stats.trueCount}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-muted-foreground">False</p>
              </div>
              <p className="text-3xl font-bold text-destructive">{stats.falseCount}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">Uncertain</p>
              </div>
              <p className="text-3xl font-bold text-warning">{stats.uncertainCount}</p>
            </Card>
          </div>

          {/* Breakdown */}
          <Card className="p-6 mb-8">
            <h2 className="font-semibold mb-6">Results breakdown</h2>
            
            <div className="space-y-4">
              {[
                { label: 'True', count: stats.trueCount, color: 'bg-success' },
                { label: 'False', count: stats.falseCount, color: 'bg-destructive' },
                { label: 'Uncertain', count: stats.uncertainCount, color: 'bg-warning' },
              ].map((item) => {
                const percentage = stats.totalVerifications > 0 
                  ? Math.round((item.count / stats.totalVerifications) * 100) 
                  : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", item.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Activity */}
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
              {stats.recentVerifications.map((item) => (
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
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
      
      <footer className="py-8 border-t border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} VerifyNews
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
