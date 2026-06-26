import type { NewsVeracity } from '@/types/news';

/** Map server/API veracity strings to UI bucket. */
export function normalizeVeracity(v: string | undefined): 'true' | 'false' | 'partially-true' | 'unverified' {
  const x = (v ?? 'unverified').toLowerCase();
  if (x === 'true' || x === 'verified') return 'true';
  if (x === 'false' || x === 'misleading') return 'false';
  if (x === 'partially-true' || x === 'partial') return 'partially-true';
  return 'unverified';
}

export function veracityLabel(v: string | undefined): string {
  switch (normalizeVeracity(v)) {
    case 'true':
      return 'True';
    case 'false':
      return 'False';
    case 'partially-true':
      return 'Partially True';
    default:
      return 'Unverified';
  }
}

export function isPositiveVeracity(v: NewsVeracity | string | undefined): boolean {
  return normalizeVeracity(v) === 'true';
}

export function isNegativeVeracity(v: NewsVeracity | string | undefined): boolean {
  const n = normalizeVeracity(v);
  return n === 'false';
}