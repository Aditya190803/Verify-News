import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import { NextAppProviders } from '@/components/NextAppProviders';
import { SiteChrome } from '@/components/SiteChrome';
import './globals.css';
import { FACETS, facetsSiteUrl } from '@/lib/brand';
import { facetsClerkAppearance } from '@/lib/clerkAppearance';

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
        <ClerkProvider appearance={{ theme: shadcn, elements: facetsClerkAppearance.elements }}>
          <NextAppProviders>
            <SiteChrome>{children}</SiteChrome>
          </NextAppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}