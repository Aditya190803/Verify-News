
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const WelcomeHeader = () => (
  <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center mb-4">
      <div className="rounded-full bg-primary/10 p-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>
    </div>
    <h1 className="text-2xl font-semibold tracking-tight">Welcome to VerifyNews</h1>
    <p className="mt-2 text-foreground/60">
      Sign in to access your verification history and saved results
    </p>
  </div>
);

export default WelcomeHeader;
