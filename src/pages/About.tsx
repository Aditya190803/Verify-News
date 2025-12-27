
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { Shield, Globe, Zap, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {t('about.heroTitle')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('about.heroDesc')}
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mb-6">{t('about.storyTitle')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{t('about.storyP1')}</p>
            <p className="text-muted-foreground leading-relaxed">{t('about.storyP2')}</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-muted/30 border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-semibold text-center mb-12">{t('about.featuresTitle')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: t('about.features.trustworthy.title'),
                  description: t('about.features.trustworthy.desc')
                },
                {
                  icon: <Zap className="h-5 w-5" />,
                  title: t('about.features.fast.title'),
                  description: t('about.features.fast.desc')
                },
                {
                  icon: <Globe className="h-5 w-5" />,
                  title: t('about.features.global.title'),
                  description: t('about.features.global.desc')
                },
                {
                  icon: <User className="h-5 w-5" />,
                  title: t('about.features.privacy.title'),
                  description: t('about.features.privacy.desc')
                },
              ].map((feature, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-primary">{feature.icon}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('about.ctaTitle')}</h2>
          <p className="text-muted-foreground mb-8">{t('about.ctaDesc')}</p>
          <Link to="/">
            <Button size="lg" className="group">
              {t('common.startVerifying')}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </main>
      
      {/* Footer rendered globally in App */}
    </div>
  );
};

export default About;
