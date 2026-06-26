import { useState, useEffect, useCallback } from 'react';
import { fetchUserVerificationsForDashboard } from '@/services/aggregation';
import { logger } from '@/lib/logger';
import { SearchHistoryItem } from '@/types/news';

interface DashboardStats {
  totalVerifications: number;
  trueCount: number;
  falseCount: number;
  uncertainCount: number;
  recentVerifications: SearchHistoryItem[];
}

function countByVeracity(verifications: SearchHistoryItem[]) {
  const trueCount = verifications.filter((v) => v.veracity?.toLowerCase().includes('true')).length;
  const falseCount = verifications.filter((v) => v.veracity?.toLowerCase().includes('false')).length;
  const uncertainCount = verifications.filter(
    (v) =>
      v.veracity?.toLowerCase().includes('uncertain') ||
      v.veracity?.toLowerCase().includes('mixed') ||
      v.veracity?.toLowerCase().includes('unverified'),
  ).length;
  return { trueCount, falseCount, uncertainCount };
}

export const useDashboardData = (userId: string | undefined) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchUserVerificationsForDashboard(100);
      const verifications: SearchHistoryItem[] = (rows ?? []).map((r) => ({
        id: r.id,
        query: r.query,
        title: r.title,
        timestamp: r.timestamp,
        resultType: 'verification',
        slug: r.slug,
        veracity: r.veracity,
        confidence: r.confidence,
      }));

      const { trueCount, falseCount, uncertainCount } = countByVeracity(verifications);
      setStats({
        totalVerifications: verifications.length,
        trueCount,
        falseCount,
        uncertainCount,
        recentVerifications: verifications.slice(0, 5),
      });
    } catch (err) {
      logger.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return { stats, loading, error, refresh: loadDashboardData };
};