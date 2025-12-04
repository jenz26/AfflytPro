import { Metadata } from 'next';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { HeroSection } from '@/components/landing/sections/HeroSection';
import { ProblemSection } from '@/components/landing/sections/ProblemSection';
import { SolutionSection } from '@/components/landing/sections/SolutionSection';
import { ComparisonSection } from '@/components/landing/sections/ComparisonSection';
import { HowItWorksSection } from '@/components/landing/sections/HowItWorksSection';
import { TrustSection } from '@/components/landing/sections/TrustSection';
import { PricingSection } from '@/components/landing/sections/PricingSection';
import { FAQSection } from '@/components/landing/sections/FAQSection';
import { CTASection } from '@/components/landing/sections/CTASection';

export const metadata: Metadata = {
  title: 'Afflyt - Il copilota AI per affiliate creator su Telegram',
  description: 'Smetti di postare a caso. Afflyt monitora migliaia di offerte Amazon, seleziona quelle giuste per il tuo pubblico, e pubblica nel momento perfetto. Deal Score, Analytics, Copy AI.',
  keywords: ['affiliate marketing', 'telegram', 'amazon affiliati', 'bot telegram offerte', 'automazione affiliate'],
  authors: [{ name: 'Afflyt' }],
  openGraph: {
    title: 'Afflyt - Il copilota AI per affiliate creator su Telegram',
    description: 'Deal Score intelligente. Analytics in tempo reale. Ottimizzazione continua. Smetti di postare a caso.',
    type: 'website',
    locale: 'it_IT',
    siteName: 'Afflyt',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Afflyt - Automazione Affiliate Marketing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Afflyt - Il copilota AI per affiliate creator',
    description: 'Deal Score intelligente. Analytics in tempo reale. Ottimizzazione continua.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <LandingLayout>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <HowItWorksSection />
      <TrustSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </LandingLayout>
  );
}
