import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { NextAppProviders } from '@/components/NextAppProviders';
import Footer from '@/components/Footer';
import './globals.css';
import { FACETS } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: FACETS.name,
  description: FACETS.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <ClerkProvider>
          <NextAppProviders>
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
          </NextAppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}