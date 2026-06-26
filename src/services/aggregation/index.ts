import type { VerificationResult } from '@/types/news';
import { isConvexBackend } from './types';
import * as convex from './convexBackend';
import { legacyFetch, parseApiJson } from './legacyHttp';
import type {
  ApiOutlet,
  ApiStory,
  BillingPlansResponse,
  RazorpayOrderResponse,
} from './types';

export * from './types';

export async function fetchBillingPlans(): Promise<BillingPlansResponse | null> {
  if (isConvexBackend()) return convex.convexFetchBillingPlans();
  const res = await legacyFetch('/billing/plans');
  if (!res.ok) return null;
  return parseApiJson(res);
}

export async function fetchStories(limit = 40): Promise<ApiStory[]> {
  if (isConvexBackend()) return convex.convexFetchStories(limit);
  const res = await legacyFetch(`/stories?limit=${limit}`);
  if (!res.ok) throw new Error(`Stories API returned ${res.status}`);
  const data = await parseApiJson<{ stories: ApiStory[] }>(res);
  return data.stories ?? [];
}

export async function fetchStory(idOrSlug: string): Promise<ApiStory | null> {
  if (isConvexBackend()) return convex.convexFetchStory(idOrSlug);
  const res = await legacyFetch(`/stories/${encodeURIComponent(idOrSlug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Story API ${res.status}`);
  const data = await parseApiJson<{ story: ApiStory }>(res);
  return data.story ?? null;
}

export async function fetchOutlets(): Promise<ApiOutlet[]> {
  if (isConvexBackend()) return convex.convexFetchOutlets();
  const res = await legacyFetch('/outlets');
  if (!res.ok) throw new Error(`Outlets API ${res.status}`);
  const data = await parseApiJson<{ outlets: ApiOutlet[] }>(res);
  return data.outlets ?? [];
}

export async function fetchFollows(): Promise<{ outletId: string; name: string; biasLabel: string }[]> {
  if (isConvexBackend()) return convex.convexFetchFollows();
  const res = await legacyFetch('/me/follows');
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Follows API ${res.status}`);
  const data = await parseApiJson<{ follows: { outletId: string; name: string; biasLabel: string }[] }>(res);
  return data.follows ?? [];
}

export async function followOutlet(outletId: string): Promise<void> {
  if (isConvexBackend()) return convex.convexFollowOutlet(outletId);
  const res = await legacyFetch(`/me/follows/${outletId}`, { method: 'PUT' });
  if (!res.ok) throw new Error(`Follow failed ${res.status}`);
}

export async function unfollowOutlet(outletId: string): Promise<void> {
  if (isConvexBackend()) return convex.convexUnfollowOutlet(outletId);
  const res = await legacyFetch(`/me/follows/${outletId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Unfollow failed ${res.status}`);
}

export async function setBiasProfile(selfReportedLean: string | null): Promise<void> {
  if (isConvexBackend()) return convex.convexSetBiasProfile(selfReportedLean);
  const res = await legacyFetch('/me/bias-profile', {
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
  if (isConvexBackend()) return convex.convexFetchEntitlements();
  const res = await legacyFetch('/billing/entitlements');
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return parseApiJson(res);
}

export async function createRazorpayOrder(plan: 'plus' | 'pro'): Promise<RazorpayOrderResponse | null> {
  if (isConvexBackend()) {
    try {
      return await convex.convexCreateRazorpayOrder(plan);
    } catch {
      return null;
    }
  }
  const res = await legacyFetch('/billing/checkout', {
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
  if (isConvexBackend()) {
    try {
      await convex.convexConfirmRazorpayPayment(payload);
      return true;
    } catch {
      return false;
    }
  }
  const res = await legacyFetch('/billing/confirm', {
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
  if (isConvexBackend()) return convex.convexVerifyViaApi(content, articleUrl, searchResults);
  const res = await legacyFetch('/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, articleUrl, searchResults }),
  });
  return parseApiJson(res);
}

export async function fetchVerificationBySlug(slug: string) {
  if (isConvexBackend()) return convex.convexFetchVerificationBySlug(slug);
  return null;
}

export async function fetchUserVerificationsForDashboard(limit = 100) {
  if (isConvexBackend()) {
    const data = await convex.convexFetchUserVerifications(limit);
    return data.verifications;
  }
  return null;
}