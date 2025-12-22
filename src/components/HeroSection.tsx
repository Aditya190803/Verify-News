
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, Sparkles } from 'lucide-react';
import UnifiedNewsInput from './UnifiedNewsInput';

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
          {t('verification.title')}
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {t('verification.description')}
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
  );
};

export default HeroSection;
