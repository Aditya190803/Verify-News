import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchExa, generateSearchVariations, searchTavily } from './searchUtils';

global.fetch = vi.fn();

describe('Search Improvement Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_EXA_API_KEY = 'test-exa-key';
    process.env.NEXT_PUBLIC_TAVILY_API_KEY = 'test-tavily-key';
  });

  describe('Exa search', () => {
    it('should call Exa API and map results', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ title: 'Result 1', url: 'https://example.com', text: 'Snippet 1' }],
          }),
      } as Response);

      const result = await searchExa('Test Query!!!');
      expect(result.webPages?.value).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-api-key': 'test-exa-key' }),
        }),
      );
    });

    it('should handle empty query gracefully', async () => {
      await expect(searchExa('')).rejects.toThrow();
    });
  });

  describe('Query Generation Tests', () => {
    it('should clean special characters and handle whitespace', () => {
      const variations = generateSearchVariations('  Hello   World!!!  ');
      expect(variations[0]).toBe('Hello World');
    });

    it('should generate topic-specific queries', () => {
      const longQuery = 'Apple Inc. announces new iPhone 16 with advanced AI features in Cupertino';
      const variations = generateSearchVariations(longQuery);
      expect(variations.some((v) => v.length < longQuery.length)).toBe(true);
    });
  });

  describe('Search Provider Tests (Tavily)', () => {
    it('should call Tavily API successfully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ title: 'Tavily Result', content: 'Tavily Content', url: 'https://tavily.com' }],
          }),
      } as Response);

      const result = await searchTavily('test query');
      expect(result.webPages?.value).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith('https://api.tavily.com/search', expect.any(Object));
    });

    it('should handle Tavily errors', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);
      await expect(searchTavily('test query')).rejects.toThrow('Tavily API returned 500');
    });
  });
});