import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

let mockCurrentUser: { uid: string; displayName: string | null; email: string } | null = {
  uid: 'user123',
  displayName: 'Test User',
  email: 'test@example.com',
};

const mockNavigate = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    loading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    stats: {
      totalVerifications: 2,
      trueCount: 1,
      falseCount: 1,
      uncertainCount: 0,
      recentVerifications: [
        {
          id: '1',
          slug: 'abc',
          query: 'Test claim',
          veracity: 'true',
          confidence: 90,
          timestamp: new Date().toISOString(),
        },
      ],
      breakdown: { true: 50, false: 50, uncertain: 0 },
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('@/components/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>,
  );

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { uid: 'user123', displayName: 'Test User', email: 'test@example.com' };
  });

  it('redirects when not authenticated', async () => {
    mockCurrentUser = null;
    renderDashboard();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('renders dashboard content when authenticated', async () => {
    renderDashboard();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Test claim/i)).toBeInTheDocument();
    });
  });
});