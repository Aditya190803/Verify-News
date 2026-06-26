import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { BiasBar, BiasLegend } from '@/components/BiasBar';
import { Button } from '@/components/ui/button';
import { fetchStory, type ApiStory } from '@/services/aggregation';
import { isConvexBackend } from '@/services/aggregation';
import { ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { FactualityBadge } from '@/components/FactualityBadge';
import { HeadlineCompare } from '@/components/HeadlineCompare';
import { generateBiasCompare } from '@/services/aggregation';
import { useNews } from '@/context/NewsContext';
import { useAuth } from '@/context/AuthContext';

const StoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<ApiStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareSummary, setCompareSummary] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const { currentUser } = useAuth();
  const { setNewsContent, setSearchQuery, setSelectedArticle } = useNews();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug || !isConvexBackend) return;
    fetchStory(slug)
      .then((s) => {
        setStory(s);
        setCompareSummary(s?.biasCompareSummary ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [slug]);

  const onVerify = () => {
    if (!story) return;
    const first = story.articles[0];
    setSearchQuery(story.canonicalTitle);
    setNewsContent(story.canonicalTitle);
    if (first) {
      setSelectedArticle({
        title: first.title,
        snippet: first.summary ?? story.canonicalTitle,
        url: first.url,
      });
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container max-w-3xl py-8 flex-1">
        {!isConvexBackend && (
          <p className="text-sm">Configure Convex in .env.local.</p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!story && !error && isConvexBackend && (
          <p className="text-muted-foreground text-sm">Loading…</p>
        )}
        {story && (
          <>
            <h1 className="text-2xl font-semibold mb-2">{story.canonicalTitle}</h1>
            <p className="text-sm text-muted-foreground mb-4">
              {story.sourceCount} source{story.sourceCount === 1 ? '' : 's'} · coverage spread
            </p>
            <BiasBar spread={story.biasSpread} className="mb-2" />
            <BiasLegend />
            {story.blindspotReason && (
              <p className="mt-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
                Blindspot: {story.blindspotReason}{' '}
                <Link to="/blindspot" className="underline">
                  Explore feed
                </Link>
              </p>
            )}
            <HeadlineCompare story={story} />
            {(compareSummary || story.biasCompareSummary) && (
              <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Bias comparison</p>
                {compareSummary || story.biasCompareSummary}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={compareLoading}
              onClick={async () => {
                if (!slug) return;
                setCompareLoading(true);
                try {
                  const r = await generateBiasCompare(slug);
                  if (r.summary) setCompareSummary(r.summary);
                  else if (r.error) setError(r.error);
                } finally {
                  setCompareLoading(false);
                }
              }}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {compareLoading ? 'Generating…' : 'Generate bias comparison (Plus/Pro)'}
            </Button>
            {story.blindspot?.message && (
              <p className="mt-4 text-sm border-l-4 border-primary pl-3 bg-muted/30 py-2 rounded-r">
                {story.blindspot.message}
              </p>
            )}
            {currentUser && !story.blindspot?.message && (
              <p className="mt-4 text-xs text-muted-foreground">
                Follow outlets on <Link to="/following" className="underline">Following</Link> or upgrade on{' '}
                <Link to="/pricing" className="underline">Pricing</Link> for blindspot.
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-3">
              {story.articles.length} articles from{' '}
              {new Set(story.articles.map((a) => a.outlet?.id ?? a.id)).size} outlets — how each side is covering it
            </p>
            <div className="mt-4 space-y-3">
              {[...story.articles]
                .sort((a, b) => (a.outlet?.biasLabel ?? '').localeCompare(b.outlet?.biasLabel ?? ''))
                .map((a) => (
                <div key={a.id} className="border rounded-lg p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{a.outlet?.name ?? 'Source'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground capitalize">
                          {a.outlet?.biasLabel?.replace('-', ' ')}
                        </p>
                        <FactualityBadge tier={a.outlet?.factuality} />
                        {a.outlet?.ownershipCategory && (
                          <span className="text-[10px] text-muted-foreground">{a.outlet.ownershipCategory}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  {a.summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.summary}</p>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-6" onClick={onVerify}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Fact-check this headline
            </Button>
            <p className="mt-8 text-sm">
              <Link to="/feed" className="text-primary hover:underline">
                ← All stories
              </Link>
              {' · '}
              <Link to="/methodology" className="text-primary hover:underline">
                Bias methodology
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default StoryDetail;