import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ClerkAuthEmbed } from '@/components/auth/ClerkAuthEmbed';

export default function SignInPage() {
  return (
    <AuthPageLayout mode="sign-in">
      <ClerkAuthEmbed mode="sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/feed" />
    </AuthPageLayout>
  );
}