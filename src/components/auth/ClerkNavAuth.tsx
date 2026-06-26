'use client';

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';

/** Clerk sign-in / sign-up / user menu for Next.js App Router. */
export function ClerkNavAuth({ compact }: { compact?: boolean }) {
  return (
    <>
      <Show when="signed-out">
        <div className={compact ? 'flex flex-col gap-2 px-3' : 'flex items-center gap-2'}>
          {!compact && (
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          )}
          <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
            <Button size="sm" variant={compact ? 'outline' : 'ghost'}>
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
            <Button size="sm">Sign up</Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className={compact ? 'flex items-center gap-3 px-3' : 'flex items-center gap-2'}>
          {!compact && (
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          )}
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
          />
        </div>
      </Show>
    </>
  );
}