/**
 * @fileoverview Error handling utilities for the news verification application.
 * Provides functions for categorizing errors, generating user-friendly messages,
 * and implementing retry logic with exponential backoff.
 * @module utils/errorHandling
 */

import { RATE_LIMITS } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * Checks if an error is caused by network connectivity issues.
 * This includes ad blockers, firewalls, CORS issues, and general network failures.
 * 
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is network-related
 * 
 * @example
 * ```ts
 * try {
 *   await fetchData();
 * } catch (error) {
 *   if (isNetworkError(error)) {
 *     showOfflineMessage();
 *   }
 * }
 * ```
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
  
  return (
    errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
    errorMessage.includes('ERR_NETWORK') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('firestore.googleapis.com') ||
    errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
    errorMessage.includes('Network Error') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('CORS')
  );
};

/**
 * Checks if an error is caused by API rate limiting or quota issues.
 * 
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is quota/rate-limit related
 * 
 * @example
 * ```ts
 * if (isQuotaError(error)) {
 *   showRateLimitMessage();
 *   scheduleRetry();
 * }
 * ```
 */
export const isQuotaError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
  
  return (
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests')
  );
};

/**
 * Checks if an error is caused by API authentication issues.
 * 
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is auth-related
 * 
 * @example
 * ```ts
 * if (isAuthError(error)) {
 *   redirectToLogin();
 * }
 * ```
 */
export const isAuthError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
  
  return (
    errorMessage.includes('API key') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('authentication')
  );
};

/**
 * Generates a user-friendly error message based on the error type.
 * 
 * @param {unknown} error - The error to generate a message for
 * @returns {string} A human-readable error message
 * 
 * @example
 * ```ts
 * catch (error) {
 *   toast.error(getUserFriendlyErrorMessage(error));
 * }
 * ```
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (isNetworkError(error)) {
    return 'Network connectivity issue detected. This may be caused by ad blockers or firewall settings. The verification will continue without cloud synchronization.';
  }
  
  if (isQuotaError(error)) {
    return 'Service quota exceeded. Please try again in a few minutes.';
  }
  
  if (isAuthError(error)) {
    return 'API authentication error. Please check your configuration.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Handles Appwrite errors gracefully without breaking the verification flow.
 * Logs the error appropriately based on type but does not throw.
 * 
 * @param {unknown} error - The error that occurred
 * @param {string} operation - Description of the operation that failed
 * 
 * @example
 * ```ts
 * try {
 *   await saveToAppwrite(data);
 * } catch (error) {
 *   handleAppwriteError(error, 'save verification');
 *   // Continue without throwing
 * }
 * ```
 */
export const handleAppwriteError = (error: unknown, operation: string): void => {
  logger.warn(`Appwrite ${operation} failed:`, error);
  
  if (isNetworkError(error)) {
    logger.warn('Appwrite blocked by ad blocker or network filter');
  } else {
    logger.error(`Appwrite ${operation} error:`, error);
  }
  
  // Don't throw - allow verification to continue
};

/** @deprecated Use handleAppwriteError instead */
export const handleFirebaseError = handleAppwriteError;

/**
 * Handles Gemini API errors and returns a user-friendly message.
 * 
 * @param {unknown} error - The error from Gemini API
 * @returns {string} A concise error description for display
 * 
 * @example
 * ```ts
 * catch (error) {
 *   const message = handleGeminiError(error);
 *   setErrorMessage(`Verification failed: ${message}`);
 * }
 * ```
 */
/**
 * Handles errors from AI providers (Gemini, OpenRouter).
 * 
 * @param {unknown} error - The error to handle
 * @returns {string} A user-friendly error message
 */
export const handleAIError = (error: unknown): string => {
  if (isNetworkError(error)) {
    return 'Network connectivity issue - verification service temporarily unavailable';
  }
  
  if (isQuotaError(error)) {
    return 'Service quota exceeded';
  }
  
  if (isAuthError(error)) {
    return 'API configuration issue';
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('JSON')) {
    return 'Response parsing error';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Service timeout';
  }
  
  if (errorMessage.includes('safety')) {
    return 'Content blocked by safety filters';
  }

  if (errorMessage.includes('All AI providers failed')) {
    return 'All verification services are currently unavailable';
  }
  
  return 'Verification service temporarily unavailable';
};

export const handleGeminiError = handleAIError;

/**
 * Retries an async operation with exponential backoff.
 * Will not retry on auth or quota errors.
 * 
 * @template T - The return type of the function
 * @param {() => Promise<T>} fn - The async function to retry
 * @param {number} [maxRetries=RATE_LIMITS.MAX_RETRIES] - Maximum number of retry attempts
 * @param {number} [baseDelay=RATE_LIMITS.RETRY_DELAY_MS] - Initial delay in milliseconds
 * @returns {Promise<T>} The result of the successful function call
 * @throws {Error} The last error if all retries fail
 * 
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => fetchVerification(id),
 *   3,
 *   1000
 * );
 * ```
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = RATE_LIMITS.MAX_RETRIES,
  baseDelay: number = RATE_LIMITS.RETRY_DELAY_MS
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (isAuthError(error) || isQuotaError(error)) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      logger.info(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
