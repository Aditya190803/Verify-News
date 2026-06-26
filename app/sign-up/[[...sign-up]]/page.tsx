import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ClerkSignUpEmbed } from '@/components/auth/ClerkSignUpEmbed';

export default function SignUpPage() {
  return (
    <AuthPageLayout mode="sign-up">
      <ClerkSignUpEmbed signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </AuthPageLayout>
  );
}