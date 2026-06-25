import Logo from '@/components/Logo';
import { FACETS } from '@/lib/brand';

const WelcomeHeader = () => (
  <div className="text-center mb-8">
    <div className="flex justify-center mb-4">
      <Logo size="lg" showText={false} />
    </div>
    <p className="text-xs font-medium uppercase tracking-widest text-primary mb-1">{FACETS.name}</p>
    <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
    <p className="mt-2 text-sm text-muted-foreground">Sign in to save follows, plans, and verification history</p>
  </div>
);

export default WelcomeHeader;
