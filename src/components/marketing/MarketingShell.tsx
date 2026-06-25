import Header from '@/components/Header';
import type { ReactNode } from 'react';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}