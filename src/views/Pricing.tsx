import { useNavigate, useSearchParams } from 'react-router-dom';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageHero } from '@/components/marketing/PageHero';
import { PageSection } from '@/components/marketing/PageSection';
import { RelatedLinks } from '@/components/marketing/RelatedLinks';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { isConvexBackend } from '@/services/aggregation';
import {
  confirmRazorpayPayment,
  createRazorpayOrder,
  fetchBillingPlans,
  fetchEntitlements,
  type BillingPlansResponse,
  type PlanCatalogItem,
} from '@/services/aggregation';
import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FACETS } from '@/lib/brand';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const FALLBACK_CATALOG: PlanCatalogItem[] = [
  { id: 'free', name: 'Free', priceInr: 0, interval: 'month', tagline: 'Try coverage + limited verify' },
  {
    id: 'plus',
    name: 'Plus',
    priceInr: 299,
    interval: 'month',
    tagline: 'Blindspot insights + more verify',
    highlighted: true,
  },
  { id: 'pro', name: 'Pro', priceInr: 799, interval: 'month', tagline: 'Power readers & heavy fact-check' },
];

const FALLBACK_LIMITS: BillingPlansResponse['plans'] = {
  free: { verificationsPerMonth: 5, customFeeds: 3, blindspot: false },
  plus: { verificationsPerMonth: 50, customFeeds: 25, blindspot: true },
  pro: { verificationsPerMonth: 500, customFeeds: 9999, blindspot: true },
};

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay script failed'));
    document.body.appendChild(s);
  });
}

function formatInr(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

type PlanLimitsRow = { verificationsPerMonth: number; customFeeds: number; blindspot: boolean };

function normLimits(raw: unknown): PlanLimitsRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    verificationsPerMonth: Number(o.verificationsPerMonth) || 0,
    customFeeds: Number(o.customFeeds) || 0,
    blindspot: Boolean(o.blindspot),
  };
}

function featureList(limits: PlanLimitsRow): string[] {
  const v = limits.verificationsPerMonth;
  const f = limits.customFeeds;
  return [
    `${v} AI verifications / month`,
    `${f} custom feed slots`,
    limits.blindspot ? 'Blindspot & coverage insights' : 'No blindspot insights',
    'Multi-source story feed',
    'Bias coverage bar per story',
  ];
}

function normCatalogItem(raw: unknown): PlanCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? '');
  if (!id) return null;
  return {
    id,
    name: String(o.name ?? id),
    priceInr: Number(o.priceInr) || 0,
    interval: String(o.interval ?? 'month'),
    tagline: String(o.tagline ?? ''),
    highlighted: Boolean(o.highlighted),
  };
}

