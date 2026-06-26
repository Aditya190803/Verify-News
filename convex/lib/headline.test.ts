import { describe, expect, it } from 'vitest';
import { cleanHeadline, isLikelyNewsHeadline, pickCanonicalTitle } from './headline';

describe('headline', () => {
  it('drops lifestyle promos', () => {
    expect(isLikelyNewsHeadline('The 10 best Amazon deals to shop this week')).toBe(false);
    expect(isLikelyNewsHeadline('Parliament passes new data protection bill')).toBe(true);
  });

  it('picks shorter canonical among cluster', () => {
    const t = pickCanonicalTitle([
      "Opinion: Why millionaires like us want to pay more in taxes",
      'Data bill cleared in Rajya Sabha',
      'Rajya Sabha passes data protection bill',
    ]);
    expect(t.toLowerCase()).toContain('data');
  });

  it('strips opinion prefix', () => {
    expect(cleanHeadline('Opinion: Test headline')).toBe('Test headline');
  });
});