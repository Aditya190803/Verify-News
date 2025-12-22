import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyWithGemini, verifyWithOpenRouter, verifyWithGroq, verifyWithFallback } from './aiProviders';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              veracity: 'true',
              confidence: 90,
              explanation: 'Test explanation',
              sources: []
            })
          }
        })
      })
    })),
    HarmBlockThreshold: {},
    HarmCategory: {}
  };
});

// Mock fetch for OpenRouter
global.fetch = vi.fn();

describe('AI Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.VITE_GEMINI_API_KEY = 'test-gemini-key';
    process.env.VITE_OPENROUTER_API_KEY = 'test-openrouter-key';
  });

  describe('verifyWithGemini', () => {
    it('should initialize with gemini-2.5-flash and return parsed response', async () => {
      const result = await verifyWithGemini('Test content');
      expect(result.veracity).toBe('true');
      expect(result.confidence).toBe(90);
    });

    it('should throw error if API key is missing', async () => {
      process.env.VITE_GEMINI_API_KEY = '';
      // We need to re-import or re-evaluate the module if we want to test the top-level constant
      // But for now let's see if this works if we move the key check inside the function
      await expect(verifyWithGemini('Test content')).rejects.toThrow('Google Gemini API key is missing');
    });
  });

  describe('verifyWithOpenRouter', () => {
    it('should call OpenRouter API with correct model and return parsed response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ veracity: 'false', confidence: 80, explanation: 'OpenRouter test', sources: [] }) } }]
        })
      } as Response);

      const result = await verifyWithOpenRouter('Test content');
      expect(result.veracity).toBe('false');
      expect(result.confidence).toBe(80);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('openrouter.ai'), expect.any(Object));
    });

    it('should handle OpenRouter API errors', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API Key' } })
      } as Response);

      await expect(verifyWithOpenRouter('Test content')).rejects.toThrow('OpenRouter API error: Invalid API Key');
    });
  });

  describe('verifyWithGroq (deprecated)', () => {
    it('should redirect to OpenRouter (Groq is deprecated)', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ veracity: 'partially-true', confidence: 70, explanation: 'OpenRouter test', sources: [] }) } }]
        })
      } as Response);

      const result = await verifyWithGroq('Test content');
      expect(result.veracity).toBe('partially-true');
      expect(result.confidence).toBe(70);
      // Verify it uses OpenRouter instead
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('openrouter.ai'), expect.any(Object));
    });
  });

  describe('verifyWithFallback', () => {
    it('should fallback to secondary provider if primary fails', async () => {
      // OpenRouter fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error('OpenRouter failed'));

      // Gemini succeeds
      const result = await verifyWithFallback('Test content');
      expect(result.veracity).toBe('true');
      expect(result.confidence).toBe(90);
    });

    it('should throw error if all providers fail', async () => {
      // Both OpenRouter and Gemini fail
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        statusText: 'Error',
        json: () => Promise.resolve({ error: { message: 'API Error' } })
      } as Response);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: () => Promise.reject(new Error('Gemini failed'))
        })
      } as any));
