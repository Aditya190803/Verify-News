import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { stackClientApp } from '../config/stackAuth';
import { Button } from '@/components/ui/button';

/**
 * OAuth Callback Page
 * 
 * This page handles the OAuth callback from Stack Auth.
 * It handles both /oauth/callback and /handler/* routes from Stack Auth.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if this is a Stack Auth error handler route (/handler/error)
        if (location.pathname.startsWith('/handler/error')) {
          const errorCode = urlParams.get('errorCode');
          const message = urlParams.get('message');
          const details = urlParams.get('details');
          
          console.error('Stack Auth error:', { errorCode, message, details });
          
          // Parse the error message for user-friendly display
          let userMessage = message || 'Authentication failed';
          
          // Handle specific error codes
          if (errorCode === 'CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE') {
            userMessage = 'This email is already associated with another account. Please sign in with the method you originally used to create your account.';
            if (details) {
              try {
                const detailsObj = JSON.parse(details);
                if (detailsObj.would_work_if_email_was_verified) {
                  userMessage += ' Alternatively, verify your email on the original account to link this login method.';
                }
              } catch {
                // Ignore JSON parse errors
              }
            }
          }
          
          setError(userMessage);
          setErrorDetails(errorCode || null);
          return;
        }
        
        // Check if this is a Stack Auth handler route (success or other)
        if (location.pathname.startsWith('/handler/')) {
          // For other handler routes, try to complete OAuth or check user status
          if (stackClientApp) {
            const user = await stackClientApp.getUser();
            if (user) {
              console.log('✅ User already authenticated:', user.primaryEmail);
              window.dispatchEvent(new CustomEvent('stackAuthStateChange'));
              navigate('/', { replace: true });
              return;
            }
          }
          
          // If no user, redirect to login
          navigate('/login', { replace: true });
          return;
        }

        // Standard OAuth callback flow (/oauth/callback)
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam || 'OAuth authentication failed');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        if (!stackClientApp) {
          setError('Stack Auth is not configured');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        // Use the SDK to complete the OAuth callback
        await stackClientApp.callOAuthCallback();
        
        // Check if user is now logged in
        const user = await stackClientApp.getUser();
        
        if (user) {
          console.log('✅ OAuth authentication successful:', user.primaryEmail);
          window.dispatchEvent(new CustomEvent('stackAuthStateChange'));
          navigate('/', { replace: true });
        } else {
          setError('Failed to get user after authentication');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    processCallback();
  }, [navigate, location.pathname]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="text-destructive mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          {errorDetails && (
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
              Error code: {errorDetails}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/login', { replace: true })}>
              Back to Login
            </Button>
            <Button variant="outline" onClick={() => navigate('/', { replace: true })}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Completing Sign In</h1>
        <p className="text-muted-foreground">Please wait while we authenticate you...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
