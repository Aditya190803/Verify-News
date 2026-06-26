'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const THEME_STORAGE_KEY = 'facets-ui-theme';

type AuthPageLayoutProps = {
  mode: 'sign-in' | 'sign-up';
  children: ReactNode;
};

function ForceLightMode({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
      root.classList.remove('light', 'dark');

      if (stored === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(stored);
      }
    };
  }, []);

  return (
    <div className="light min-h-screen flex flex-col bg-neutral-100" style={{ colorScheme: 'light' }}>
      {children}
    </div>
  );
}

export function AuthPageLayout({ mode, children }: AuthPageLayoutProps) {
  const legal =
    mode === 'sign-up'
      ? 'By creating an account, you agree to our'
      : 'By signing in, you agree to our';

  return (
    <ForceLightMode>
      <header className="w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        <Button variant="outline" size="default" className="gap-2 bg-white" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Go back home
          </Link>
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[26rem] flex flex-col items-center">
          {children}
          <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed max-w-sm">
            {legal}{' '}
            <Link
              href="/legal"
              className="text-foreground/80 hover:text-foreground underline underline-offset-2"
            >
              terms of service and privacy policy
            </Link>
            .
          </p>
        </div>
      </main>
    </ForceLightMode>
  );
}