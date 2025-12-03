import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

// Mock the auth context
const mockLogout = vi.fn();
let mockCurrentUser: { displayName: string | null; email: string } | null = null;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    logout: mockLogout,
    loading: false,
    login: vi.fn(),
    signup: vi.fn(),
    socialLogin: vi.fn(),
    resetPassword: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderHeader = (props = {}) => {
  return render(
    <BrowserRouter>
      <Header {...props} />
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = null;
  });

  describe('Logo and Branding', () => {
    it('renders the VerifyNews logo text', () => {
      renderHeader();
      // Logo component shows "Verify" and "News" as separate elements
      expect(screen.getByText(/Verify/)).toBeInTheDocument();
      expect(screen.getByText(/News/)).toBeInTheDocument();
    });

    it('logo links to home page', () => {
      renderHeader();
      // The logo link should go to home
      const links = screen.getAllByRole('link');
      const homeLink = links.find(link => link.getAttribute('href') === '/');
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders Feed link', () => {
      renderHeader();
      expect(screen.getByRole('link', { name: /feed/i })).toBeInTheDocument();
    });

    it('renders About link', () => {
      renderHeader();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });

    it('renders How it works link', () => {
      renderHeader();
      expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    });

    it('does not render Dashboard link when not logged in', () => {
      mockCurrentUser = null;
      renderHeader();
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('renders Dashboard link when logged in', () => {
      mockCurrentUser = { displayName: 'Test User', email: 'test@example.com' };
      renderHeader();
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Authentication UI', () => {
    it('shows Sign in button when not logged in', () => {
      mockCurrentUser = null;
      renderHeader();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows user display name when logged in', () => {
      mockCurrentUser = { displayName: 'John Doe', email: 'john@example.com' };
      renderHeader();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows email prefix when no display name', () => {
      mockCurrentUser = { displayName: null, email: 'john@example.com' };
      renderHeader();
      expect(screen.getByText('john')).toBeInTheDocument();
    });
  });

  describe('Header Structure', () => {
    it('renders without history button props (sidebar is separate)', () => {
      renderHeader();
      // Header should render successfully without any history-related props
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('has proper header styling classes', () => {
      renderHeader();
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0');
    });
  });

  describe('Mobile Menu', () => {
    it('renders mobile menu button', () => {
      renderHeader();
      
      // There should be at least one button element (the mobile menu button)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderHeader();
      // Header should be a semantic header element
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('navigation links are accessible', () => {
      renderHeader();
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
