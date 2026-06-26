export type ApiStory = {
  id: string;
  canonicalTitle: string;
  slug: string;
  sourceCount: number;
  biasSpread: Record<string, number>;
  blindspot?: { message: string; storyHeavySide: string } | null;
  blindspotSide?: 'left' | 'right' | null;
  blindspotReason?: string | null;
  biasCompareSummary?: string | null;
  articles: {
    id: string;
    url: string;
    title: string;
    summary: string | null;
    outlet?: {
      id?: string;
      name: string;
      biasLabel: string;
      domain: string;
      factuality?: string;
      ownershipCategory?: string | null;
    };
  }[];
};

export type ApiOutlet = {
  id: string;
  name: string;
  domain: string;
  biasLabel: string;
  factuality: string;
  ownershipCategory?: string | null;
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
  plans: Record<string, { verificationsPerMonth: number; customFeeds: number; blindspot: boolean; biasCompare?: boolean; feedFilters?: boolean }>;
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