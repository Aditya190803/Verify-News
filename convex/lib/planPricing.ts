import { planCatalog, type PlanId } from './plans';

export function planPricePaise(plan: string): number | null {
  const id = plan === 'pro' ? 'pro' : plan === 'plus' ? 'plus' : null;
  if (!id) return null;
  const item = planCatalog().find((p) => p.id === id);
  if (!item || item.priceInr <= 0) return null;
  return item.priceInr * 100;
}

export function normalizePaidPlan(plan: string): PlanId {
  return plan === 'pro' ? 'pro' : 'plus';
}