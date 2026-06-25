import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { subscriptions } from '../db/schema';
import { PLAN_LIMITS, type PlanId } from './plans';

export async function getUserPlan(userId: string): Promise<PlanId> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  if (sub?.status === 'active' && (sub.plan === 'plus' || sub.plan === 'pro' || sub.plan === 'free')) {
    return sub.plan as PlanId;
  }
  return 'free';
}

export async function getEntitlements(userId: string) {
  const plan = await getUserPlan(userId);
  return { plan, limits: PLAN_LIMITS[plan] };
}