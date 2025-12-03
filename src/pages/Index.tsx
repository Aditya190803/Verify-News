import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useGlobalToastListener } from '@/hooks/useGlobalToastListener';
import Header from '@/components/Header';
import UnifiedNewsInput from '@/components/UnifiedNewsInput';
import HistorySidebar from '@/components/HistorySidebar';
import { useNews } from '@/context/NewsContext';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, APP_METADATA } from '@/lib/constants';

const VerificationContent = () => {
  useGlobalToastListener();
  const { status, articles, resetState } = useNews();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (status === 'verified') {
      resetState();
    }
  }, []);
  
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        resetState();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [resetState]);
  
  useEffect(() => {
    if (location.pathname === '/') {
      const timer = setTimeout(() => {
        if (status === 'verified' || status === 'error') {
          resetState();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, status, resetState]);
  
  useEffect(() => {
    if (articles.length > 0) {
      navigate('/search-results');
    }
  }, [articles, navigate]);
  
  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
            Know what's true.
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Paste any article, link, or claim. We'll check it against trusted sources and tell you what's real.
          </p>
        </div>
        
        {/* Input Section */}
        <UnifiedNewsInput />
        
        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-secondary" />
            <span>Verified sources</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" />
            <span>Results in seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span>AI-powered analysis</span>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="w-full bg-muted/40 border-t border-border/50 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12">
            How it works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">Share content</h3>
              <p className="text-muted-foreground leading-relaxed">
                Paste a link, article text, or any claim you want to verify
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">We analyze</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI cross-references with trusted news sources and fact-checkers
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">Get the truth</h3>
              <p className="text-muted-foreground leading-relaxed">
                See a clear verdict with sources you can check yourself
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-card border border-border">
          <div>
            <h3 className="text-xl font-semibold mb-2">Explore recent verifications</h3>
            <p className="text-muted-foreground">See what others have checked</p>
          </div>
          <Link to="/feed">
            <Button variant="outline" size="lg" className="group">
              <TrendingUp className="h-4 w-4 mr-2" />
              Browse feed
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [showHistory, setShowHistory] = useLocalStorage(STORAGE_KEYS.SHOW_SEARCH_HISTORY, false);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* History Sidebar */}
      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        onOpen={() => setShowHistory(true)}
      />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1">
        <VerificationContent />
      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {APP_METADATA.NAME}. Built for truth.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it works
              </Link>
              <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
                Feed
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
