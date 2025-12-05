import { Metadata } from 'next';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { HeroSection } from '@/components/landing/sections/HeroSection';
import { ProblemSection } from '@/components/landing/sections/ProblemSection';
import { SolutionSection } from '@/components/landing/sections/SolutionSection';
import { ComparisonSection } from '@/components/landing/sections/ComparisonSection';
import { HowItWorksSection } from '@/components/landing/sections/HowItWorksSection';
import { DemoSection } from '@/components/landing/sections/DemoSection';
import { TrustSection } from '@/components/landing/sections/TrustSection';
import { PricingSection } from '@/components/landing/sections/PricingSection';
import { FAQSection } from '@/components/landing/sections/FAQSection';
import { CTASection } from '@/components/landing/sections/CTASection';
import { JsonLdSchema } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Afflyt - Il copilota AI per affiliate creator su Telegram',
  description: 'Smetti di postare a caso. Afflyt monitora migliaia di offerte Amazon, seleziona quelle giuste per il tuo pubblico, e pubblica nel momento perfetto. Deal Score, Analytics, Copy AI.',
  keywords: ['affiliate marketing', 'telegram', 'amazon affiliati', 'bot telegram offerte', 'automazione affiliate'],
  authors: [{ name: 'Afflyt' }],
  // SEO: Canonical e hreflang per multilingual
  alternates: {
    canonical: 'https://afflyt.io/it',
    languages: {
      'it': 'https://afflyt.io/it',
      'en': 'https://afflyt.io/en',
      'x-default': 'https://afflyt.io/it', // IT come default (301 da DealPilot)
    },
  },
  openGraph: {
    title: 'Afflyt - Il copilota AI per affiliate creator su Telegram',
    description: 'Deal Score intelligente. Analytics in tempo reale. Ottimizzazione continua. Smetti di postare a caso.',
    type: 'website',
    locale: 'it_IT',
    alternateLocale: 'en_US',
    siteName: 'Afflyt',
    url: 'https://afflyt.io/it',
    images: [
      {
        url: 'https://afflyt.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Afflyt - Automazione Affiliate Marketing Amazon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Afflyt - Il copilota AI per affiliate creator',
    description: 'Deal Score intelligente. Analytics in tempo reale. Ottimizzazione continua.',
    images: ['https://afflyt.io/og-image.png'],
    creator: '@afflyt_io',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification if available
    // google: 'your-verification-code',
  },
};

export default function LandingPage() {
  return (
    <LandingLayout>
      {/* JSON-LD Schema for SEO */}
      <JsonLdSchema />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <HowItWorksSection />
      <DemoSection />
      <TrustSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </LandingLayout>
  );
}
