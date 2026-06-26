'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function AuthLinks({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex flex-col gap-2 px-3' : 'flex items-center gap-2'}>
      {!compact && (
        <div className="hidden lg:block">
          <LanguageSwitcher />
        </div>
      )}
      <Button size="sm" variant={compact ? 'outline' : 'ghost'} asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}

/** Clerk sign-in / sign-up / user menu for Next.js App Router. */
export function ClerkNavAuth({ compact }: { compact?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthLinks compact={compact} />;
  }

  if (!isSignedIn) {
    return <AuthLinks compact={compact} />;
  }

  return (
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
  );
}