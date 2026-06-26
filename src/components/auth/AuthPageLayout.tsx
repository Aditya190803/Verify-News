'use client';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageHero } from '@/components/marketing/PageHero';
import { PageSection } from '@/components/marketing/PageSection';
import { RelatedLinks } from '@/components/marketing/RelatedLinks';
import { FACETS } from '@/lib/brand';

type AuthPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternate: { label: string; href: string };
};

/** Same chrome as Feed / Pricing / Blindspot. */
export function AuthPageLayout({
  eyebrow,
  title,
  description,
  children,
  alternate,
}: AuthPageLayoutProps) {
  return (
    <MarketingShell>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        <p className="text-sm text-muted-foreground">
          {alternate.label}{' '}
          <Link to={alternate.href} className="text-primary font-medium hover:underline underline-offset-4">
            {alternate.href === '/sign-up' ? 'Create account' : 'Sign in'}
          </Link>
        </p>
      </PageHero>

      <PageSection width="narrow" className="!pt-6 !pb-12 sm:!pb-14">
        <div className="rounded-lg border border-border/80 bg-card px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          By continuing you agree to our{' '}
          <Link to="/legal" className="text-foreground/80 hover:text-foreground underline underline-offset-2">
            terms & privacy
          </Link>
          . {FACETS.tagline}
        </p>
      </PageSection>

      <RelatedLinks
        links={[
          { to: '/feed', label: 'Coverage feed' },
          { to: '/methodology', label: 'Bias methodology' },
          { to: '/', label: 'Verify a headline' },
        ]}
      />
    </MarketingShell>
  );
}