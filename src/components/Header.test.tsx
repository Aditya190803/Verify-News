import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

vi.mock('@/components/auth/ClerkNavAuth', () => ({
  ClerkNavAuth: () => (
    <div data-testid="clerk-nav">
      <button type="button">Sign in</button>
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'aria.closeMobileMenu': 'Close menu',
        'aria.openMobileMenu': 'Open menu',
        'common.verify': 'Verify',
      })[key] ?? key,
  }),
}));

const renderHeader = () =>
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>,
  );

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Facets home link', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /facets home/i })).toBeInTheDocument();
  });

  it('renders Feed link', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /^Feed$/i })).toBeInTheDocument();
  });

  it('does not render About in header', () => {
    renderHeader();
    expect(screen.queryByRole('link', { name: /^About$/i })).not.toBeInTheDocument();
  });

  it('renders Clerk auth slot', () => {
    renderHeader();
    expect(screen.getByTestId('clerk-nav')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });
});