'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

const AUTH_PATHS = ['/sign-in', '/sign-up'];

/** App shell; auth uses full-page card (no duplicate footer). */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  if (isAuth) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  return (
    <>
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  );
}