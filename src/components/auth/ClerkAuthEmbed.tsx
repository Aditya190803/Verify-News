'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import type { ComponentProps } from 'react';
import { ClerkAuthCard } from '@/components/auth/ClerkAuthCard';
import { facetsAuthClerkAppearance } from '@/lib/clerkAuthAppearance';

type SignInProps = ComponentProps<typeof SignIn>;
type SignUpProps = ComponentProps<typeof SignUp>;

type ClerkAuthEmbedProps =
  | ({ mode: 'sign-in' } & SignInProps)
  | ({ mode: 'sign-up' } & SignUpProps);

export function ClerkAuthEmbed(props: ClerkAuthEmbedProps) {
  const { mode, ...clerkProps } = props;

  if (mode === 'sign-in') {
    return (
      <ClerkAuthCard mode="sign-in">
        <SignIn appearance={facetsAuthClerkAppearance} {...(clerkProps as SignInProps)} />
      </ClerkAuthCard>
    );
  }

  return (
    <ClerkAuthCard mode="sign-up">
      <SignUp appearance={facetsAuthClerkAppearance} {...(clerkProps as SignUpProps)} />
    </ClerkAuthCard>
  );
}