import { describe, it, expect, vi } from 'vitest';

// Mock the Google Generative AI before importing geminiApi
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
  }));
  
  class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel = mockGetGenerativeModel;
  }
  
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    HarmBlockThreshold: {
      BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    },
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
  };
});

import { 
  fileToBase64, 
  getMediaTypeFromMime,
  getMockVerificationResult 
} from './geminiApi';

describe('geminiApi utilities', () => {
  describe('fileToBase64', () => {
    it('converts a file to base64 string', async () => {
      const mockFileContent = 'test file content';
      const file = new File([mockFileContent], 'test.txt', { type: 'text/plain' });

      const result = await fileToBase64(file);
      
      // The result should be a base64 string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      
      const result = await fileToBase64(file);
      
      expect(typeof result).toBe('string');
    });
  });

  describe('getMediaTypeFromMime', () => {
    it('returns "image" for image MIME types', () => {
      expect(getMediaTypeFromMime('image/jpeg')).toBe('image');
      expect(getMediaTypeFromMime('image/png')).toBe('image');
      expect(getMediaTypeFromMime('image/gif')).toBe('image');
      expect(getMediaTypeFromMime('image/webp')).toBe('image');
    });

    it('returns "audio" for audio MIME types', () => {
      expect(getMediaTypeFromMime('audio/mp3')).toBe('audio');
      expect(getMediaTypeFromMime('audio/wav')).toBe('audio');
      expect(getMediaTypeFromMime('audio/mpeg')).toBe('audio');
      expect(getMediaTypeFromMime('audio/ogg')).toBe('audio');
    });

    it('returns "video" for video MIME types', () => {
      expect(getMediaTypeFromMime('video/mp4')).toBe('video');
      expect(getMediaTypeFromMime('video/webm')).toBe('video');
      expect(getMediaTypeFromMime('video/avi')).toBe('video');
    });

    it('returns "text" for unknown MIME types', () => {
      expect(getMediaTypeFromMime('application/json')).toBe('text');
      expect(getMediaTypeFromMime('text/plain')).toBe('text');
      expect(getMediaTypeFromMime('unknown/type')).toBe('text');
    });
  });

  describe('getMockVerificationResult', () => {
    it('returns a valid mock result structure', () => {
      const result = getMockVerificationResult();

      expect(result).toHaveProperty('veracity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('sources');
      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('includes article URL as source when provided', () => {
      const articleUrl = 'https://example.com/article';
      const result = getMockVerificationResult(articleUrl);

      expect(result.sources.some(source => source.url === articleUrl)).toBe(true);
    });

    it('returns confidence between 70 and 100', () => {
      // Run multiple times to check randomness bounds
      for (let i = 0; i < 20; i++) {
        const result = getMockVerificationResult();
        expect(result.confidence).toBeGreaterThanOrEqual(70);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('returns valid veracity value', () => {
      for (let i = 0; i < 20; i++) {
        const result = getMockVerificationResult();
        expect(['true', 'false']).toContain(result.veracity);
      }
    });

    it('always includes default sources', () => {
      const result = getMockVerificationResult();
      
      const hasReuters = result.sources.some(s => s.name.includes('Reuters'));
      const hasAP = result.sources.some(s => s.name.includes('Associated Press'));
      
      expect(hasReuters || hasAP).toBe(true);
    });
  });
});
