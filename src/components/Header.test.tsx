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
    it('renders the Facets logo text', () => {
      renderHeader();
      expect(screen.getByRole('link', { name: /facets home/i })).toBeInTheDocument();
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
      expect(screen.getByRole('link', { name: /^Feed$/i })).toBeInTheDocument();
    });

    it('does not render About in header (footer only)', () => {
      renderHeader();
      expect(screen.queryByRole('link', { name: /^About$/i })).not.toBeInTheDocument();
    });

    it('does not show dashboard in bar when logged out', () => {
      mockCurrentUser = null;
      renderHeader();
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });
  });

  describe('Authentication UI', () => {
    it('shows Sign in button when not logged in', () => {
      mockCurrentUser = null;
      renderHeader();
      expect(screen.getByRole('link', { name: /auth\.signIn/i })).toBeInTheDocument();
    });

    it('shows account trigger when logged in', () => {
      mockCurrentUser = { displayName: 'John Doe', email: 'john@example.com' };
      renderHeader();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
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
