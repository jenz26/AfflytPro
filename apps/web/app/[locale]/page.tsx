import { Metadata } from 'next';
import { LandingLayout } from '@/components/landing';
import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  ComparisonSection,
  HowItWorksSection,
  TrustSection,
  PricingSection,
  FAQSection,
  CTASection,
} from '@/components/landing/sections';

export const metadata: Metadata = {
  title: 'Afflyt - Il copilota AI per affiliate creator su Telegram',
  description: 'Smetti di postare a caso. Afflyt monitora migliaia di offerte Amazon, seleziona quelle giuste per il tuo pubblico, e pubblica nel momento perfetto.',
  openGraph: {
    title: 'Afflyt - Il copilota AI per affiliate creator su Telegram',
    description: 'Smetti di postare a caso. Afflyt monitora migliaia di offerte Amazon, seleziona quelle giuste per il tuo pubblico, e pubblica nel momento perfetto.',
    type: 'website',
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
