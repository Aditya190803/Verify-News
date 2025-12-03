import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NewsProvider } from "./context/NewsContext";
import { AppProviders } from "./components/AppProviders";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Login = lazy(() => import("./pages/Login"));
const Results = lazy(() => import("./pages/Results"));
const Feed = lazy(() => import("./pages/Feed"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <AppProviders>
      <Toaster />
      <BrowserRouter>
        <NewsProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search-results" element={<SearchResults />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/handler/*" element={<OAuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* <Route path="/results" element={<Results />} /> */}
              <Route path="/result/:slug" element={<Results />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </NewsProvider>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
