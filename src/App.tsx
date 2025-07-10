
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TestIndex from "./pages/TestIndex";
import SearchResults from "./pages/SearchResults";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Login from "./pages/Login";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import { NewsProvider } from "./context/NewsContext";
import { AuthProvider } from "./context/AuthContext";
import { SearchHistoryProvider } from "./context/SearchHistoryContext";
import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <SearchHistoryProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <NewsProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/test" element={<TestIndex />} />
                    <Route path="/search-results" element={<SearchResults />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/login" element={<Login />} />
                    {/* <Route path="/results" element={<Results />} /> */}
                    <Route path="/result/:slug" element={<Results />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </NewsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </SearchHistoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
