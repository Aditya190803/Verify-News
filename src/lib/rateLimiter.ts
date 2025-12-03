/**
 * Rate limiting utilities for client-side API call management
 * Prevents excessive API calls and provides user-friendly feedback
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional: Custom message when rate limited */
  message?: string;
}

interface RateLimitState {
  /** Timestamps of requests in the current window */
  requests: number[];
  /** Whether currently rate limited */
  isLimited: boolean;
  /** Timestamp when rate limit resets */
  resetTime: number | null;
}

/**
 * Create a rate limiter for a specific operation
 * @param config - Rate limit configuration
 * @returns Rate limiter object with check and execute methods
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, message } = config;
  
  const state: RateLimitState = {
    requests: [],
    isLimited: false,
    resetTime: null,
  };

  /**
   * Clean up expired requests from the tracking array
   */
  function cleanupExpired(): void {
    const now = Date.now();
    state.requests = state.requests.filter((timestamp) => now - timestamp < windowMs);
    
    if (state.isLimited && (state.resetTime === null || now >= state.resetTime)) {
      state.isLimited = false;
      state.resetTime = null;
    }
  }

  /**
   * Check if the operation can be executed without triggering rate limit
   * @returns Object with allowed status and optional wait time
   */
  function canExecute(): { allowed: boolean; waitMs?: number; message?: string } {
    cleanupExpired();
    
    if (state.requests.length >= maxRequests) {
      const oldestRequest = Math.min(...state.requests);
      const waitMs = oldestRequest + windowMs - Date.now();
      
      state.isLimited = true;
      state.resetTime = oldestRequest + windowMs;
      
      return {
        allowed: false,
        waitMs: Math.max(0, waitMs),
        message: message || `Rate limited. Please wait ${Math.ceil(waitMs / 1000)} seconds.`,
      };
    }
    
    return { allowed: true };
  }

  /**
   * Record a request execution
   */
  function recordRequest(): void {
    state.requests.push(Date.now());
  }

  /**
   * Execute a function with rate limiting
   * @param fn - Function to execute
   * @returns Result of the function or throws if rate limited
   */
  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    const check = canExecute();
    
    if (!check.allowed) {
      throw new RateLimitError(check.message || 'Rate limited', check.waitMs || 0);
    }
    
    recordRequest();
    return fn();
  }

  /**
   * Get current rate limit status
   */
  function getStatus(): { remaining: number; resetIn: number | null; isLimited: boolean } {
    cleanupExpired();
    
    return {
      remaining: Math.max(0, maxRequests - state.requests.length),
      resetIn: state.resetTime ? Math.max(0, state.resetTime - Date.now()) : null,
      isLimited: state.isLimited,
    };
  }

  /**
   * Reset the rate limiter
   */
  function reset(): void {
    state.requests = [];
    state.isLimited = false;
    state.resetTime = null;
  }

  return {
    canExecute,
    recordRequest,
    execute,
    getStatus,
    reset,
  };
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends Error {
  public readonly waitMs: number;
  public readonly isRateLimitError = true;

  constructor(message: string, waitMs: number) {
    super(message);
    this.name = 'RateLimitError';
    this.waitMs = waitMs;
  }
}

/**
 * Check if an error is a RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError || 
    (typeof error === 'object' && error !== null && 'isRateLimitError' in error);
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

/**
 * Rate limiter for verification API calls
 * Allows 10 verifications per minute
 */
export const verificationRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'You are verifying too quickly. Please wait a moment before trying again.',
});

/**
 * Rate limiter for search API calls
 * Allows 30 searches per minute
 */
export const searchRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many searches. Please wait a moment before searching again.',
});

/**
 * Rate limiter for authentication attempts
 * Allows 5 attempts per 5 minutes
 */
export const authRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
  message: 'Too many login attempts. Please wait 5 minutes before trying again.',
});

// ============================================
// Retry with Exponential Backoff
// ============================================

interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor (0-1) to add randomness */
  jitterFactor?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
}

/**
 * Execute a function with exponential backoff retry logic
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitterFactor = 0.1,
    isRetryable = () => true,
    onRetry,
  } = config;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry rate limit errors
      if (isRateLimitError(error)) {
        throw error;
      }

      // Check if error is retryable
      if (!isRetryable(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate next delay with jitter
      const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delay + jitter, maxDelayMs);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error, actualDelay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, actualDelay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Default retry configuration for network requests
 */
export const defaultNetworkRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  isRetryable: (error: unknown) => {
    // Retry on network errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('enotfound')
      );
    }
    return false;
  },
};
