import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClerkAuthCard } from '@/components/auth/ClerkAuthCard';

vi.mock('@clerk/nextjs', () => ({
  ClerkLoading: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loading">{children}</div>
  ),
  ClerkLoaded: () => null,
}));

describe('ClerkAuthCard', () => {
  it('shows sign-in welcome copy and loading skeleton', () => {
    render(
      <ClerkAuthCard mode="sign-in">
        <div data-testid="clerk-form">form</div>
      </ClerkAuthCard>,
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading sign in')).toBeInTheDocument();
    expect(screen.queryByTestId('clerk-form')).not.toBeInTheDocument();
  });

  it('shows sign-up welcome copy and loading skeleton', () => {
    render(
      <ClerkAuthCard mode="sign-up">
        <div data-testid="clerk-form">form</div>
      </ClerkAuthCard>,
    );

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading sign up')).toBeInTheDocument();
  });
});