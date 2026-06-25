import { describe, expect, it } from 'bun:test';
import { blindspotFromSpread } from './blindspot';

describe('blindspot', () => {
  it('flags right-heavy story vs left follows', () => {
    const insight = blindspotFromSpread(
      ['left', 'center-left'],
      { right: 2, 'center-right': 1 },
      null,
    );
    expect(insight?.storyHeavySide).toBe('right');
  });
});