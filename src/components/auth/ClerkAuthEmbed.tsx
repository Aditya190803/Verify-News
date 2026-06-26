'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import type { ComponentProps } from 'react';
import { AuthFormSkeleton } from '@/components/auth/AuthFormSkeleton';
import { ClerkAuthCard } from '@/components/auth/ClerkAuthCard';
import { facetsAuthEmbedAppearance } from '@/lib/clerkAuthAppearance';

type SignInProps = ComponentProps<typeof SignIn>;
type SignUpProps = ComponentProps<typeof SignUp>;

type ClerkAuthEmbedProps =
  | ({ mode: 'sign-in' } & SignInProps)
  | ({ mode: 'sign-up' } & SignUpProps);

export function ClerkAuthEmbed(props: ClerkAuthEmbedProps) {
  const { mode, ...clerkProps } = props;
  const appearance = facetsAuthEmbedAppearance;

  if (mode === 'sign-in') {
    return (
      <ClerkAuthCard mode="sign-in">
        <SignIn
          routing="path"
          path="/sign-in"
          appearance={appearance}
          fallback={<AuthFormSkeleton mode="sign-in" />}
          {...(clerkProps as SignInProps)}
        />
      </ClerkAuthCard>
    );
  }

  return (
    <ClerkAuthCard mode="sign-up">
      <SignUp
        routing="path"
        path="/sign-up"
        appearance={appearance}
        fallback={<AuthFormSkeleton mode="sign-up" />}
        {...(clerkProps as SignUpProps)}
      />
    </ClerkAuthCard>
  );
}