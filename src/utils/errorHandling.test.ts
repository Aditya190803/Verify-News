import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNetworkError,
  isQuotaError,
  isAuthError,
  getUserFriendlyErrorMessage,
  handleAppwriteError,
  handleGeminiError,
  retryWithBackoff,
} from './errorHandling';

describe('errorHandling utilities', () => {
  describe('isNetworkError', () => {
    it('returns false for null/undefined errors', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });

    it('detects ERR_BLOCKED_BY_CLIENT', () => {
      expect(isNetworkError(new Error('ERR_BLOCKED_BY_CLIENT'))).toBe(true);
    });

    it('detects Failed to fetch', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    });

    it('detects firestore.googleapis.com errors', () => {
      expect(isNetworkError(new Error('firestore.googleapis.com'))).toBe(true);
    });

    it('detects CORS errors', () => {
      expect(isNetworkError(new Error('CORS policy blocked'))).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Something else'))).toBe(false);
    });
  });

  describe('isQuotaError', () => {
    it('returns false for null/undefined errors', () => {
      expect(isQuotaError(null)).toBe(false);
      expect(isQuotaError(undefined)).toBe(false);
    });

    it('detects quota errors', () => {
      expect(isQuotaError(new Error('quota exceeded'))).toBe(true);
    });

    it('detects rate limit errors', () => {
      expect(isQuotaError(new Error('rate limit reached'))).toBe(true);
    });

    it('detects 429 status errors', () => {
      expect(isQuotaError(new Error('status 429'))).toBe(true);
    });

    it('detects too many requests errors', () => {
      expect(isQuotaError(new Error('too many requests'))).toBe(true);
    });

    it('returns false for non-quota errors', () => {
      expect(isQuotaError(new Error('Something else'))).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('returns false for null/undefined errors', () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
    });

    it('detects API key errors', () => {
      expect(isAuthError(new Error('Invalid API key'))).toBe(true);
    });

    it('detects 401 errors', () => {
      expect(isAuthError(new Error('401 Unauthorized'))).toBe(true);
    });

    it('detects 403 errors', () => {
      expect(isAuthError(new Error('403 Forbidden'))).toBe(true);
    });

    it('detects authentication errors', () => {
      expect(isAuthError(new Error('authentication failed'))).toBe(true);
    });

    it('returns false for non-auth errors', () => {
      expect(isAuthError(new Error('Something else'))).toBe(false);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('returns network message for network errors', () => {
      const message = getUserFriendlyErrorMessage(new Error('ERR_BLOCKED_BY_CLIENT'));
      expect(message).toContain('Network connectivity');
    });

    it('returns quota message for quota errors', () => {
      const message = getUserFriendlyErrorMessage(new Error('rate limit'));
      expect(message).toContain('quota exceeded');
    });

    it('returns auth message for auth errors', () => {
      const message = getUserFriendlyErrorMessage(new Error('API key'));
      expect(message).toContain('authentication');
    });

    it('returns generic message for unknown errors', () => {
      const message = getUserFriendlyErrorMessage(new Error('Unknown'));
      expect(message).toContain('unexpected error');
    });
  });

  describe('handleAppwriteError', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('logs warning for network errors', () => {
      handleAppwriteError(new Error('ERR_BLOCKED_BY_CLIENT'), 'save');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('logs error for other errors', () => {
      handleAppwriteError(new Error('Unknown error'), 'save');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('handleGeminiError', () => {
    it('returns network message for network errors', () => {
      expect(handleGeminiError(new Error('Failed to fetch'))).toContain('Network');
    });

    it('returns quota message for quota errors', () => {
      expect(handleGeminiError(new Error('quota'))).toContain('quota');
    });

    it('returns config message for auth errors', () => {
      expect(handleGeminiError(new Error('API key'))).toContain('configuration');
    });

    it('returns parsing message for JSON errors', () => {
      expect(handleGeminiError(new Error('Invalid JSON'))).toContain('parsing');
    });

    it('returns timeout message for timeout errors', () => {
      expect(handleGeminiError(new Error('timeout'))).toContain('timeout');
    });

    it('returns safety message for safety errors', () => {
      expect(handleGeminiError(new Error('safety filter'))).toContain('safety');
    });

    it('returns generic message for unknown errors', () => {
      expect(handleGeminiError(new Error('Unknown'))).toContain('unavailable');
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const promise = retryWithBackoff(fn);
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const promise = retryWithBackoff(fn, 3, 100);
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry auth errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('API key invalid'));
      
      await expect(retryWithBackoff(fn, 3, 100)).rejects.toThrow('API key');
      await vi.runAllTimersAsync();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not retry quota errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('rate limit'));
      
      await expect(retryWithBackoff(fn, 3, 100)).rejects.toThrow('rate limit');
      await vi.runAllTimersAsync();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network error'));
      
      // Attach the catch handler immediately to prevent unhandled rejection
      const promise = retryWithBackoff(fn, 3, 100).catch((e: Error) => e);
      
      // Run all timers to complete retries
      await vi.runAllTimersAsync();
      
      const error = await promise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('network error');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