const Pricing = () => {
  const [billing, setBilling] = useState<BillingPlansResponse | null>(null);
  const [ent, setEnt] = useState<{
    plan: string;
    verificationsUsedThisMonth: number;
    limits: { verificationsPerMonth: number; blindspot: boolean };
  } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const loginRedirect = (plan?: 'plus' | 'pro') => {
    const dest = plan ? `/pricing?plan=${plan}` : '/pricing';
    navigate(`/login?${new URLSearchParams({ redirect: dest }).toString()}`);
  };

  const refreshEnt = useCallback(() => {
    if (!currentUser) return;
    fetchEntitlements().then((e) => {
      if (!e) return;
      const cap = Number(e.limits?.verificationsPerMonth) || 1;
      setEnt({
        plan: String(e.plan ?? 'free'),
        verificationsUsedThisMonth: Number(e.verificationsUsedThisMonth) || 0,
        limits: { verificationsPerMonth: cap, blindspot: Boolean(e.limits?.blindspot) },
      });
    });
  }, [currentUser]);

  useEffect(() => {
    if (params.get('success')) {
      toast({ title: 'Payment received', description: 'Your plan will update shortly.' });
    }
  }, [params, toast]);

  useEffect(() => {
    if (!isConvexBackend) return;
    fetchBillingPlans().then(setBilling);
    refreshEnt();
  }, [refreshEnt]);

  const resumedCheckout = useRef(false);
  useEffect(() => {
    const plan = params.get('plan');
    if (resumedCheckout.current || !currentUser?.email || (plan !== 'plus' && plan !== 'pro')) return;
    resumedCheckout.current = true;
    navigate('/pricing', { replace: true });
    void payWithRazorpay(plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email, params.get('plan')]);

  const payWithRazorpay = async (plan: 'plus' | 'pro') => {
    if (!currentUser?.email) {
      loginRedirect(plan);
      return;
    }
    setPaying(plan);
    try {
      await loadRazorpayScript();
      const order = await createRazorpayOrder(plan);
      if (!order?.keyId) {
        toast({ title: 'Billing unavailable', description: 'Set RAZORPAY_KEY_ID on the API.', variant: 'destructive' });
        setPaying(null);
        return;
      }

      const Rzp = window.Razorpay;
      if (!Rzp) throw new Error('Razorpay not loaded');

      const rzp = new Rzp({
        key: order.keyId,
        amount: Number(order.amount),
        currency: String(order.currency ?? 'INR'),
        name: FACETS.name,
        description: `${String(order.planName)} — monthly`,
        order_id: String(order.orderId),
        prefill: { email: currentUser.email, name: currentUser.displayName ?? undefined },
        theme: { color: '#0f172a' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const ok = await confirmRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });
          if (ok) {
            toast({ title: 'Subscribed', description: `You're on ${String(order.planName)}.` });
            refreshEnt();
          } else {
            toast({ title: 'Confirmation failed', variant: 'destructive' });
          }
          setPaying(null);
        },
        modal: { ondismiss: () => setPaying(null) },
      });
      rzp.open();
    } catch {
      toast({ title: 'Payment error', variant: 'destructive' });
      setPaying(null);
    }
  };

  const rawCatalog = billing?.catalog?.length ? billing.catalog : FALLBACK_CATALOG;
  const catalog = rawCatalog.map(normCatalogItem).filter((x): x is PlanCatalogItem => x !== null);
  const limits = billing?.plans ?? FALLBACK_LIMITS;
  const razorpayConfigured = Boolean(billing?.razorpayKeyId);

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Billing"
        title="Plans & pricing"
        description="Free tier for trying coverage and verify. Plus and Pro add blindspot insights, more verifications, and feed slots. Hosted checkout uses Razorpay in INR."
        align="center"
      />

      <PageSection width="wide">
        {ent && (
          <div className="mb-10 rounded-lg border border-border bg-card/80 p-5 sm:p-6">
            <div className="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <span className="text-sm text-muted-foreground">Current plan</span>
                <p className="text-lg font-semibold capitalize">{ent.plan}</p>
              </div>
              <div className="text-sm text-right">
                <span className="text-muted-foreground">Verifications this month</span>
                <p className="font-medium">
                  {ent.verificationsUsedThisMonth} / {ent.limits.verificationsPerMonth}
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(
                100,
                (ent.verificationsUsedThisMonth / Math.max(1, ent.limits.verificationsPerMonth)) * 100,
              )}
              className="h-2"
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {catalog.map((item) => {
            const p = normLimits(limits[item.id as keyof typeof limits]);
            const isCurrent = ent?.plan === item.id;
            const isFree = item.id === 'free';
            const price = Number(item.priceInr) || 0;
            return (
              <div
                key={item.id}
                className={cn(
                  'relative flex flex-col rounded-lg border border-border p-6 bg-card',
                  item.highlighted && 'border-primary/40',
                )}
              >
                {item.highlighted ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Popular
                  </span>
                ) : null}
                {isCurrent ? (
                  <span className="absolute top-4 right-4 text-xs font-medium text-primary">Current</span>
                ) : null}
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">{item.tagline}</p>
                <p className="mt-4 text-3xl font-bold">
                  {price === 0 ? 'Free' : formatInr(price)}
                  {price > 0 ? <span className="text-sm font-normal text-muted-foreground"> / mo</span> : null}
                </p>
                {p ? (
                  <ul className="mt-6 space-y-2 flex-1 text-sm">
                    {featureList(p).map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Button
                  className="mt-6 w-full"
                  variant={item.highlighted ? 'default' : 'outline'}
                  disabled={
                    isFree ||
                    isCurrent ||
                    paying !== null ||
                    (Boolean(currentUser) && !razorpayConfigured)
                  }
                  onClick={() => {
                    if (isFree || isCurrent) return;
                    const plan = item.id as 'plus' | 'pro';
                    if (!currentUser) {
                      loginRedirect(plan);
                      return;
                    }
                    void payWithRazorpay(plan);
                  }}
                >
                  {!currentUser
                    ? 'Sign in & subscribe'
                    : isCurrent
                      ? 'Current plan'
                      : isFree
                        ? 'Included'
                        : paying === item.id
                          ? 'Opening…'
                          : razorpayConfigured
                            ? 'Pay with Razorpay'
                            : 'Configure Razorpay on API'}
                </Button>
              </div>
            );
          })}
        </div>

        {razorpayConfigured ? (
          <p className="text-center text-xs text-muted-foreground mt-8">Payments processed by Razorpay</p>
        ) : null}
      </PageSection>

      <RelatedLinks
        links={[
          { to: '/feed', label: 'Feed' },
          { to: '/following', label: 'Following' },
          { to: '/legal', label: 'Legal' },
        ]}
      />
    </MarketingShell>
  );
};

export default Pricing;