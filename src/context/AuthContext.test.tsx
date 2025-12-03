import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the Stack Auth services
vi.mock('../services/stackAuthApi', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue(null),
  isStackAuthConfigured: vi.fn().mockReturnValue(true),
  sendPasswordResetCode: vi.fn(),
}));

vi.mock('../config/stackAuth', () => ({
  stackClientApp: null,
  isStackAuthConfigured: vi.fn().mockReturnValue(false),
}));

// Test component to consume the context
const TestConsumer = () => {
  const { currentUser, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{currentUser ? currentUser.email : 'no-user'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides loading state initially', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // After loading is complete, should show ready
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
  });

  it('provides null user when not logged in', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  it('throws error when useAuth is called outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleError.mockRestore();
  });

  it('provides auth methods', async () => {
    let authContext: ReturnType<typeof useAuth> | null = null;
    
    const ContextCapture = () => {
      authContext = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <ContextCapture />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authContext).not.toBeNull();
    });

    expect(authContext!.login).toBeDefined();
    expect(authContext!.signup).toBeDefined();
    expect(authContext!.logout).toBeDefined();
    expect(authContext!.socialLogin).toBeDefined();
    expect(authContext!.resetPassword).toBeDefined();
    expect(authContext!.refreshUser).toBeDefined();
  });
});
