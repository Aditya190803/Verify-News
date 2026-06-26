import type { MetadataRoute } from 'next';
import { facetsSiteUrl } from '@/lib/brand';

export default function robots(): MetadataRoute.Robots {
  const base = facetsSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/feed', '/blindspot', '/about', '/how-it-works', '/methodology', '/pricing', '/legal'],
      disallow: ['/dashboard/', '/settings/', '/result/', '/search-results/', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}