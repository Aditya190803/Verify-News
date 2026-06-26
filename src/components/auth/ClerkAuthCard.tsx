'use client';

import type { ReactNode } from 'react';
import { AuthWelcomeHeader } from '@/components/auth/AuthWelcomeHeader';

type ClerkAuthCardProps = {
  mode: 'sign-in' | 'sign-up';
  children: ReactNode;
};

/** Facets-branded shell around Clerk SignIn / SignUp (form styling is in clerkAuthAppearance). */
export function ClerkAuthCard({ mode, children }: ClerkAuthCardProps) {
  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm">
      <div className="px-6 pt-6 pb-2">
        <AuthWelcomeHeader mode={mode} />
      </div>
      <div className="facets-auth-clerk px-6 pb-6 pt-4">{children}</div>
    </div>
  );
}