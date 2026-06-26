export type PlanId = 'free' | 'plus' | 'pro';

export const PLAN_LIMITS: Record<
  PlanId,
  { verificationsPerMonth: number; customFeeds: number; blindspot: boolean; biasCompare: boolean; feedFilters: boolean }
> = {
  free: { verificationsPerMonth: 5, customFeeds: 3, blindspot: false, biasCompare: false, feedFilters: false },
  plus: { verificationsPerMonth: 50, customFeeds: 25, blindspot: true, biasCompare: true, feedFilters: true },
  pro: { verificationsPerMonth: 500, customFeeds: 9999, blindspot: true, biasCompare: true, feedFilters: true },
};

export type PlanDisplay = {
  id: PlanId;
  name: string;
  priceInr: number;
  interval: 'month';
  tagline: string;
  highlighted?: boolean;
};

export function planCatalog(): PlanDisplay[] {
  const plusInr = Number(process.env.RAZORPAY_PRICE_PLUS_INR ?? 299);
  const proInr = Number(process.env.RAZORPAY_PRICE_PRO_INR ?? 799);
  return [
    {
      id: 'free',
      name: 'Free',
      priceInr: 0,
      interval: 'month',
      tagline: 'Try coverage + limited verify',
    },
    {
      id: 'plus',
      name: 'Plus',
      priceInr: plusInr,
      interval: 'month',
      tagline: 'Blindspot insights + more verify',
      highlighted: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      priceInr: proInr,
      interval: 'month',
      tagline: 'Power readers & heavy fact-check',
    },
  ];
}