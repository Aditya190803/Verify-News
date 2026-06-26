import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalToastListener } from '@/hooks/useGlobalToastListener';
import Header from '@/components/Header';
import HistorySidebar from '@/components/HistorySidebar';
import { useNews } from '@/context/NewsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';

// New modular components
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';

const VerificationContent = () => {
  useGlobalToastListener();
  const { articles, resetState } = useNews();
  const navigate = useNavigate();
  
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
    if (articles.length > 0) {
      navigate('/search-results');
    }
  }, [articles, navigate]);
  
  return (
    <div className="w-full flex flex-col items-center">
      <HeroSection />
      <FeaturesSection />
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
      
      {/* Footer rendered globally in App */}
    </div>
  );
};

export default Index;
