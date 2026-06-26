import { describe, expect, it } from 'vitest';
import { normalizePaidPlan } from './planPricing';

describe('planPricing', () => {
  it('normalizePaidPlan maps unknown to plus', () => {
    expect(normalizePaidPlan('pro')).toBe('pro');
    expect(normalizePaidPlan('plus')).toBe('plus');
    expect(normalizePaidPlan('x')).toBe('plus');
  });
});