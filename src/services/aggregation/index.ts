import type { VerificationResult } from '@/types/news';
import * as convex from './convexBackend';

export * from './types';

function requireConvex() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('Set NEXT_PUBLIC_CONVEX_URL in .env.local (see docs/LOCAL_DEV.md)');
  }
}

export async function fetchBillingPlans() {
  requireConvex();
  return convex.convexFetchBillingPlans();
}

export async function fetchStories(limit = 40) {
  requireConvex();
  return convex.convexFetchStories(limit);
}

export async function fetchStory(idOrSlug: string) {
  requireConvex();
  return convex.convexFetchStory(idOrSlug);
}

export async function fetchOutlets() {
  requireConvex();
  return convex.convexFetchOutlets();
}

export async function fetchFollows() {
  requireConvex();
  return convex.convexFetchFollows();
}

export async function followOutlet(outletId: string) {
  requireConvex();
  return convex.convexFollowOutlet(outletId);
}

export async function unfollowOutlet(outletId: string) {
  requireConvex();
  return convex.convexUnfollowOutlet(outletId);
}

export async function setBiasProfile(selfReportedLean: string | null) {
  requireConvex();
  return convex.convexSetBiasProfile(selfReportedLean);
}

export async function fetchEntitlements() {
  requireConvex();
  return convex.convexFetchEntitlements();
}

export async function createRazorpayOrder(plan: 'plus' | 'pro') {
  requireConvex();
  try {
    return await convex.convexCreateRazorpayOrder(plan);
  } catch {
    return null;
  }
}

export async function confirmRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: string;
}) {
  requireConvex();
  try {
    await convex.convexConfirmRazorpayPayment(payload);
    return true;
  } catch {
    return false;
  }
}

export async function verifyViaApi(
  content: string,
  articleUrl?: string,
  searchResults?: unknown[],
): Promise<{ success: boolean; data: VerificationResult }> {
  requireConvex();
  return convex.convexVerifyViaApi(content, articleUrl, searchResults);
}

export async function fetchVerificationBySlug(slug: string) {
  requireConvex();
  return convex.convexFetchVerificationBySlug(slug);
}

export async function fetchUserVerificationsForDashboard(limit = 100) {
  requireConvex();
  const data = await convex.convexFetchUserVerifications(limit);
  return data.verifications;
}