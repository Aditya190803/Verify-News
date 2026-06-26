import { SignUp } from '@clerk/nextjs';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { facetsClerkAppearanceEmbedded } from '@/lib/clerkAppearance';
import { FACETS } from '@/lib/brand';

export default function SignUpPage() {
  return (
    <AuthPageLayout
      eyebrow={`${FACETS.name} · Account`}
      title="Create account"
      description="Free tier includes the public coverage feed and monthly AI verifications."
      alternate={{ label: 'Already have an account?', href: '/sign-in' }}
    >
      <SignUp
        appearance={facetsClerkAppearanceEmbedded}
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthPageLayout>
  );
}