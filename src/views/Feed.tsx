import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isConvexBackend } from '@/services/aggregation';
import { BiasBar, BiasLegend } from '@/components/BiasBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageSection } from '@/components/marketing/PageSection';
import { RelatedLinks } from '@/components/marketing/RelatedLinks';
import { fetchStories, type ApiStory } from '@/services/aggregation';
import { FACETS } from '@/lib/brand';
import { AlertCircle, ArrowRight, ExternalLink, Layers, Newspaper, RefreshCw } from 'lucide-react';

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border/80 bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-[90%] mb-3" />
          <Skeleton className="h-3 w-28 mb-5" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

const Feed = () => {
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!isConvexBackend()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchStories(40)
      .then(setStories)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <MarketingShell>
      <div className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary">{FACETS.name} · Coverage</p>
          <h1 className="font-display mt-2 text-3xl sm:text-[2rem] font-semibold tracking-tight text-foreground text-balance">
            Stories from many angles
          </h1>
          <p className="mt-1 text-xs text-muted-foreground tracking-wide">{FACETS.tagline}</p>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[58ch]">
            Headlines clustered from RSS. The bar shows how left, center, and right outlets cover the same event. Not a
            truth score:{' '}
            <Link to="/" className="text-primary font-medium hover:underline underline-offset-4">
              verify claims
            </Link>{' '}
            separately.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link to="/following">
                Personalize
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/methodology">Bias labels</Link>
            </Button>
          </div>
        </div>
      </div>

      <PageSection width="content" className="!py-8 sm:!py-10">
        {!isConvexBackend() && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Convex not connected</p>
            <p className="leading-relaxed">
              Set <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_CONVEX_URL</code> in{' '}
              <code className="text-xs">.env.local</code> and run <code className="text-xs">bun run convex:dev</code>.
            </p>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 sm:px-5 flex gap-3"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Could not load stories</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                See <code className="bg-muted px-1 rounded">docs/LOCAL_DEV.md</code>
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => load()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                Retry
              </Button>
            </div>
          </div>
        )}

        {loading && !error && <FeedSkeleton />}

        {!loading && !error && isConvexBackend() && stories.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">{stories.length}</span> stories
              </p>
              <BiasLegend />
            </div>

            <ul className="space-y-4">
              {stories.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-sm shadow-black/[0.02] hover:border-border transition-colors"
                >
                  <Link
                    to={`/story/${s.slug}`}
                    className="text-lg font-semibold leading-snug text-foreground hover:text-primary transition-colors line-clamp-3"
                  >
                    {s.canonicalTitle}
                  </Link>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    {s.sourceCount} source{s.sourceCount === 1 ? '' : 's'}
                  </p>
                  <div className="mt-4 max-w-xl">
                    <BiasBar spread={s.biasSpread} className="h-2.5" />
                  </div>
                  {s.blindspot?.message ? (
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-md px-3 py-2">
                      {s.blindspot.message}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.articles.slice(0, 4).map((a) => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                      >
                        {a.outlet?.name ?? 'Source'}
                        <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {!loading && isConvexBackend() && stories.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 text-center py-14 px-6">
            <Newspaper className="h-9 w-9 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="font-medium text-foreground">Feed is empty</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              Run <code className="text-xs">npx convex run seed:seedOutlets</code> and{' '}
              <code className="text-xs">npx convex run rss:pollAll</code>, then refresh.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => load()}>
              Refresh
            </Button>
          </div>
        )}
      </PageSection>

      <RelatedLinks
        links={[
          { to: '/following', label: 'Following' },
          { to: '/pricing', label: 'Pricing' },
          { to: '/', label: 'Verify a claim' },
        ]}
      />
    </MarketingShell>
  );
};

export default Feed;