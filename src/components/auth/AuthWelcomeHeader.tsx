import Link from 'next/link';
import Logo from '@/components/Logo';
import { FACETS } from '@/lib/brand';

type Mode = 'sign-in' | 'sign-up';

const copy: Record<Mode, { title: string; description: string }> = {
  'sign-in': {
    title: 'Welcome back',
    description: 'Sign in to save follows, plans, and verification history',
  },
  'sign-up': {
    title: 'Create your account',
    description: 'Coverage feed, blindspot, and monthly AI verifications on the free tier',
  },
};

export function AuthWelcomeHeader({ mode }: { mode: Mode }) {
  const { title, description } = copy[mode];

  return (
    <div className="text-center pb-5 border-b border-neutral-100">
      <Link
        href="/"
        className="inline-flex justify-center mb-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`${FACETS.name} home`}
      >
        <Logo size="lg" showText={false} />
      </Link>
      <p className="text-xs font-medium uppercase tracking-widest text-primary mb-1">{FACETS.name}</p>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}