import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { ClerkAuthEmbed } from '@/components/auth/ClerkAuthEmbed';

export default function SignUpPage() {
  return (
    <AuthPageLayout mode="sign-up">
      <ClerkAuthEmbed mode="sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </AuthPageLayout>
  );
}