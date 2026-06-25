import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { BiasBar, BiasLegend } from '@/components/BiasBar';
import { Button } from '@/components/ui/button';
import { fetchStory, type ApiStory } from '@/services/aggregationApi';
import { isAggregationApiEnabled } from '@/config/api';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useNews } from '@/context/NewsContext';
import { useAuth } from '@/context/AuthContext';

const StoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<ApiStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { setNewsContent, setSearchQuery, setSelectedArticle } = useNews();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug || !isAggregationApiEnabled) return;
    fetchStory(slug)
      .then(setStory)
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
        {!isAggregationApiEnabled && (
          <p className="text-sm">Set VITE_API_URL to load stories.</p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!story && !error && isAggregationApiEnabled && (
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
            <div className="mt-6 space-y-3">
              {story.articles.map((a) => (
                <div key={a.id} className="border rounded-lg p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{a.outlet?.name ?? 'Source'}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {a.outlet?.biasLabel?.replace('-', ' ')}
                      </p>
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