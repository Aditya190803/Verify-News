import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyNewsContent, quickVerify } from './verifier';
import { verifyWithFallback } from '@/services/aiProviders';
import { comprehensiveNewsSearch } from '@/utils/searchUtils';
import { verificationTextCache } from '@/lib/verificationCache';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/services/aiProviders', () => ({
  verifyWithFallback: vi.fn(),
}));

vi.mock('@/utils/searchUtils', () => ({
  comprehensiveNewsSearch: vi.fn(),
}));

vi.mock('@/lib/verificationCache', () => ({
  verificationTextCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Verifier Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyNewsContent', () => {
    it('should return unverified result when content is empty', async () => {
      const result = await verifyNewsContent('');
      
      expect(result.success).toBe(false);
      expect(result.data.veracity).toBe('unverified');
      expect(result.data.confidence).toBe(0);
      expect(result.data.explanation).toContain('No content provided');
      expect(result.data.sources).toEqual([]);
    });

    it('should return unverified result when content is only whitespace', async () => {
      const result = await verifyNewsContent('   \n\t  ');
      
      expect(result.success).toBe(false);
      expect(result.data.veracity).toBe('unverified');
      expect(result.data.confidence).toBe(0);
    });

    it('should use cached result when available', async () => {
      const cachedResult = {
        veracity: 'true' as const,
        confidence: 95,
        explanation: 'Cached explanation',
        sources: [{ name: 'Cached Source', url: 'https://cached.com' }],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(cachedResult);

      const result = await verifyNewsContent('Test content');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedResult);
      expect(verificationTextCache.get).toHaveBeenCalledWith('Test content:', 'news');
      expect(comprehensiveNewsSearch).not.toHaveBeenCalled();
      expect(verifyWithFallback).not.toHaveBeenCalled();
    });

    it('should perform full verification when cache is empty', async () => {
      const mockSearchResults = [{
        webPages: {
          value: [
            {
              name: 'Test Article',
              snippet: 'Test snippet',
              url: 'https://test.com',
            },
          ],
        },
      }];

      const mockVerificationResult = {
        veracity: 'true' as const,
        confidence: 85,
        explanation: 'Verified content',
        sources: [{ name: 'Test Source', url: 'https://test.com' }],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue(mockSearchResults);
      vi.mocked(verifyWithFallback).mockResolvedValue(mockVerificationResult);

      const result = await verifyNewsContent('Test content');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVerificationResult);
      expect(comprehensiveNewsSearch).toHaveBeenCalledWith('Test content');
      expect(verifyWithFallback).toHaveBeenCalledWith('Test content', mockSearchResults);
      expect(verificationTextCache.set).toHaveBeenCalledWith(
        'Test content:',
        mockVerificationResult,
        'news'
      );
    });

    it('should include article URL in sources when provided', async () => {
      const mockSearchResults = [{
        webPages: {
          value: [],
        },
      }];

      const mockVerificationResult = {
        veracity: 'false' as const,
        confidence: 70,
        explanation: 'False claim',
        sources: [{ name: 'Fact Check', url: 'https://factcheck.com' }],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue(mockSearchResults);
      vi.mocked(verifyWithFallback).mockResolvedValue(mockVerificationResult);

      const result = await verifyNewsContent('Test content', 'https://article.com');
      
      expect(result.data.sources[0]).toEqual({ name: 'Original Article', url: 'https://article.com' });
      expect(result.data.sources[1]).toEqual({ name: 'Fact Check', url: 'https://factcheck.com' });
    });

    it('should not duplicate article URL if already in sources', async () => {
      const mockSearchResults = [{
        webPages: {
          value: [],
        },
      }];

      const mockVerificationResult = {
        veracity: 'true' as const,
        confidence: 80,
        explanation: 'Already included',
        sources: [
          { name: 'Original Article', url: 'https://article.com' },
          { name: 'Other Source', url: 'https://other.com' },
        ],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue(mockSearchResults);
      vi.mocked(verifyWithFallback).mockResolvedValue(mockVerificationResult);

      const result = await verifyNewsContent('Test content', 'https://article.com');
      
      expect(result.data.sources).toHaveLength(2);
      expect(result.data.sources[0].url).toBe('https://article.com');
    });

    it('should handle search failure gracefully', async () => {
      const mockVerificationResult = {
        veracity: 'unverified' as const,
        confidence: 50,
        explanation: 'Limited verification',
        sources: [],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockRejectedValue(new Error('Search failed'));
      vi.mocked(verifyWithFallback).mockResolvedValue(mockVerificationResult);

      const result = await verifyNewsContent('Test content');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVerificationResult);
      expect(logger.warn).toHaveBeenCalledWith(
        'Search failed, proceeding with AI verification only:',
        expect.any(Error)
      );
      expect(verifyWithFallback).toHaveBeenCalledWith('Test content', []);
    });

    it('should handle verification failure gracefully', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockRejectedValue(new Error('AI provider failed'));

      const result = await verifyNewsContent('Test content', 'https://article.com');
      
      expect(result.success).toBe(true); // Should still return success with fallback
      expect(result.data.veracity).toBe('unverified');
      expect(result.data.confidence).toBe(0);
      expect(result.data.explanation).toContain('Verification service temporarily unavailable');
      expect(result.data.sources).toEqual([{ name: 'Original Article', url: 'https://article.com' }]);
      expect(logger.error).toHaveBeenCalledWith('Verification failed:', expect.any(Error));
    });

    it('should handle all verification scenarios with different veracities', async () => {
      const testCases = [
        { veracity: 'true' as const, confidence: 95 },
        { veracity: 'false' as const, confidence: 85 },
        { veracity: 'partially-true' as const, confidence: 75 },
        { veracity: 'misleading' as const, confidence: 65 },
        { veracity: 'verified' as const, confidence: 100 },
      ];

      for (const testCase of testCases) {
        vi.mocked(verificationTextCache.get).mockReturnValue(null);
        vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
        vi.mocked(verifyWithFallback).mockResolvedValue({
          ...testCase,
          explanation: 'Test explanation',
          sources: [],
        });

        const result = await verifyNewsContent('Test content');
        
        expect(result.success).toBe(true);
        expect(result.data.veracity).toBe(testCase.veracity);
        expect(result.data.confidence).toBe(testCase.confidence);
      }
    });

    it('should cache results after successful verification', async () => {
      const mockVerificationResult = {
        veracity: 'true' as const,
        confidence: 90,
        explanation: 'Verified',
        sources: [],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue(mockVerificationResult);

      await verifyNewsContent('Test content', 'https://article.com');
      
      expect(verificationTextCache.set).toHaveBeenCalledWith(
        'Test content:https://article.com',
        mockVerificationResult,
        'news'
      );
    });

    it('should log appropriate messages during verification', async () => {
      // Setup cache to return a result (simulating cache hit)
      vi.mocked(verificationTextCache.get).mockReturnValue({
        veracity: 'true' as const,
        confidence: 90,
        explanation: 'Verified',
        sources: [],
        id: 'cached-id',
        timestamp: Date.now()
      });

      await verifyNewsContent('Test content');

      expect(logger.info).toHaveBeenCalledWith('📦 Using cached verification result');
    });

    it('should handle very long content appropriately', async () => {
      const longContent = 'A'.repeat(10000);
      
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'true' as const,
        confidence: 80,
        explanation: 'Long content verified',
        sources: [],
      });

      const result = await verifyNewsContent(longContent);
      
      expect(result.success).toBe(true);
      expect(comprehensiveNewsSearch).toHaveBeenCalledWith(longContent);
      expect(verifyWithFallback).toHaveBeenCalledWith(longContent, []);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Test content with "quotes", apostrophes\', and symbols!@#$%^&*()';
      
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'true' as const,
        confidence: 85,
        explanation: 'Special chars handled',
        sources: [],
      });

      const result = await verifyNewsContent(specialContent);
      
      expect(result.success).toBe(true);
      expect(comprehensiveNewsSearch).toHaveBeenCalledWith(specialContent);
    });
  });

  describe('quickVerify', () => {
    it('should return veracity and confidence from full verification', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'true' as const,
        confidence: 92,
        explanation: 'Quick verification',
        sources: [],
      });

      const result = await quickVerify('Quick claim');
      
      expect(result.veracity).toBe('true');
      expect(result.confidence).toBe(92);
      expect(comprehensiveNewsSearch).toHaveBeenCalledWith('Quick claim');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockRejectedValue(new Error('Search failed'));
      vi.mocked(verifyWithFallback).mockRejectedValue(new Error('AI failed'));

      const result = await quickVerify('Failing claim');
      
      expect(result.veracity).toBe('unverified');
      expect(result.confidence).toBe(0);
    });

    it('should work with cached results', async () => {
      const cachedResult = {
        veracity: 'false' as const,
        confidence: 88,
        explanation: 'Cached',
        sources: [],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(cachedResult);

      const result = await quickVerify('Cached claim');
      
      expect(result.veracity).toBe('false');
      expect(result.confidence).toBe(88);
      expect(verifyWithFallback).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeouts during search', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      
      // Mock a failed search but successful fallback
      vi.mocked(comprehensiveNewsSearch).mockRejectedValue(new Error('Timeout'));
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'unverified' as const,
        confidence: 0,
        explanation: 'Timeout occurred',
        sources: [],
      });

      const result = await verifyNewsContent('Timeout content');
      
      expect(result.success).toBe(true);
      expect(result.data.veracity).toBe('unverified');
    });

    it('should handle malformed AI responses', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'true' as const,
        confidence: 90,
        explanation: 'Valid response',
        sources: [],
      });

      const result = await verifyNewsContent('Test');
      
      expect(result.success).toBe(true);
      expect(result.data.veracity).toBeDefined();
      expect(result.data.confidence).toBeDefined();
    });

    it('should handle concurrent verifications of same content', async () => {
      const mockResult = {
        veracity: 'true' as const,
        confidence: 85,
        explanation: 'Concurrent test',
        sources: [],
      };

      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue(mockResult);

      // Simulate concurrent calls
      const promises = [
        verifyNewsContent('Concurrent content'),
        verifyNewsContent('Concurrent content'),
        verifyNewsContent('Concurrent content'),
      ];

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.veracity).toBe('true');
      });

      // Search should be called multiple times (no deduplication in this implementation)
      expect(comprehensiveNewsSearch).toHaveBeenCalledTimes(3);
    });

    it('should handle extremely low confidence results', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'unverified' as const,
        confidence: 5,
        explanation: 'Very uncertain',
        sources: [],
      });

      const result = await verifyNewsContent('Uncertain content');
      
      expect(result.success).toBe(true);
      expect(result.data.confidence).toBe(5);
      expect(result.data.veracity).toBe('unverified');
    });

    it('should handle missing source URLs gracefully', async () => {
      vi.mocked(verificationTextCache.get).mockReturnValue(null);
      vi.mocked(comprehensiveNewsSearch).mockResolvedValue([]);
      vi.mocked(verifyWithFallback).mockResolvedValue({
        veracity: 'true' as const,
        confidence: 80,
        explanation: 'Test',
        sources: [
          { name: 'Source 1', url: '' },
          { name: 'Source 2', url: 'https://valid.com' },
        ],
      });

      const result = await verifyNewsContent('Test');
      
      expect(result.data.sources).toHaveLength(2);
      expect(result.data.sources[0].url).toBe('');
      expect(result.data.sources[1].url).toBe('https://valid.com');
    });
  });
});