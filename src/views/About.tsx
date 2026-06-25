import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Layers, Shield, Sparkles, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageHero } from '@/components/marketing/PageHero';
import { PageSection } from '@/components/marketing/PageSection';
import { RelatedLinks } from '@/components/marketing/RelatedLinks';

const About = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: Layers,
      title: 'Coverage feed',
      desc: 'Same story, many outlets. See bias spread and source count before you read a single article.',
    },
    {
      icon: Sparkles,
      title: 'AI verify',
      desc: 'Paste a claim or URL. We cross-check with search and models, then show sources you can open yourself.',
    },
    {
      icon: Shield,
      title: t('about.features.trustworthy.title'),
      desc: t('about.features.trustworthy.desc'),
    },
    {
      icon: Zap,
      title: t('about.features.fast.title'),
      desc: t('about.features.fast.desc'),
    },
    {
      icon: Globe,
      title: t('about.features.global.title'),
      desc: t('about.features.global.desc'),
    },
    {
      icon: User,
      title: t('about.features.privacy.title'),
      desc: t('about.features.privacy.desc'),
    },
  ];

  return (
    <MarketingShell>
      <PageHero
        eyebrow="About"
        title={t('about.heroTitle')}
        description={t('about.heroDesc')}
        align="center"
      />

      <PageSection width="content">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('about.storyTitle')}</h2>
        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed max-w-[65ch]">
          <p>{t('about.storyP1')}</p>
          <p>{t('about.storyP2')}</p>
        </div>
      </PageSection>

      <PageSection title={t('about.featuresTitle')} width="wide" tone="muted">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item) => (
            <li key={item.title} className="max-w-sm">
              <item.icon className="h-5 w-5 text-primary mb-3" aria-hidden />
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection width="content">
        <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">{t('about.ctaTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t('about.ctaDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 sm:mt-0 justify-center sm:justify-end">
            <Button size="lg" className="group" asChild>
              <Link to="/">
                {t('common.startVerifying')}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/feed">Browse feed</Link>
            </Button>
          </div>
        </div>
      </PageSection>

      <RelatedLinks
        links={[
          { to: '/how-it-works', label: 'How it works' },
          { to: '/methodology', label: 'Methodology' },
          { to: '/pricing', label: 'Pricing' },
        ]}
      />
    </MarketingShell>
  );
};

export default About;