import type { PlanId } from './plans';
import { PLAN_LIMITS } from './plans';

export function entitlementsForPlan(plan: PlanId) {
  return { plan, limits: PLAN_LIMITS[plan] };
}

export function normalizePlan(plan: string | undefined): PlanId {
  if (plan === 'plus' || plan === 'pro') return plan;
  return 'free';
}