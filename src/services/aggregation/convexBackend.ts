import type { VerificationResult } from '@/types/news';
import { getConvexHttpClient, api } from '@/services/convexClient';
import type {
  ApiOutlet,
  ApiStory,
  BillingPlansResponse,
  RazorpayOrderResponse,
} from './types';
function isAuthError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Not authenticated') || msg.includes('401');
}

function client() {
  const c = getConvexHttpClient();
  if (!c) throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
  return c;
}

export async function convexFetchBillingPlans(): Promise<BillingPlansResponse> {
  return client().query(api.billing.plans, {});
}

export async function convexFetchStories(
  limit: number,
  opts?: {
    searchQ?: string;
    minOutlets?: number;
    minLeft?: number;
    minRight?: number;
    factualityMin?: string;
    ownership?: string;
  },
): Promise<ApiStory[]> {
  const data = await client().query(api.stories.list, { limit, ...opts });
  return (data.stories ?? []) as ApiStory[];
}

export async function convexFetchBlindspot(side: string, limit: number): Promise<ApiStory[]> {
  const data = await client().query(api.stories.blindspotList, { side, limit });
  return (data.stories ?? []) as ApiStory[];
}

export async function convexSearchStories(q: string, limit: number): Promise<ApiStory[]> {
  const data = await client().query(api.stories.search, { q, limit });
  return (data.stories ?? []) as ApiStory[];
}

export async function convexCoverageDiet() {
  return client().query(api.stories.coverageDiet, {});
}

export async function convexGenerateBiasCompare(slug: string) {
  return client().action(api.storyCompare.generateBiasCompare, { slug });
}

export async function convexFetchStory(idOrSlug: string): Promise<ApiStory | null> {
  const data = await client().query(api.stories.getBySlug, { slug: idOrSlug });
  return (data.story ?? null) as ApiStory | null;
}

export async function convexFetchOutlets(): Promise<ApiOutlet[]> {
  const data = await client().query(api.outlets.list, {});
  return data.outlets as ApiOutlet[];
}

export async function convexFetchFollows() {
  try {
    const data = await client().query(api.follows.list, {});
    return data.follows;
  } catch (e) {
    if (isAuthError(e)) return [];
    throw e;
  }
}

export async function convexFollowOutlet(outletId: string) {
  await client().mutation(api.follows.follow, { outletExternalId: outletId });
}

export async function convexUnfollowOutlet(outletId: string) {
  await client().mutation(api.follows.unfollow, { outletExternalId: outletId });
}

export async function convexSetBiasProfile(selfReportedLean: string | null) {
  await client().mutation(api.follows.setBiasProfile, { selfReportedLean });
}

export async function convexFetchEntitlements() {
  try {
    return await client().query(api.billing.entitlements, {});
  } catch (e) {
    if (isAuthError(e)) return null;
    throw e;
  }
}

export async function convexCreateRazorpayOrder(plan: 'plus' | 'pro'): Promise<RazorpayOrderResponse> {
  return (await client().action(api.billingActions.createOrder, { plan })) as RazorpayOrderResponse;
}

export async function convexConfirmRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: string;
}) {
  await client().action(api.billingActions.confirmPayment, payload);
}

export async function convexVerifyViaApi(
  content: string,
  articleUrl?: string,
  searchResults?: unknown[],
) {
  const result = await client().action(api.verify.run, { content, articleUrl, searchResults });
  return result as { success: boolean; data: VerificationResult; slug?: string };
}

export async function convexFetchVerificationBySlug(slug: string) {
  return client().query(api.verifications.getBySlugOrHash, { slug });
}

export async function convexFetchUserVerifications(limit = 100) {
  return client().query(api.verifications.listForUser, { limit });
}