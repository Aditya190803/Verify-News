import type { BiasLabel } from './aggregationTypes';

export type BlindspotSide = 'left' | 'right' | 'none';

const LEFT: BiasLabel[] = ['left', 'center-left'];
const RIGHT: BiasLabel[] = ['right', 'center-right'];

export function countBySide(spread: Partial<Record<BiasLabel, number>>) {
  let left = 0;
  let right = 0;
  let center = 0;
  let lowFact = 0;
  let total = 0;
  for (const [label, n] of Object.entries(spread)) {
    const c = n ?? 0;
    if (c <= 0) continue;
    total += c;
    if (LEFT.includes(label as BiasLabel)) left += c;
    else if (RIGHT.includes(label as BiasLabel)) right += c;
    else if (label === 'center') center += c;
  }
  return { left, right, center, total };
}

/** Ground-inspired rules adapted to India 5-bucket spread (article counts). */
export function computeStoryBlindspot(
  spread: Partial<Record<BiasLabel, number>>,
  lowFactualityShare: number,
): { side: BlindspotSide; reason: string } {
  const { left, right, center, total } = countBySide(spread);
  if (total < 3) return { side: 'none', reason: 'too_few_sources' };
  if (lowFactualityShare > 0.35) return { side: 'none', reason: 'low_factuality_cap' };

  const leftPct = (left / total) * 100;
  const rightPct = (right / total) * 100;

  // Blindspot for left-leaning readers: right-heavy, left under-covered
  if (left < 3 && rightPct >= 33 && leftPct <= Math.max(0, rightPct - 33) * (30 / 37)) {
    return {
      side: 'left',
      reason: `Only ${left} left-leaning source(s); ${rightPct.toFixed(0)}% right-leaning coverage`,
    };
  }

  // Blindspot for right-leaning readers: left-heavy
  if (right < 3 && leftPct >= 33 && rightPct <= Math.max(0, leftPct - 33) * (30 / 37)) {
    return {
      side: 'right',
      reason: `Only ${right} right-leaning source(s); ${leftPct.toFixed(0)}% left-leaning coverage`,
    };
  }

  // Simpler skew fallback (quick win)
  if (leftPct >= 70 && right < 2) {
    return { side: 'right', reason: `${leftPct.toFixed(0)}% left-leaning; few right sources` };
  }
  if (rightPct >= 70 && left < 2) {
    return { side: 'left', reason: `${rightPct.toFixed(0)}% right-leaning; few left sources` };
  }

  return { side: 'none', reason: 'balanced' };
}

export function lowFactualityShare(
  articles: { outlet?: { factuality?: string } | null }[],
): number {
  if (!articles.length) return 0;
  const low = articles.filter((a) => a.outlet?.factuality === 'low' || a.outlet?.factuality === 'mixed').length;
  return low / articles.length;
}