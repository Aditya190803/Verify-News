import type { MetadataRoute } from 'next';
import { facetsSiteUrl } from '@/lib/brand';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = facetsSiteUrl();
  const paths = [
    '/',
    '/feed',
    '/blindspot',
    '/following',
    '/pricing',
    '/methodology',
    '/about',
    '/how-it-works',
    '/legal',
    '/login',
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' || path === '/feed' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/feed' ? 0.9 : 0.7,
  }));
}