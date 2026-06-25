import type { BiasLabel } from './aggregationTypes';

const SCORE: Record<BiasLabel, number> = {
  left: -2,
  'center-left': -1,
  center: 0,
  'center-right': 1,
  right: 2,
  unknown: 0,
};

export type BlindspotInsight = {
  message: string;
  storyHeavySide: 'left' | 'right' | 'balanced';
};

export function biasCenter(spread: Partial<Record<BiasLabel, number>>): number {
  let sum = 0;
  let n = 0;
  for (const [label, count] of Object.entries(spread)) {
    const c = count ?? 0;
    if (c <= 0) continue;
    sum += SCORE[label as BiasLabel] * c;
    n += c;
  }
  return n === 0 ? 0 : sum / n;
}

export function blindspotFromSpread(
  userFollowLabels: BiasLabel[],
  storySpread: Partial<Record<BiasLabel, number>>,
  selfReportedLean?: BiasLabel | null,
): BlindspotInsight | null {
  const followLabels =
    userFollowLabels.length > 0 ? userFollowLabels : selfReportedLean ? [selfReportedLean] : [];
  if (followLabels.length === 0 && !selfReportedLean) return null;

  const userCenter = followLabels.reduce((s, l) => s + SCORE[l], 0) / followLabels.length;
  const storyCenter = biasCenter(storySpread);
  const delta = storyCenter - userCenter;

  if (Math.abs(delta) < 0.6) {
    return {
      message: 'Coverage on this story aligns with the outlets you follow.',
      storyHeavySide: 'balanced',
    };
  }
  if (delta > 0) {
    return {
      message:
        'This story is covered more heavily by center-right and right outlets than your follow list suggests you usually read.',
      storyHeavySide: 'right',
    };
  }
  return {
    message:
      'This story is covered more heavily by left and center-left outlets than your follow list suggests you usually read.',
    storyHeavySide: 'left',
  };
}