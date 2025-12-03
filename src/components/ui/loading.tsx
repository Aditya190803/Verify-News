import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots = ({ className }: LoadingDotsProps) => {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
    </div>
  );
};

interface LoadingBarProps {
  className?: string;
}

export const LoadingBar = ({ className }: LoadingBarProps) => {
  return (
    <div className={cn('relative h-1 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-loading-shimmer" />
    </div>
  );
};

interface LoadingPulseProps {
  className?: string;
}

export const LoadingPulse = ({ className }: LoadingPulseProps) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
        <div className="relative rounded-full bg-primary h-12 w-12" />
      </div>
    </div>
  );
};

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader = ({ message = 'Loading...' }: FullPageLoaderProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <LoadingSpinner size="xl" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
};

interface InlineLoaderProps {
  message?: string;
  className?: string;
}

export const InlineLoader = ({ message, className }: InlineLoaderProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
};
