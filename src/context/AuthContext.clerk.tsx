'use client';

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import type { AppUser, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function toAppUser(user: ReturnType<typeof useUser>['user']): AppUser | null {
  if (!user) return null;
  return {
    id: user.id,
    uid: user.id,
    displayName: user.fullName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    emailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
    photoURL: user.imageUrl,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const value: AuthContextType = {
    currentUser: toAppUser(user),
    loading: !isLoaded,
    login: async () => {
      void clerk.openSignIn();
    },
    signup: async () => {
      void clerk.openSignUp();
    },
    logout: async () => {
      await clerk.signOut();
    },
    socialLogin: async () => {
      void clerk.openSignIn();
    },
    resetPassword: async () => {
      void clerk.openSignIn();
    },
    refreshUser: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};