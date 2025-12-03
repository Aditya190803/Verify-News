import { AlertTriangle, WifiOff, ServerCrash, ShieldAlert, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  onGoBack,
  onGoHome,
  className,
  showIcon = true,
  icon,
}: ErrorStateProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {showIcon && (
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          {icon || <AlertTriangle className="h-8 w-8 text-destructive" />}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
};

export const NetworkErrorState = ({ onRetry }: { onRetry?: () => void }) => {
  return (
    <ErrorState
      title="Connection Lost"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      icon={<WifiOff className="h-8 w-8 text-destructive" />}
    />
  );
};

export const ServerErrorState = ({ onRetry }: { onRetry?: () => void }) => {
  return (
    <ErrorState
      title="Server Error"
      message="Our servers are experiencing issues. Please try again in a few moments."
      onRetry={onRetry}
      icon={<ServerCrash className="h-8 w-8 text-destructive" />}
    />
  );
};

export const PermissionErrorState = ({ onGoBack }: { onGoBack?: () => void }) => {
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to access this resource."
      onGoBack={onGoBack}
      icon={<ShieldAlert className="h-8 w-8 text-destructive" />}
    />
  );
};

export const NotFoundErrorState = ({ onGoHome }: { onGoHome?: () => void }) => {
  return (
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      onGoHome={onGoHome}
    />
  );
};

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const InlineError = ({ message, onRetry, className }: InlineErrorProps) => {
  return (
    <div className={cn('flex items-center gap-2 rounded-md bg-destructive/10 p-3', className)}>
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive flex-1">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard = ({ title, message, onRetry, className }: ErrorCardProps) => {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="default" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorBoundaryFallback = ({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="max-w-lg p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Oops! Something went wrong</h1>
          <p className="mb-4 text-muted-foreground">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4 w-full rounded-md bg-muted p-4 text-left">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
