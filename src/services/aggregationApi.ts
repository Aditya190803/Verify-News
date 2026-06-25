import { apiBaseUrl, apiHeaders, apiUrl } from '@/config/api';
import type { VerificationResult } from '@/types/news';
import { getConvexHttpClient, api } from '@/services/convexClient';

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

function convexEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
}

async function apiFetch(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  if (!url) throw new Error('Aggregation API URL is not configured');
  const auth = await apiHeaders();
  return fetch(url, { ...init, headers: { ...auth, ...init?.headers } });
}

async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!')) {
    throw new Error(
      `Got a web page instead of API data. Base URL: "${apiBaseUrl}".`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Could not read API response (HTTP ${res.status}).`);
  }
}

export async function fetchBillingPlans(): Promise<BillingPlansResponse | null> {
  const c = getConvexHttpClient();
  if (c) return c.query(api.billing.plans, {});
  const res = await apiFetch('/billing/plans');
  if (!res.ok) return null;
  return parseApiJson(res);
}

export async function fetchStories(limit = 40): Promise<ApiStory[]> {
  const c = getConvexHttpClient();
  if (c) {
    const data = await c.query(api.stories.list, { limit });
    return (data.stories ?? []) as ApiStory[];
  }
  const res = await apiFetch(`/stories?limit=${limit}`);
  if (!res.ok) throw new Error(`Stories API returned ${res.status}`);
  const data = await parseApiJson<{ stories: ApiStory[] }>(res);
  return data.stories ?? [];
}

export async function fetchStory(idOrSlug: string): Promise<ApiStory | null> {
  const c = getConvexHttpClient();
  if (c) {
    const data = await c.query(api.stories.getBySlug, { slug: idOrSlug });
    return (data.story ?? null) as ApiStory | null;
  }
  const res = await apiFetch(`/stories/${encodeURIComponent(idOrSlug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Story API ${res.status}`);
  const data = await parseApiJson<{ story: ApiStory }>(res);
  return data.story ?? null;
}

export async function fetchOutlets(): Promise<ApiOutlet[]> {
  const c = getConvexHttpClient();
  if (c) {
    const data = await c.query(api.outlets.list, {});
    return data.outlets as ApiOutlet[];
  }
  const res = await apiFetch('/outlets');
  if (!res.ok) throw new Error(`Outlets API ${res.status}`);
  const data = await parseApiJson<{ outlets: ApiOutlet[] }>(res);
  return data.outlets ?? [];
}

export async function fetchFollows(): Promise<{ outletId: string; name: string; biasLabel: string }[]> {
  const c = getConvexHttpClient();
  if (c) {
    try {
      const data = await c.query(api.follows.list, {});
      return data.follows;
    } catch {
      return [];
    }
  }
  const res = await apiFetch('/me/follows');
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Follows API ${res.status}`);
  const data = await parseApiJson<{ follows: { outletId: string; name: string; biasLabel: string }[] }>(res);
  return data.follows ?? [];
}

export async function followOutlet(outletId: string): Promise<void> {
  const c = getConvexHttpClient();
  if (c) {
    await c.mutation(api.follows.follow, { outletExternalId: outletId });
    return;
  }
  const res = await apiFetch(`/me/follows/${outletId}`, { method: 'PUT' });
  if (!res.ok) throw new Error(`Follow failed ${res.status}`);
}

export async function unfollowOutlet(outletId: string): Promise<void> {
  const c = getConvexHttpClient();
  if (c) {
    await c.mutation(api.follows.unfollow, { outletExternalId: outletId });
    return;
  }
  const res = await apiFetch(`/me/follows/${outletId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Unfollow failed ${res.status}`);
}

export async function setBiasProfile(selfReportedLean: string | null): Promise<void> {
  const c = getConvexHttpClient();
  if (c) {
    await c.mutation(api.follows.setBiasProfile, { selfReportedLean });
    return;
  }
  const res = await apiFetch('/me/bias-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfReportedLean }),
  });
  if (!res.ok) throw new Error(`Profile failed ${res.status}`);
}

export async function fetchEntitlements(): Promise<{
  plan: string;
  limits: { verificationsPerMonth: number; blindspot: boolean };
  verificationsUsedThisMonth: number;
} | null> {
  const c = getConvexHttpClient();
  if (c) {
    try {
      return await c.query(api.billing.entitlements, {});
    } catch {
      return null;
    }
  }
  const res = await apiFetch('/billing/entitlements');
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return parseApiJson(res);
}

export async function createRazorpayOrder(plan: 'plus' | 'pro'): Promise<RazorpayOrderResponse | null> {
  const c = getConvexHttpClient();
  if (c) {
    try {
      return (await c.action(api.billingActions.createOrder, { plan })) as RazorpayOrderResponse;
    } catch {
      return null;
    }
  }
  const res = await apiFetch('/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) return null;
  return parseApiJson(res);
}

export async function confirmRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: string;
}): Promise<boolean> {
  const c = getConvexHttpClient();
  if (c) {
    try {
      await c.action(api.billingActions.confirmPayment, payload);
      return true;
    } catch {
      return false;
    }
  }
  const res = await apiFetch('/billing/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function verifyViaApi(
  content: string,
  articleUrl?: string,
  searchResults?: unknown[],
): Promise<{ success: boolean; data: VerificationResult }> {
  const c = getConvexHttpClient();
  if (c) {
    const result = await c.action(api.verify.run, { content, articleUrl, searchResults });
    return result as { success: boolean; data: VerificationResult };
  }
  const res = await apiFetch('/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, articleUrl, searchResults }),
  });
  return parseApiJson(res);
}

export function isConvexBackend() {
  return convexEnabled();
}