import { describe, expect, it } from 'vitest';
import { computeStoryBlindspot } from './blindspotFormula';

describe('blindspotFormula', () => {
  it('flags right-heavy as blindspot for left', () => {
    const r = computeStoryBlindspot({ right: 5, 'center-right': 2, center: 1, left: 1 }, 0.1);
    expect(r.side).toBe('left');
  });

  it('returns none when balanced', () => {
    const r = computeStoryBlindspot({ left: 2, right: 2, center: 2 }, 0.1);
    expect(r.side).toBe('none');
  });
});