export type ApiStory = {
  id: string;
  canonicalTitle: string;
  slug: string;
  sourceCount: number;
  biasSpread: Record<string, number>;
  blindspot?: { message: string; storyHeavySide: string } | null;
  articles: {
    id: string;
    url: string;
    title: string;
    summary: string | null;
    outlet?: { id?: string; name: string; biasLabel: string; domain: string };
  }[];
};

export type ApiOutlet = {
  id: string;
  name: string;
  domain: string;
  biasLabel: string;
  factuality: string;
};

export type PlanCatalogItem = {
  id: string;
  name: string;
  priceInr: number;
  interval: string;
  tagline: string;
  highlighted?: boolean;
};

export type BillingPlansResponse = {
  provider: string;
  currency: string;
  billingEnabled: boolean;
  razorpayKeyId: string | null;
  catalog: PlanCatalogItem[];
  plans: Record<string, { verificationsPerMonth: number; customFeeds: number; blindspot: boolean }>;
};

export type RazorpayOrderResponse = {
  provider: 'razorpay';
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: string;
  planName: string;
  priceInr: number;
};

export function isConvexBackend() {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
}