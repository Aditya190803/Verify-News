import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Layers, Search, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { PageHero } from '@/components/marketing/PageHero';
import { PageSection } from '@/components/marketing/PageSection';
import { RelatedLinks } from '@/components/marketing/RelatedLinks';

const verifySteps = [
  {
    step: '01',
    title: 'Share what you want to check',
    description:
      'Paste a URL, article excerpt, or social post. Text-first today; media verify is on the roadmap when the API supports it.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'Search and analyze',
    description:
      'The API can run web search (e.g. Tavily) and an LLM pass over trusted-style sources. You see confidence, verdict, and links.',
    icon: Search,
  },
  {
    step: '03',
    title: 'Read the verdict yourself',
    description:
      'True, false, or needs context: always with citations. Save history when signed in. Limits depend on your plan.',
    icon: CheckCircle,
  },
];

const HowItWorks = () => {
  const { t } = useTranslation();

  const strengths = [
    {
      icon: Zap,
      title: t('howItWorks.feature.realTime.title'),
      desc: t('howItWorks.feature.realTime.desc'),
    },
    {
      icon: Shield,
      title: t('howItWorks.feature.trustedSources.title'),
      desc: t('howItWorks.feature.trustedSources.desc'),
    },
    {
      icon: Layers,
      title: 'Coverage is separate',
      desc: 'The feed shows who covered a story and from which lean. That is not the same as an AI fact-check.',
    },
  ];

  return (
    <MarketingShell>
      <PageHero
        eyebrow="How it works"
        title={t('howItWorks.heroTitle')}
        description={t('howItWorks.heroDesc')}
        align="center"
      />

      <PageSection title="Verify a claim" description="Three steps on the home page and API /verify route." width="content">
        <ol className="space-y-12">
          {verifySteps.map((item) => (
            <li key={item.step} className="flex gap-5 sm:gap-8">
              <div className="shrink-0 w-12 text-right">
                <span className="text-xs font-semibold tabular-nums text-primary">{item.step}</span>
              </div>
              <div className="flex-1 min-w-0 pb-12 border-b border-border/50 last:border-0 last:pb-0">
                <item.icon className="h-5 w-5 text-primary mb-3" aria-hidden />
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[60ch]">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection title="Browse coverage" description="Use the feed when you want perspective, not a single verdict." width="content" tone="muted">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
          RSS items cluster into stories. Each story lists outlets, a bias bar, and optional blindspot text when you follow
          publishers on{' '}
          <Link to="/following" className="text-primary underline underline-offset-4">
            Following
          </Link>
          . Labels come from curated seed data: see{' '}
          <Link to="/methodology" className="text-primary underline underline-offset-4">
            Methodology
          </Link>
          .
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/feed">Open feed</Link>
        </Button>
      </PageSection>

      <PageSection title={t('howItWorks.featuresTitle')} width="content">
        <ul className="grid gap-10 sm:grid-cols-3">
          {strengths.map((f) => (
            <li key={f.title}>
              <f.icon className="h-5 w-5 text-primary mb-3" aria-hidden />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection width="content">
        <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">{t('howItWorks.ctaTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t('howItWorks.ctaDesc')}</p>
          </div>
          <Button size="lg" className="group mt-6 sm:mt-0 shrink-0" asChild>
            <Link to="/">
              {t('common.startVerifying')}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </PageSection>

      <RelatedLinks
        links={[
          { to: '/about', label: 'About' },
          { to: '/feed', label: 'Feed' },
          { to: '/pricing', label: 'Pricing' },
        ]}
      />
    </MarketingShell>
  );
};

export default HowItWorks;