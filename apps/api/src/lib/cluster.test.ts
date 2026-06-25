import { describe, expect, it } from 'bun:test';
import { jaccard, titleTokens, titlesMatch } from './cluster';

describe('cluster', () => {
  it('matches similar headlines same day', () => {
    const a = 'President signs new climate bill into law';
    const b = 'President signs climate bill into law';
    const day = new Date('2026-01-15T12:00:00Z');
    expect(titlesMatch(a, b, day, day)).toBe(true);
  });

  it('rejects unrelated headlines', () => {
    expect(titlesMatch('Football transfer news', 'Stock market hits record', null, null)).toBe(false);
  });

  it('jaccard on tokens', () => {
    const t = titleTokens('climate bill climate');
    expect(jaccard(t, t)).toBe(1);
  });
});