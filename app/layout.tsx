import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ui } from '@clerk/ui';
import { facetsClerkAppearance } from '@/lib/clerkAuthAppearance';
import { NextAppProviders } from '@/components/NextAppProviders';
import { SiteChrome } from '@/components/SiteChrome';
import './globals.css';
import { FACETS, facetsSiteUrl } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(facetsSiteUrl()),
  title: FACETS.name,
  description: FACETS.tagline,
  manifest: '/manifest.webmanifest',
  applicationName: FACETS.name,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col antialiased"
        suppressHydrationWarning
      >
        <ClerkProvider ui={ui} appearance={facetsClerkAppearance}>
          <NextAppProviders>
            <SiteChrome>{children}</SiteChrome>
          </NextAppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}