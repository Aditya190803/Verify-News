/**
 * AppProviders component that combines all context providers into a single wrapper.
 * This simplifies the App.tsx hierarchy and makes provider management easier.
 */
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { SearchHistoryProvider } from "@/context/SearchHistoryContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <AuthProvider>
              <SearchHistoryProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
              </SearchHistoryProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
