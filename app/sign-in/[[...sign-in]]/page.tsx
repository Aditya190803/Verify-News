import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ClerkSignInEmbed } from '@/components/auth/ClerkSignInEmbed';

export default function SignInPage() {
  return (
    <AuthPageLayout mode="sign-in">
      <ClerkSignInEmbed signUpUrl="/sign-up" fallbackRedirectUrl="/feed" />
    </AuthPageLayout>
  );
}