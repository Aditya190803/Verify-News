
import { useTranslation } from 'react-i18next';

export const FeaturesSection = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full bg-muted/40 border-t border-border/50 mt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12">
          {t('features.title')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-3">{t('features.step1.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('features.step1.desc')}</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-3">{t('features.step2.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('features.step2.desc')}</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-3">{t('features.step3.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('features.step3.desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
