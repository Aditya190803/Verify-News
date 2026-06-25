import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { isAggregationApiEnabled } from '@/config/api';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageHero } from '@/components/marketing/PageHero';
import { PageSection } from '@/components/marketing/PageSection';
import { RelatedLinks } from '@/components/marketing/RelatedLinks';
import {
  fetchFollows,
  fetchOutlets,
  followOutlet,
  unfollowOutlet,
  setBiasProfile,
  type ApiOutlet,
} from '@/services/aggregationApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Compass, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEANS = ['left', 'center-left', 'center', 'center-right', 'right'] as const;

function formatLean(label: string) {
  return label.replace(/-/g, ' ');
}

const Following = () => {
  const { currentUser } = useAuth();
  const [outlets, setOutlets] = useState<ApiOutlet[]>([]);
  const [followIds, setFollowIds] = useState<Set<string>>(new Set());
  const [lean, setLean] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!isAggregationApiEnabled || !currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [o, f] = await Promise.all([fetchOutlets(), fetchFollows()]);
      setOutlets(o);
      setFollowIds(new Set(f.map((x) => x.outletId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load outlets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [currentUser?.uid]);

  const toggle = async (id: string) => {
    if (!currentUser) return;
    try {
      if (followIds.has(id)) {
        await unfollowOutlet(id);
        setFollowIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      } else {
        await followOutlet(id);
        setFollowIds((s) => new Set(s).add(id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update follow');
    }
  };

  const saveLean = async (v: string) => {
    setLean(v);
    if (!currentUser) return;
    await setBiasProfile(v || null);
  };

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Your lens"
        title="Follow outlets, spot blindspots"
        description="Choose publishers you read often. We rank the feed toward your mix and flag stories where coverage leans away from your follows. Optional: tell us your typical political lean for sharper blindspot hints on Plus."
      />

      <PageSection width="narrow">
        {!isAggregationApiEnabled && (
          <p className="text-sm text-muted-foreground">
            Connect the aggregation API with <code className="text-xs bg-muted px-1 rounded">VITE_API_URL</code> to manage
            follows.
          </p>
        )}

        {isAggregationApiEnabled && !currentUser && (
          <div className="rounded-lg border border-border bg-muted/25 px-6 py-10 text-center">
            <LogIn className="h-8 w-8 text-primary mx-auto mb-4" aria-hidden />
            <p className="font-medium text-foreground">Sign in to save follows</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your outlet list and bias profile stay on your account and sync with the API.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        )}

        {currentUser && isAggregationApiEnabled && (
          <>
            <div className="mb-10 pb-8 border-b border-border/60">
              <label htmlFor="lean-select" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Compass className="h-4 w-4 text-primary" aria-hidden />
                Optional: your typical lean
              </label>
              <p className="text-xs text-muted-foreground mt-1 mb-3 max-w-[50ch]">
                Used only for blindspot copy, not to change outlet labels.
              </p>
              <Select value={lean} onValueChange={(v) => void saveLean(v)}>
                <SelectTrigger id="lean-select" className="max-w-xs">
                  <SelectValue placeholder="Prefer not to say" />
                </SelectTrigger>
                <SelectContent>
                  {LEANS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {formatLean(l)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading outlets…</p>
            ) : (
              <ul className="space-y-0 divide-y divide-border/70">
                {outlets.map((o) => {
                  const following = followIds.has(o.id);
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{o.name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{formatLean(o.biasLabel)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={following ? 'secondary' : 'outline'}
                        className={cn('shrink-0', following && 'font-medium')}
                        onClick={() => void toggle(o.id)}
                      >
                        {following ? 'Following' : 'Follow'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {error && (
          <p className="text-destructive text-sm mt-6" role="alert">
            {error}
          </p>
        )}
      </PageSection>

      <RelatedLinks
        links={[
          { to: '/feed', label: 'Story feed' },
          { to: '/methodology', label: 'Methodology' },
          { to: '/pricing', label: 'Pricing' },
        ]}
      />
    </MarketingShell>
  );
};

export default Following;