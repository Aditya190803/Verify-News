
import React from 'react';
import Header from '@/components/Header';
import NewsForm from '@/components/NewsForm';
import NewsSearch from '@/components/NewsSearch';
import NewsArticles from '@/components/NewsArticles';
import SearchHistory from '@/components/SearchHistory';
import { useNews } from '@/context/NewsContext';
import { useAuth } from '@/context/AuthContext';
import { Shield, FileText, Image, Mic, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

// Error boundary component
const ErrorBoundary = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error in component:", error);
    return <>{fallback}</>;
  }
};

const VerificationContent = () => {
  const { status, articles } = useNews();
  
  return (
    <div className="w-full px-4 sm:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-200px)]">
      <div className="text-center mb-8 sm:mb-12 w-full max-w-2xl animate-fade-in">
        <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
          <div className="rounded-full bg-primary/10 p-2 sm:p-3">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight animate-slide-down">
          Verify news with precision
        </h1>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-foreground/60 leading-relaxed animate-slide-down px-4 sm:px-0" style={{ animationDelay: '50ms' }}>
          Our AI-powered tool helps verify the accuracy of news articles, social media posts, and claims by checking against trusted sources.
        </p>
      </div>
      
      {articles.length > 0 ? (
        <ErrorBoundary fallback={<div>Error loading news articles</div>}>
          <NewsArticles />
        </ErrorBoundary>
      ) : (
        <>
          <ErrorBoundary fallback={<div>Error loading news search</div>}>
            <NewsSearch />
          </ErrorBoundary>
            <div className="my-6 sm:my-8 text-center text-foreground/60">
            <p className="text-sm sm:text-base">- OR -</p>
          </div>
            <ErrorBoundary fallback={<div>Error loading news form</div>}>
            <NewsForm />
          </ErrorBoundary>
        </>
      )}
      
      <div className="mt-12 sm:mt-16 w-full max-w-2xl">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-medium">Supports multiple input types</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Text", active: true, description: "Paste text or URLs" },
            { icon: <Image className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Images", active: true, description: "Upload screenshots" },
            { icon: <Mic className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Audio", active: true, description: "Upload audio clips" },
            { icon: <Video className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Video", active: true, description: "Upload video clips" },
          ].map((item, index) => (
            <div 
              key={index}
              className={cn(
                "flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:border-primary/50",
                item.active 
                  ? "border-foreground/10 bg-foreground/5" 
                  : "border-dashed border-foreground/10 bg-foreground/5 opacity-40"
              )}
              onClick={() => {
                if (item.active) {
                  // Handle changing input type
                  console.log(`Switching to ${item.label} input type`);
                }
              }}
            >
              <div className="p-1.5 sm:p-2 rounded-full bg-foreground/10">
                {item.icon}
              </div>
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium">{item.label}</span>
              <span className="text-xs text-foreground/60 text-center mt-0.5 sm:mt-1 hidden sm:block">{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Desktop sidebar - hidden on mobile */}
        {currentUser && (
          <div className="hidden lg:block">
            <SearchHistory />
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 py-4 sm:py-6 lg:py-8">
          <VerificationContent />
        </div>
      </main>
      <footer className="py-4 sm:py-6 border-t border-foreground/5">
        <div className="container max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm text-foreground/40">
          VerifyNews &copy; {new Date().getFullYear()} — A tool for truth in the digital age
        </div>
      </footer>
    </div>
  );
};

export default Index;
