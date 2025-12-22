import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLangSearch, generateSearchVariations, searchTavily } from './searchUtils';

// Mock fetch
global.fetch = vi.fn();

describe('Search Improvement Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VITE_LANGSEARCH_API_KEY = 'test-langsearch-key';
    process.env.VITE_TAVILY_API_KEY = 'test-tavily-key';
  });

  describe('First Attempt Search Tests', () => {
    it('should succeed on first attempt with normalized query', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            webPages: {
              value: [{ name: 'Result 1', snippet: 'Snippet 1', url: 'https://example.com' }]
            }
          }
        })
      } as Response);

      const result = await searchLangSearch('Test Query!!!');
      expect(result.webPages?.value).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: expect.stringContaining('Test Query')
      }));
    });

    it('should handle empty query gracefully', async () => {
      await expect(searchLangSearch('')).rejects.toThrow();
    });

    it('should clean special characters and handle whitespace', () => {
      const variations = generateSearchVariations('  Hello   World!!!  ');
      expect(variations[0]).toBe('Hello World');
    });
  });

  describe('Query Generation Tests', () => {
    it('should generate topic-specific queries and avoid company-level if possible', () => {
      const longQuery = 'Apple Inc. announces new iPhone 16 with advanced AI features in Cupertino';
      const variations = generateSearchVariations(longQuery);
      
      // Should have a shortened version
      expect(variations.some(v => v.length < longQuery.length)).toBe(true);
    });

    it('should extract relevant key terms', () => {
      const query = 'The impact of climate change on polar bear populations in 2025';
      const variations = generateSearchVariations(query);
      
      // Should have a version with just key terms
      expect(variations.some(v => v.includes('impact') && v.includes('climate') && v.includes('change'))).toBe(true);
    });
  });

  describe('Search Provider Tests (Tavily)', () => {
    it('should initialize and call Tavily API successfully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{ title: 'Tavily Result', content: 'Tavily Content', url: 'https://tavily.com' }]
        })
      } as Response);

      const result = await searchTavily('test query');
      expect(result.webPages?.value).toHaveLength(1);
      expect(result.webPages?.value[0].name).toBe('Tavily Result');
      expect(fetch).toHaveBeenCalledWith('https://api.tavily.com/search', expect.any(Object));
    });

    it('should handle Tavily timeout/errors', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500
      } as Response);

      await expect(searchTavily('test query')).rejects.toThrow('Tavily API returned 500');
    });
  });
});
