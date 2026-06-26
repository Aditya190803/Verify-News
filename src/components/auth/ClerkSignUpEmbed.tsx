'use client';

import { SignUp } from '@clerk/nextjs';
import type { ComponentProps } from 'react';
import { ClerkAuthCard } from '@/components/auth/ClerkAuthCard';
import { facetsAuthClerkAppearance } from '@/lib/clerkAuthAppearance';

type SignUpProps = ComponentProps<typeof SignUp>;

export function ClerkSignUpEmbed(props: SignUpProps) {
  return (
    <ClerkAuthCard mode="sign-up">
      <SignUp appearance={facetsAuthClerkAppearance} {...props} />
    </ClerkAuthCard>
  );
}