

import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const HowItWorks = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {t('howItWorks.heroTitle')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.heroDesc')}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="space-y-16">
            {[
              {
                step: 1,
                title: "Share what you want to check",
                description: "Paste a URL, article text, social media post, or any claim you've seen. We handle all text-based content.",
                icon: <FileText className="h-6 w-6" />,
              },
              {
                step: 2,
                title: "We search trusted sources",
                description: "Our AI scans reputable news outlets, fact-checking organizations, and verified databases to find relevant information.",
                icon: <Search className="h-6 w-6" />,
              },
              {
                step: 3,
                title: "Get a clear answer",
                description: "Within seconds, you'll see whether the claim is true, false, or needs more context—with links to sources so you can verify yourself.",
                icon: <CheckCircle className="h-6 w-6" />,
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-md mb-3">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What makes it work */}
        <div className="bg-muted/30 border-y border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-semibold text-center mb-12">{t('howItWorks.featuresTitle')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Lightbulb className="h-5 w-5" />,
                  title: t('howItWorks.feature.smartUnderstanding.title'),
                  description: t('howItWorks.feature.smartUnderstanding.desc')
                },
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: t('howItWorks.feature.trustedSources.title'),
                  description: t('howItWorks.feature.trustedSources.desc')
                },
                {
                  icon: <Zap className="h-5 w-5" />,
                  title: t('howItWorks.feature.realTime.title'),
                  description: t('howItWorks.feature.realTime.desc')
                },
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary">{feature.icon}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('howItWorks.ctaTitle')}</h2>
          <p className="text-muted-foreground mb-8">{t('howItWorks.ctaDesc')}</p>
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

export default HowItWorks;
