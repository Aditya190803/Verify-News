'use client';

import type { ReactNode } from 'react';
import Footer from '@/components/Footer';

/** App shell: main column + marketing footer (same on auth and product pages). */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  );
}