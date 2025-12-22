import { API_ENDPOINTS, STORAGE_KEYS, ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/logger';

const STACK_API_BASE_URL = API_ENDPOINTS.STACK_AUTH;

// Get Stack Auth configuration from environment
const getConfig = () => {
  const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
  const publishableKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
  
  if (!projectId || !publishableKey) {
    logger.warn('Stack Auth is not configured. Set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY');
    return null;
  }
  
  return { projectId, publishableKey };
};

// Storage keys for tokens
const ACCESS_TOKEN_KEY = STORAGE_KEYS.ACCESS_TOKEN;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;

/**
 * Get stored tokens from localStorage
 */
export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
};

/**
 * Store tokens in localStorage
 */
export const storeTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Clear stored tokens
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Get common headers for Stack Auth API requests
 */
const getHeaders = (accessToken?: string | null): Record<string, string> => {
  const config = getConfig();
  if (!config) {
    throw new Error(ERROR_MESSAGES.AUTH_NOT_CONFIGURED);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Stack-Access-Type': 'client',
    'X-Stack-Project-Id': config.projectId,
    'X-Stack-Publishable-Client-Key': config.publishableKey,
  };
  
  if (accessToken) {
    headers['X-Stack-Access-Token'] = accessToken;
  }
  
  return headers;
};

/**
 * User type from Stack Auth API
 */
export interface StackUser {
  id: string;
  primary_email: string | null;
  primary_email_verified: boolean;
  display_name: string | null;
  profile_image_url: string | null;
  signed_up_at_millis: number;
  is_anonymous: boolean;
  client_metadata?: Record<string, unknown>;
  client_read_only_metadata?: Record<string, unknown>;
}

/**
 * Authentication response containing tokens
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

/**
 * Sign up with email and password
 * 
 * POST /auth/password/sign-up
 */
export const signUp = async (
  email: string, 
  password: string,
  verificationCallbackUrl?: string
): Promise<AuthResponse> => {
  const config = getConfig();
  if (!config) {
    throw new Error(ERROR_MESSAGES.AUTH_NOT_CONFIGURED);
  }
  
  const response = await fetch(`${STACK_API_BASE_URL}/auth/password/sign-up`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      password,
      verification_callback_url: verificationCallbackUrl || `${window.location.origin}/verify-email`,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Sign up failed' }));
    throw new Error(error.message || error.error || 'Sign up failed');
  }
  
  const data: AuthResponse = await response.json();
  storeTokens(data.access_token, data.refresh_token);
  return data;
};

/**
 * Sign in with email and password
 * 
 * POST /auth/password/sign-in
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const config = getConfig();
  if (!config) {
    throw new Error(ERROR_MESSAGES.AUTH_NOT_CONFIGURED);
  }
  
  const response = await fetch(`${STACK_API_BASE_URL}/auth/password/sign-in`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      password,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Sign in failed' }));
    throw new Error(error.message || error.error || 'Invalid email or password');
  }
  
  const data: AuthResponse = await response.json();
  storeTokens(data.access_token, data.refresh_token);
  return data;
};

/**
 * Sign out of the current session
 * 
 * DELETE /auth/sessions/current
 */
export const signOut = async (): Promise<void> => {
  const { accessToken } = getStoredTokens();
  
  if (accessToken) {
    try {
      await fetch(`${STACK_API_BASE_URL}/auth/sessions/current`, {
        method: 'DELETE',
        headers: getHeaders(accessToken),
      });
    } catch (error) {
      // Ignore errors on sign out - we'll clear tokens anyway
      logger.warn('Error signing out:', error);
    }
  }
  
  clearTokens();
};

/**
 * Get the current user
 * 
 * GET /users/me
 */
export const getCurrentUser = async (): Promise<StackUser | null> => {
  const { accessToken } = getStoredTokens();
  
  if (!accessToken) {
    return null;
  }
  
  const config = getConfig();
  if (!config) {
    return null;
  }
  
  try {
    const response = await fetch(`${STACK_API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: getHeaders(accessToken),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - try to refresh
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return getCurrentUser(); // Retry with new token
        }
        clearTokens();
        return null;
      }
      throw new Error('Failed to get current user');
    }
    
    return await response.json();
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Refresh the access token using the refresh token
 * 
 * POST /auth/oauth/token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  const { refreshToken } = getStoredTokens();
  
  if (!refreshToken) {
    return false;
  }
  
  const config = getConfig();
  if (!config) {
    return false;
  }
  
  try {
    const response = await fetch(`${STACK_API_BASE_URL}/auth/oauth/token`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    
    if (!response.ok) {
      clearTokens();
      return false;
    }
    
    const data = await response.json();
    if (data.access_token) {
      storeTokens(data.access_token, data.refresh_token || refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error refreshing token:', error);
    clearTokens();
    return false;
  }
};

/**
 * Initiate OAuth sign-in with a provider (e.g., Google)
 * 
 * NOTE: OAuth via REST API requires server-side handling with client_secret.
 * For client-side only apps, use Stack Auth's hosted sign-in page or
 * implement a backend proxy.
 * 
 * Currently disabled - use email/password authentication instead.
 */
export const initiateOAuthSignIn = (_provider: 'google' | 'github' | 'facebook'): void => {
  // OAuth requires client_secret which cannot be exposed in client-side code
  // For now, throw an error directing users to use email/password
  throw new Error('OAuth sign-in is not available. Please use email and password to sign in.');
};

/**
 * Handle OAuth callback - exchange code for tokens
 * 
 * NOTE: OAuth is currently disabled for client-side only apps.
 */
export const handleOAuthCallback = async (_code: string): Promise<AuthResponse> => {
  throw new Error('OAuth is not available. Please use email and password to sign in.');
};

/**
 * Update current user profile
 * 
 * PATCH /users/me
 */
export const updateCurrentUser = async (updates: {
  display_name?: string;
  profile_image_url?: string;
  client_metadata?: Record<string, unknown>;
}): Promise<StackUser> => {
  const { accessToken } = getStoredTokens();
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${STACK_API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(error.message || error.error || 'Failed to update user');
  }
  
  return await response.json();
};

/**
 * Check if Stack Auth is configured
 */
export const isStackAuthConfigured = (): boolean => {
  return getConfig() !== null;
};

/**
 * Send password reset code
 * 
 * POST /auth/password/send-reset-code
 */
export const sendPasswordResetCode = async (email: string, callbackUrl?: string): Promise<void> => {
  const config = getConfig();
  if (!config) {
    throw new Error(ERROR_MESSAGES.AUTH_NOT_CONFIGURED);
  }
  
  const response = await fetch(`${STACK_API_BASE_URL}/auth/password/send-reset-code`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      callback_url: callbackUrl || `${window.location.origin}/reset-password`,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to send reset code' }));
    throw new Error(error.message || error.error || 'Failed to send password reset email');
  }
};

/**
 * Reset password with a code
 * 
 * POST /auth/password/reset
 */
export const resetPasswordWithCode = async (code: string, newPassword: string): Promise<void> => {
  const config = getConfig();
  if (!config) {
    throw new Error(ERROR_MESSAGES.AUTH_NOT_CONFIGURED);
  }
  
  const response = await fetch(`${STACK_API_BASE_URL}/auth/password/reset`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      code,
      password: newPassword,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to reset password' }));
    throw new Error(error.message || error.error || 'Failed to reset password. The link may have expired.');
  }
};
