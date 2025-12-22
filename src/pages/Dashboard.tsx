import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { SkeletonDashboard } from '@/components/ui/skeleton-loaders';
import { NoContentEmptyState } from '@/components/ui/empty-states';
import RateLimitStatus from '@/components/RateLimitStatus';
import { useTranslation } from 'react-i18next';
import { useDashboardData } from '@/hooks/useDashboardData';

// Modular components - lazy loaded
const StatsOverview = lazy(() => import('@/components/dashboard/StatsOverview'));
const ResultsBreakdown = lazy(() => import('@/components/dashboard/ResultsBreakdown'));
const RecentVerifications = lazy(() => import('@/components/dashboard/RecentVerifications'));
const TrendingAlerts = lazy(() => import('@/components/dashboard/TrendingAlerts'));

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { stats, loading, error } = useDashboardData(currentUser?.uid);
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

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

  if (error || !stats || stats.totalVerifications === 0) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">
              Track your verification history and stats
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Rate Limit Status */}
          <RateLimitStatus />

          {/* Stats Overview */}
          <Suspense fallback={<div className="h-48 bg-muted/20 rounded-lg animate-pulse" />}>
            <StatsOverview
              total={stats.totalVerifications}
              trueCount={stats.trueCount}
              falseCount={stats.falseCount}
              uncertainCount={stats.uncertainCount}
            />
          </Suspense>

          {/* Breakdown */}
          <Suspense fallback={<div className="h-64 bg-muted/20 rounded-lg animate-pulse mt-6" />}>
            <ResultsBreakdown
              total={stats.totalVerifications}
              trueCount={stats.trueCount}
              falseCount={stats.falseCount}
              uncertainCount={stats.uncertainCount}
            />
          </Suspense>

          {/* Recent Activity */}
          <Suspense fallback={<div className="h-32 bg-muted/20 rounded-lg animate-pulse mt-6" />}>
            <RecentVerifications verifications={stats.recentVerifications} />
          </Suspense>

          {/* Trending Alerts */}
          <Suspense fallback={<div className="h-40 bg-muted/20 rounded-lg animate-pulse mt-6" />}>
            <TrendingAlerts />
          </Suspense>
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
