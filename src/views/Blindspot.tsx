import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageSection } from '@/components/marketing/PageSection';
import { BiasBar } from '@/components/BiasBar';
import { Button } from '@/components/ui/button';
import { fetchBlindspotStories, isConvexBackend, type ApiStory } from '@/services/aggregation';
import { Eye, EyeOff } from 'lucide-react';

type Tab = 'all' | 'left' | 'right';

const Blindspot = () => {
  const [tab, setTab] = useState<Tab>('all');
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!isConvexBackend()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchBlindspotStories(tab, 35)
      .then(setStories)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tab]);

  return (
    <MarketingShell>
      <PageSection width="content" className="!py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Facets · Blindspot</p>
        <h1 className="font-display text-3xl font-semibold mt-2">Stories one side may be missing</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-[58ch] leading-relaxed">
          Ground-style skew detection: coverage disproportionately from left or right outlets. Step outside your usual
          bubble — not a truth score.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {(['all', 'left', 'right'] as Tab[]).map((t) => (
            <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)}>
              {t === 'all' && 'All blindspots'}
              {t === 'left' && 'Missing on the left'}
              {t === 'right' && 'Missing on the right'}
            </Button>
          ))}
        </div>

        {error && <p className="text-destructive text-sm mt-4">{error}</p>}
        {loading && <p className="text-muted-foreground text-sm mt-6">Loading…</p>}

        {!loading && stories.length === 0 && !error && (
          <p className="text-muted-foreground text-sm mt-6">
            No blindspot stories yet. Run{' '}
            <code className="text-xs bg-muted px-1 rounded">npx convex run feedPoll:refreshFeed</code>.
          </p>
        )}

        <ul className="space-y-4 mt-6">
          {stories.map((s) => (
            <li key={s.id} className="rounded-lg border border-border bg-card p-5">
              <Link to={`/story/${s.slug}`} className="font-semibold hover:text-primary">
                {s.canonicalTitle}
              </Link>
              {s.blindspotReason && (
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-2">
                  {s.blindspotSide === 'left' ? (
                    <EyeOff className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  )}
                  {s.blindspotReason}
                </p>
              )}
              <div className="mt-3 max-w-md">
                <BiasBar spread={s.biasSpread} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{s.sourceCount} sources</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm">
          <Link to="/feed" className="text-primary hover:underline">
            ← Full feed
          </Link>
          {' · '}
          <Link to="/methodology" className="text-primary hover:underline">
            Methodology
          </Link>
        </p>
      </PageSection>
    </MarketingShell>
  );
};

export default Blindspot;