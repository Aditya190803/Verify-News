import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalToastListener } from '@/hooks/useGlobalToastListener';
import Header from '@/components/Header';
import HistorySidebar from '@/components/HistorySidebar';
import { useNews } from '@/context/NewsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';

// New modular components
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const VerificationContent = () => {
  useGlobalToastListener();
  const { status, articles, resetState } = useNews();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (status === 'verified') {
      resetState();
    }
  }, [status, resetState]);
  
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
    return;
  }, [location.pathname, status, resetState]);
  
  useEffect(() => {
    if (articles.length > 0) {
      navigate('/search-results');
    }
  }, [articles, navigate]);
  
  return (
    <div className="w-full flex flex-col items-center">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
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
      <Footer />
    </div>
  );
};

export default Index;
