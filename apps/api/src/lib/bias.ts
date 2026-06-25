import type { BiasLabel } from '@verify-news/shared';

export function biasSpreadFromLabels(labels: BiasLabel[]): Partial<Record<BiasLabel, number>> {
  const spread: Partial<Record<BiasLabel, number>> = {};
  for (const label of labels) {
    spread[label] = (spread[label] ?? 0) + 1;
  }
  return spread;
}