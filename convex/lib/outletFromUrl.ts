import { OUTLET_SEED } from '../seedData';

export function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Match article URL to seeded India outlet (external id). */
export function outletExternalIdForUrl(url: string): string | null {
  const host = hostFromUrl(url);
  if (!host) return null;
  for (const o of OUTLET_SEED) {
    const d = o.domain.toLowerCase();
    if (host === d || host.endsWith(`.${d}`)) return o.id;
  }
  return null;
}