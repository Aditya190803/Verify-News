'use client';

import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { AuthFormSkeleton } from '@/components/auth/AuthFormSkeleton';
import { AuthWelcomeHeader } from '@/components/auth/AuthWelcomeHeader';

type ClerkAuthCardProps = {
  mode: 'sign-in' | 'sign-up';
  children: ReactNode;
};

export function ClerkAuthCard({ mode, children }: ClerkAuthCardProps) {
  return (
    <div className="w-full min-h-[22rem] rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-6 pt-6">
        <AuthWelcomeHeader mode={mode} />
      </div>
      <div className="px-6 pb-6">
        <ClerkLoading>
          <AuthFormSkeleton mode={mode} />
        </ClerkLoading>
        <ClerkLoaded>{children}</ClerkLoaded>
      </div>
    </div>
  );
}