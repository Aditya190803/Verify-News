import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClerkAuthCard } from '@/components/auth/ClerkAuthCard';

describe('ClerkAuthCard', () => {
  it('shows sign-in welcome copy', () => {
    render(
      <ClerkAuthCard mode="sign-in">
        <div data-testid="clerk-form">form</div>
      </ClerkAuthCard>,
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByTestId('clerk-form')).toBeInTheDocument();
  });

  it('shows sign-up welcome copy', () => {
    render(
      <ClerkAuthCard mode="sign-up">
        <div data-testid="clerk-form">form</div>
      </ClerkAuthCard>,
    );

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByTestId('clerk-form')).toBeInTheDocument();
  });
});