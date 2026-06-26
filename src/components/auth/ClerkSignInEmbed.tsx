'use client';

import { SignIn } from '@clerk/nextjs';
import type { ComponentProps } from 'react';
import { ClerkAuthCard } from '@/components/auth/ClerkAuthCard';
import { facetsAuthClerkAppearance } from '@/lib/clerkAuthAppearance';

type SignInProps = ComponentProps<typeof SignIn>;

export function ClerkSignInEmbed(props: SignInProps) {
  return (
    <ClerkAuthCard mode="sign-in">
      <SignIn appearance={facetsAuthClerkAppearance} {...props} />
    </ClerkAuthCard>
  );
}