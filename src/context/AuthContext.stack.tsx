import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signUp as stackSignUp,
  signIn as stackSignIn,
  signOut as stackSignOut,
  getCurrentUser as stackGetCurrentUser,
  isStackAuthConfigured as restApiConfigured,
  sendPasswordResetCode,
  StackUser,
} from '../services/stackAuthApi';
import { stackClientApp, isStackAuthConfigured as sdkConfigured } from '../config/stackAuth';

// Type definitions for compatibility with the existing app structure
interface AppUser {
  id: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  uid: string; // alias for id for backwards compatibility
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  signup: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google') => Promise<AppUser>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Check if Stack Auth is configured (either via SDK or REST API)
const isStackAuthConfigured = (): boolean => {
  return sdkConfigured() || restApiConfigured();
};

// Convert Stack Auth user to our AppUser format for backwards compatibility
const convertToAppUser = (user: StackUser | null): AppUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    uid: user.id, // alias for backwards compatibility
    displayName: user.display_name || null,
    email: user.primary_email || null,
    emailVerified: user.primary_email_verified,
    photoURL: user.profile_image_url || null,
  };
};

// Convert SDK user type to our AppUser format
const convertSdkUserToAppUser = (user: unknown): AppUser | null => {
  if (!user) return null;
  const u = user as {
    id?: string;
    displayName?: string | null;
    primaryEmail?: string | null;
    primaryEmailVerified?: boolean;
    profileImageUrl?: string | null;
  };
  return {
    id: u.id || '',
    uid: u.id || '',
    displayName: u.displayName || null,
    email: u.primaryEmail || null,
    emailVerified: u.primaryEmailVerified || false,
    photoURL: u.profileImageUrl || null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user state from the SDK/API
  const refreshUser = useCallback(async () => {
    if (!isStackAuthConfigured()) {
      return;
    }

    try {
      // First try to get user from SDK (for OAuth sessions)
      if (stackClientApp) {
        const sdkUser = await stackClientApp.getUser();
        if (sdkUser) {
          setCurrentUser(convertSdkUserToAppUser(sdkUser));
          return;
        }
      }

      // Fall back to REST API (for email/password sessions)
      const user = await stackGetCurrentUser();
      setCurrentUser(convertToAppUser(user));
    } catch (error: unknown) {
      // User is not logged in - this is expected
      const err = error as { code?: number };
      if (err?.code !== 401) {
        console.error('Error checking auth state:', error);
      }
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    // Check current auth state on mount
    const checkAuth = async () => {
      if (!isStackAuthConfigured()) {
        console.warn('Stack Auth is not configured - auth disabled');
        setLoading(false);
        return;
      }

      await refreshUser();
      setLoading(false);
    };

    checkAuth();

    // Listen for auth state changes (e.g., from OAuth callback)
    const handleStorageChange = (e: StorageEvent) => {
      // Stack Auth stores tokens in cookies, but we can detect changes
      if (e.key?.includes('stack') || e.key === null) {
        refreshUser();
      }
    };

    // Listen for custom events from OAuth callback
    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('stackAuthStateChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stackAuthStateChange', handleAuthChange);
    };
  }, [refreshUser]);

  // Sign up with email and password
  const signup = async (email: string, password: string): Promise<AppUser> => {
    if (!isStackAuthConfigured()) {
      throw new Error('Authentication is not configured');
    }
    
    // Create user account and get tokens
    await stackSignUp(email, password);
    
    // Get the full user object
    const user = await stackGetCurrentUser();
    const appUser = convertToAppUser(user);
    
    if (!appUser) {
      throw new Error('Failed to get user after signup');
    }
    
    setCurrentUser(appUser);
    return appUser;
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<AppUser> => {
    if (!isStackAuthConfigured()) {
      throw new Error('Authentication is not configured');
    }
    
    await stackSignIn(email, password);
    
    const user = await stackGetCurrentUser();
    const appUser = convertToAppUser(user);
    
    if (!appUser) {
      throw new Error('Failed to get user after login');
    }
    
    setCurrentUser(appUser);
    return appUser;
  };

  // Logout
  const logout = async (): Promise<void> => {
    if (!isStackAuthConfigured()) {
      throw new Error('Authentication is not configured');
    }
    
    try {
      // Try to sign out from both SDK and REST API
      if (stackClientApp) {
        try {
          await stackClientApp.signOut();
        } catch (e) {
          console.warn('SDK signOut error:', e);
        }
      }
      await stackSignOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setCurrentUser(null);
  };

  // Social login (Google) - uses the @stackframe/js SDK
  const socialLogin = async (providerName: 'google'): Promise<AppUser> => {
    if (!stackClientApp) {
      throw new Error('Stack Auth SDK is not configured');
    }
    
    if (providerName !== 'google') {
      throw new Error(`Unsupported provider: ${providerName}`);
    }
    
    // This will redirect the user to Google's OAuth page
    // After redirect back to /oauth/callback, the OAuthCallback page handles the token exchange
    await stackClientApp.signInWithOAuth('google');
    
    // This code won't execute immediately since we're redirecting
    // Return a pending promise that will never resolve
    // (the page will redirect before this matters)
    return new Promise(() => {});
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    if (!isStackAuthConfigured()) {
      throw new Error('Authentication is not configured');
    }
    
    await sendPasswordResetCode(email);
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    socialLogin,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
