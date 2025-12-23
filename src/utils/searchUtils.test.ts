import { describe, it, expect } from 'vitest';
import { extractNewsFromSearch, generateSearchVariations } from './searchUtils';
import type { SearchResponse } from '@/types/news';

describe('searchUtils utilities', () => {
  describe('extractNewsFromSearch', () => {
    it('extracts articles from webPages.value format', () => {
      const results = {
        webPages: {
          value: [
            {
              name: 'Test Article 1',
              snippet: 'This is a test snippet for article 1',
              url: 'https://example.com/article1',
              summary: 'Test summary 1',
            },
            {
              name: 'Test Article 2',
              snippet: 'This is a test snippet for article 2',
              url: 'https://example.com/article2',
            },
          ],
        },
      };

      const articles = extractNewsFromSearch(results, 'test');
      expect(articles).toHaveLength(2);
      expect(articles[0].title).toBe('Test Article 1');
      expect(articles[0].snippet).toBe('This is a test snippet for article 1');
      expect(articles[0].url).toBe('https://example.com/article1');
    });

    it('returns empty array for null results', () => {
      const articles = extractNewsFromSearch(null as unknown as SearchResponse, 'test');
      expect(articles).toHaveLength(0);
    });

    it('returns empty array for results without webPages', () => {
      const articles = extractNewsFromSearch({} as unknown as SearchResponse, 'test');
      expect(articles).toHaveLength(0);
    });

    it('sorts articles by relevance score', () => {
      const results = {
        webPages: {
          value: [
            {
              name: 'Unrelated Article',
              snippet: 'Nothing about the search term',
              url: 'https://example.com/article1',
            },
            {
              name: 'Best Match Article',
              snippet: 'This is about best match and more best match content',
              url: 'https://example.com/article2',
            },
          ],
        },
      };

      const articles = extractNewsFromSearch(results, 'best match');
      expect(articles).toHaveLength(2);
      expect(articles[0].title).toBe('Best Match Article');
    });

    it('limits results to 10 articles', () => {
      const results = {
        webPages: {
          value: Array.from({ length: 15 }, (_, i) => ({
            name: `Article ${i + 1}`,
            snippet: `Snippet ${i + 1}`,
            url: `https://example.com/article${i + 1}`,
          })),
        },
      };

      const articles = extractNewsFromSearch(results, 'test');
      expect(articles).toHaveLength(10);
    });

    it('extracts from value format (fallback)', () => {
      const results = {
        value: [
          {
            name: 'Fallback Article',
            snippet: 'Fallback snippet',
            url: 'https://example.com/fallback',
          },
        ],
      };

      const articles = extractNewsFromSearch(results, 'test');
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Fallback Article');
    });
  });

  describe('generateSearchVariations', () => {
    it('includes original query', () => {
      const variations = generateSearchVariations('test query');
      expect(variations).toContain('test query');
    });

    it('includes quoted exact phrase', () => {
      const variations = generateSearchVariations('test query');
      expect(variations).toContain('"test query"');
    });

    it('includes news-specific searches', () => {
      const variations = generateSearchVariations('test query');
      expect(variations).toContain('test query news');
      expect(variations).toContain('test query breaking news');
      expect(variations).toContain('test query latest');
    });

    it('creates word combinations for longer queries', () => {
      const variations = generateSearchVariations('word1 word2 word3 word4');
      expect(variations.some(v => v.includes('word1') && v.includes('word2'))).toBe(true);
    });

    it('removes duplicates', () => {
      const variations = generateSearchVariations('test');
      const uniqueVariations = [...new Set(variations)];
      expect(variations.length).toBe(uniqueVariations.length);
    });
  });
});
