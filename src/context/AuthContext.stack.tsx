/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { stackClientApp, isStackAuthConfigured } from '../config/stackAuth';
import { logger } from '@/lib/logger';
import { signOut as apiSignOut } from '../services/stackAuthApi';
import { syncUserToAppwrite } from '@/services/appwrite/userService';
import type { AppUser, AuthContextType, StackSDKUser } from '@/types/auth';
import { convertSDKUserToStackUser } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Convert SDK user type to our AppUser format
const convertToAppUser = (user: StackSDKUser | null): AppUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    uid: user.id,
    displayName: user.displayName || null,
    email: user.primaryEmail || null,
    emailVerified: user.primaryEmailVerified || false,
    photoURL: user.profileImageUrl || null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user state from the SDK and sync with Appwrite
  const refreshUser = useCallback(async () => {
    if (!isStackAuthConfigured() || !stackClientApp) {
      return;
    }

    try {
      const sdkUser = await stackClientApp.getUser() as StackSDKUser | null;
      const appUser = convertToAppUser(sdkUser);
      setCurrentUser(appUser);
      
      // Sync user to Appwrite in the background (don't block UI)
      if (appUser && sdkUser) {
        const stackUser = convertSDKUserToStackUser(sdkUser);
        syncUserToAppwrite(stackUser).catch(error => {
          logger.error('Failed to sync user to Appwrite:', error);
        });
      }
    } catch (error: unknown) {
      // User is not logged in - this is expected
      const err = error as { code?: number };
      if (err?.code !== 401) {
        logger.error('Error checking auth state:', error);
      }
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    // Check current auth state on mount
    const checkAuth = async () => {
      if (!isStackAuthConfigured()) {
        logger.warn('Stack Auth is not configured - auth disabled');
        setLoading(false);
        return;
      }

      await refreshUser();
      setLoading(false);
    };

    checkAuth();

    // Listen for custom events from OAuth callback or other parts of the app
    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener('stackAuthStateChange', handleAuthChange);

    return () => {
      window.removeEventListener('stackAuthStateChange', handleAuthChange);
    };
  }, [refreshUser]);

  // Sign up with email and password
  const signup = async (email: string, password: string): Promise<AppUser> => {
    if (!stackClientApp) {
      throw new Error('Authentication is not configured');
    }
    
    const result = await stackClientApp.signUpWithCredential({ email, password });
    
    if (result.status === 'error') {
      throw new Error(result.error.message);
    }
    
    const user = await stackClientApp.getUser() as StackSDKUser | null;
    const appUser = convertToAppUser(user);
    
    if (!appUser || !user) {
      throw new Error('Failed to get user after signup');
    }
    
    // Sync user to Appwrite
    const stackUser = convertSDKUserToStackUser(user);
    await syncUserToAppwrite(stackUser).catch(error => {
      logger.error('Failed to sync user to Appwrite after signup:', error);
    });
    
    setCurrentUser(appUser);
    return appUser;
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<AppUser> => {
    if (!stackClientApp) {
      throw new Error('Authentication is not configured');
    }
    
    const result = await stackClientApp.signInWithCredential({ email, password });
    
    if (result.status === 'error') {
      throw new Error(result.error.message);
    }
    
    const user = await stackClientApp.getUser() as StackSDKUser | null;
    const appUser = convertToAppUser(user);
    
    if (!appUser || !user) {
      throw new Error('Failed to get user after login');
    }
    
    // Sync user to Appwrite
    const stackUser = convertSDKUserToStackUser(user);
    await syncUserToAppwrite(stackUser).catch(error => {
      logger.error('Failed to sync user to Appwrite after login:', error);
    });
    
    setCurrentUser(appUser);
    return appUser;
  };

  // Logout
  const logout = async (): Promise<void> => {
    if (!stackClientApp) {
      throw new Error('Authentication is not configured');
    }
    
    try {
      await apiSignOut();
    } catch (error) {
      logger.error('Error logging out:', error);
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
    await stackClientApp.signInWithOAuth('google');
    
    return new Promise(() => {});
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    if (!stackClientApp) {
      throw new Error('Authentication is not configured');
    }
    
    const result = await stackClientApp.sendForgotPasswordEmail(email);
    if (result.status === 'error') {
      throw new Error(result.error.message);
    }
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
