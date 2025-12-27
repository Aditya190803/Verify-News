/**
 * Auth types for the application
 * 
 * Centralized type definitions for authentication-related data structures.
 * These types are shared between Stack Auth and the application's auth context.
 */

/**
 * Stack Auth user representation from REST API (snake_case)
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
 * Stack Auth SDK user representation (camelCase)
 * This is the format returned by stackClientApp.getUser()
 */
export interface StackSDKUser {
  id: string;
  primaryEmail?: string | null;
  primaryEmailVerified?: boolean;
  displayName?: string | null;
  profileImageUrl?: string | null;
  signedUpAtMillis?: number;
  isAnonymous?: boolean;
  clientMetadata?: Record<string, unknown>;
  clientReadOnlyMetadata?: Record<string, unknown>;
}

/**
 * Convert SDK user format to API user format
 */
export function convertSDKUserToStackUser(sdkUser: StackSDKUser): StackUser {
  return {
    id: sdkUser.id,
    primary_email: sdkUser.primaryEmail ?? null,
    primary_email_verified: sdkUser.primaryEmailVerified ?? false,
    display_name: sdkUser.displayName ?? null,
    profile_image_url: sdkUser.profileImageUrl ?? null,
    signed_up_at_millis: sdkUser.signedUpAtMillis ?? Date.now(),
    is_anonymous: sdkUser.isAnonymous ?? false,
    client_metadata: sdkUser.clientMetadata,
    client_read_only_metadata: sdkUser.clientReadOnlyMetadata,
  };
}

/**
 * Application user format (normalized for internal use)
 */
export interface AppUser {
  id: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  uid: string; // alias for id for backwards compatibility
}

/**
 * Authentication response containing tokens from Stack Auth
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

/**
 * Stored token pair for localStorage
 */
export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * User profile update request
 */
export interface UserProfileUpdate {
  display_name?: string;
  profile_image_url?: string;
  client_metadata?: Record<string, unknown>;
}

/**
 * Auth context interface used by the application
 */
export interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  signup: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google') => Promise<AppUser>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * OAuth provider types supported
 */
export type OAuthProvider = 'google' | 'github' | 'facebook';

/**
 * Auth error with additional context
 */
export interface AuthError {
  message: string;
  code?: string | number;
  type?: 'validation' | 'network' | 'auth' | 'unknown';
}
