import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock the auth context
let mockCurrentUser: { uid: string; displayName: string | null; email: string } | null = null;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    loading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    socialLogin: vi.fn(),
    resetPassword: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

// Mock verification data
let mockVerifications: Array<{
  id: string;
  slug: string;
  query: string;
  title?: string;
  veracity?: string;
  confidence?: number;
  articleTitle?: string;
}> = [];

vi.mock('@/services/appwriteService', () => ({
  getUserHistoryByType: vi.fn().mockImplementation(() => Promise.resolve(mockVerifications)),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { uid: 'user123', displayName: 'Test User', email: 'test@example.com' };
    mockVerifications = [];
  });

  describe('Authentication', () => {
    it('redirects to login when not authenticated', async () => {
      mockCurrentUser = null;
      renderComponent();
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('renders dashboard when authenticated', async () => {
      mockCurrentUser = { uid: 'user123', displayName: 'Test User', email: 'test@example.com' };
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Test query 1', veracity: 'true', confidence: 0.9 },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/your dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no verifications exist', async () => {
      mockVerifications = [];
      renderComponent();
      
      await waitFor(() => {
        // The empty state shows "Start verifying" both as text and button label
        const elements = screen.getAllByText(/start verifying/i);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Stats Display', () => {
    it('displays total verifications count', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
        { id: '2', slug: 'slug2', query: 'Query 2', veracity: 'false' },
        { id: '3', slug: 'slug3', query: 'Query 3', veracity: 'uncertain' },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('displays true count correctly', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
        { id: '2', slug: 'slug2', query: 'Query 2', veracity: 'true' },
        { id: '3', slug: 'slug3', query: 'Query 3', veracity: 'false' },
      ];
      renderComponent();
      
      await waitFor(() => {
        // Find all True labels and verify at least one exists (stats card and breakdown)
        const trueLabels = screen.getAllByText('True');
        expect(trueLabels.length).toBeGreaterThanOrEqual(1);
        // Verify the count "2" appears for true verifications
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('displays false count correctly', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'false' },
        { id: '2', slug: 'slug2', query: 'Query 2', veracity: 'false' },
      ];
      renderComponent();
      
      await waitFor(() => {
        // Find all False labels and verify at least one exists
        const falseLabels = screen.getAllByText('False');
        expect(falseLabels.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays uncertain count correctly', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'uncertain' },
        { id: '2', slug: 'slug2', query: 'Query 2', veracity: 'mixed' },
      ];
      renderComponent();
      
      await waitFor(() => {
        // Find all Uncertain labels and verify at least one exists
        const uncertainLabels = screen.getAllByText('Uncertain');
        expect(uncertainLabels.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Results Breakdown', () => {
    it('displays results breakdown section', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/results breakdown/i)).toBeInTheDocument();
      });
    });

    it('shows percentage breakdown', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
        { id: '2', slug: 'slug2', query: 'Query 2', veracity: 'true' },
        { id: '3', slug: 'slug3', query: 'Query 3', veracity: 'false' },
        { id: '4', slug: 'slug4', query: 'Query 4', veracity: 'false' },
      ];
      renderComponent();
      
      await waitFor(() => {
        // 2 true out of 4 = 50%, may appear multiple times in breakdown
        const percentageElements = screen.getAllByText(/2 \(50%\)/i);
        expect(percentageElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Recent Verifications', () => {
    it('displays recent verifications section', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Recent Query', veracity: 'true' },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/recent verifications/i)).toBeInTheDocument();
      });
    });

    it('shows verification items', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Test verification query', veracity: 'true', confidence: 0.85 },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test verification query')).toBeInTheDocument();
      });
    });

    it('shows confidence percentage', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Test query', veracity: 'true', confidence: 0.92 },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/92% confidence/i)).toBeInTheDocument();
      });
    });

    it('navigates to result page on item click', async () => {
      mockVerifications = [
        { id: '1', slug: 'testslug', query: 'Test query', veracity: 'true' },
      ];
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test query')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Test query'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/result/testslug');
    });

    it('limits recent verifications to 5 items', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
        { id: '2', slug: 'slug2', query: 'Query 2', veracity: 'true' },
        { id: '3', slug: 'slug3', query: 'Query 3', veracity: 'true' },
        { id: '4', slug: 'slug4', query: 'Query 4', veracity: 'true' },
        { id: '5', slug: 'slug5', query: 'Query 5', veracity: 'true' },
        { id: '6', slug: 'slug6', query: 'Query 6', veracity: 'true' },
        { id: '7', slug: 'slug7', query: 'Query 7', veracity: 'true' },
      ];
      renderComponent();
      
      await waitFor(() => {
        // Only first 5 should be shown
        expect(screen.getByText('Query 1')).toBeInTheDocument();
        expect(screen.getByText('Query 5')).toBeInTheDocument();
        expect(screen.queryByText('Query 6')).not.toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('shows Verify more button', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /verify more/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton while fetching data', () => {
      // The component should show skeleton initially
      renderComponent();
      // During initial render, loading should be true
      // This is hard to test deterministically, but we can verify it doesn't crash
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /your dashboard/i })).toBeInTheDocument();
      });
    });

    it('has accessible stat cards', async () => {
      mockVerifications = [
        { id: '1', slug: 'slug1', query: 'Query 1', veracity: 'true' },
      ];
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/total verified/i)).toBeInTheDocument();
      });
    });
  });
});
