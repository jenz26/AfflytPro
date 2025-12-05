import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { GlassCard } from '@/components/ui/GlassCard';

export const metadata: Metadata = {
  title: 'Guide - Afflyt | Impara l\'affiliate marketing con Telegram',
  description: 'Guide complete per automatizzare il tuo business di affiliate marketing su Telegram. Scopri strategie, best practice e come massimizzare le tue conversioni.',
  alternates: {
    canonical: 'https://afflyt.io/it/guide',
    languages: {
      'it': 'https://afflyt.io/it/guide',
      'x-default': 'https://afflyt.io/it/guide',
    },
  },
  openGraph: {
    title: 'Guide Afflyt - Affiliate Marketing su Telegram',
    description: 'Guide complete per automatizzare il tuo business di affiliate marketing.',
    type: 'website',
    locale: 'it_IT',
    siteName: 'Afflyt',
    url: 'https://afflyt.io/it/guide',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Guide data - will be replaced with CMS/MDX later
const guides = [
  {
    slug: 'automatizzare-canale-telegram-affiliate',
    title: 'Come automatizzare un canale Telegram Affiliate',
    description: 'Guida completa per creare e automatizzare un canale Telegram di offerte Amazon. Dalla creazione del bot alla pubblicazione automatica dei deal.',
    readTime: '12 min',
    category: 'Automazione',
    featured: true,
    comingSoon: true,
  },
  {
    slug: 'scegliere-prodotti-migliori-automazione',
    title: 'Come scegliere i prodotti migliori usando l\'automazione',
    description: 'Scopri come utilizzare il Deal Score e l\'automazione per selezionare solo i prodotti che convertono meglio per il tuo pubblico.',
    readTime: '10 min',
    category: 'Strategia',
    featured: true,
    comingSoon: true,
  },
];

export default function GuidesPage() {
  return (
    <LandingLayout>
      <div className="min-h-screen bg-afflyt-dark-100">
        {/* Hero */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-afflyt-cyan-400/10 border border-afflyt-cyan-400/20 text-afflyt-cyan-400 text-sm mb-6">
              <BookOpen className="h-4 w-4" />
              <span>Centro Risorse</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Guide per Affiliate Creator
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Strategie, tutorial e best practice per automatizzare e scalare il tuo business di affiliate marketing su Telegram.
            </p>
          </div>
        </section>

        {/* Featured Guides */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-afflyt-cyan-400" />
              Guide in Evidenza
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {guides.filter(g => g.featured).map((guide) => (
                <GlassCard key={guide.slug} className="p-6 hover:border-afflyt-cyan-400/50 transition-all group relative">
                  {guide.comingSoon && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                      Coming Soon
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-afflyt-cyan-400 mb-3">
                    <span className="px-2 py-0.5 rounded bg-afflyt-cyan-400/10">{guide.category}</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      {guide.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-afflyt-cyan-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {guide.description}
                  </p>
                  {!guide.comingSoon ? (
                    <Link
                      href={`/it/guide/${guide.slug}`}
                      className="inline-flex items-center gap-2 text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                    >
                      Leggi la guida
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-gray-500 font-medium cursor-not-allowed">
                      Disponibile a breve
                    </span>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8 text-center bg-gradient-to-br from-afflyt-cyan-400/10 to-afflyt-purple-400/10">
              <h2 className="text-2xl font-bold text-white mb-4">
                Vuoi mettere in pratica quello che impari?
              </h2>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                Afflyt ti aiuta ad automatizzare tutto il processo. Dalla ricerca dei deal alla pubblicazione, tutto in un&apos;unica piattaforma.
              </p>
              <Link
                href="/it/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-afflyt-cyan-400 text-afflyt-dark-100 font-semibold hover:bg-afflyt-cyan-300 transition-colors"
              >
                Prova Afflyt Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>
          </div>
        </section>
      </div>
    </LandingLayout>
  );
}
