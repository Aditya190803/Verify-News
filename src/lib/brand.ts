/** Product identity (UI, SEO, checkout). */
export const FACETS = {
  name: 'Facets',
  tagline: 'Many sides. One story.',
  description: 'Multi-source news coverage and AI fact-checking in one place.',
  legalName: 'Facets',
} as const;

/** Canonical site origin for sitemap, robots, OG (override with NEXT_PUBLIC_SITE_URL). */
export function facetsSiteUrl(): string {
  const fromEnv =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') : undefined;
  return fromEnv || 'https://facets.adityamer.dev';
}