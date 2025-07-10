/**
 * Utility functions for handling various types of errors in the news verification app
 */

/**
 * Check if an error is caused by network connectivity issues (ad blockers, firewall, etc.)
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
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
 * Check if an error is caused by API rate limiting or quota issues
 */
export const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  return (
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests')
  );
};

/**
 * Check if an error is caused by API authentication issues
 */
export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  return (
    errorMessage.includes('API key') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('authentication')
  );
};

/**
 * Get user-friendly error message based on error type
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
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
 * Handle Firebase errors gracefully without breaking the verification flow
 */
export const handleFirebaseError = (error: any, operation: string): void => {
  console.warn(`📱 Firebase ${operation} failed:`, error);
  
  if (isNetworkError(error)) {
    console.warn('🚫 Firebase blocked by ad blocker or network filter');
  } else {
    console.error(`🔥 Firebase ${operation} error:`, error);
  }
  
  // Don't throw - allow verification to continue
};

/**
 * Handle Gemini API errors with specific messaging
 */
export const handleGeminiError = (error: any): string => {
  if (isNetworkError(error)) {
    return 'Network connectivity issue - verification service temporarily unavailable';
  }
  
  if (isQuotaError(error)) {
    return 'Service quota exceeded';
  }
  
  if (isAuthError(error)) {
    return 'API configuration issue';
  }
  
  if (error.message?.includes('JSON')) {
    return 'Response parsing error';
  }
  
  if (error.message?.includes('timeout')) {
    return 'Service timeout';
  }
  
  if (error.message?.includes('safety')) {
    return 'Content blocked by safety filters';
  }
  
  return 'Verification service temporarily unavailable';
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
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
      console.log(`🔄 Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
