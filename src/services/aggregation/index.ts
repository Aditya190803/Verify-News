import type { VerificationResult } from '@/types/news';
import { logger } from '@/lib/logger';
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

export async function fetchStories(
  limit = 40,
  opts?: Parameters<typeof convex.convexFetchStories>[1],
) {
  requireConvex();
  return convex.convexFetchStories(limit, opts);
}

export async function fetchBlindspotStories(side: 'all' | 'left' | 'right' = 'all', limit = 30) {
  requireConvex();
  return convex.convexFetchBlindspot(side, limit);
}

export async function searchStories(q: string, limit = 25) {
  requireConvex();
  return convex.convexSearchStories(q, limit);
}

export async function fetchCoverageDiet() {
  requireConvex();
  return convex.convexCoverageDiet();
}

export async function generateBiasCompare(slug: string) {
  requireConvex();
  return convex.convexGenerateBiasCompare(slug);
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
  } catch (e) {
    logger.error('createRazorpayOrder failed', e);
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
  } catch (e) {
    logger.error('confirmRazorpayPayment failed', e);
    return false;
  }
}

export async function verifyViaApi(
  content: string,
  articleUrl?: string,
  searchResults?: unknown[],
): Promise<{ success: boolean; data: VerificationResult; slug?: string }> {
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