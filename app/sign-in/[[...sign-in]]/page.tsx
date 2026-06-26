import { SignIn } from '@clerk/nextjs';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { facetsClerkAppearanceEmbedded } from '@/lib/clerkAppearance';
import { FACETS } from '@/lib/brand';

export default function SignInPage() {
  return (
    <AuthPageLayout
      eyebrow={`${FACETS.name} · Account`}
      title="Sign in"
      description="Access your feed, blindspot list, saved verifications, and plan limits."
      alternate={{ label: 'New here?', href: '/sign-up' }}
    >
      <SignIn
        appearance={facetsClerkAppearanceEmbedded}
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/feed"
      />
    </AuthPageLayout>
  );
}