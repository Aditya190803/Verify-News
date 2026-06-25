'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { ConvexAuthSync } from '@/components/ConvexAuthSync';
import { AuthProvider } from '@/context/AuthContext';
import '@/config/i18n';

const queryClient = new QueryClient();

export function NextAppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <ConvexClientProvider>
            <AuthProvider>
              <ConvexAuthSync />
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
            </AuthProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}