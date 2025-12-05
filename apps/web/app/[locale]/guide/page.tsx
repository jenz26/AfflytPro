import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { getAllGuides } from '@/lib/content';

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

// Category icon mapping
function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    'Automazione': <Sparkles className="h-5 w-5" />,
    'Analytics': <CheckCircle2 className="h-5 w-5" />,
    'Strategia': <BookOpen className="h-5 w-5" />,
  };
  return icons[category] || <BookOpen className="h-5 w-5" />;
}

export default function GuidesPage() {
  const guides = getAllGuides();
  const featuredGuides = guides.filter(g => g.featured);
  const otherGuides = guides.filter(g => !g.featured);

  return (
    <LandingLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-afflyt-dark-200 via-afflyt-dark-100 to-afflyt-dark-100">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-afflyt-cyan-400/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-afflyt-plasma-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-afflyt-cyan-400/10 border border-afflyt-cyan-400/20 text-afflyt-cyan-400 text-sm font-medium mb-8">
              <BookOpen className="h-4 w-4" />
              Centro Risorse Afflyt
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Guide per{' '}
              <span className="bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-plasma-500 bg-clip-text text-transparent">
                Affiliate Creator
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Strategie, tutorial e best practice per automatizzare e scalare il tuo business di affiliate marketing su Telegram.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-afflyt-cyan-400" />
                <span><strong className="text-white">{guides.length}</strong> guide</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-afflyt-plasma-500" />
                <span><strong className="text-white">Gratis</strong> per tutti</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-afflyt-profit-400" />
                <span><strong className="text-white">Aggiornate</strong> regolarmente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Guides */}
      {featuredGuides.length > 0 && (
        <section className="bg-afflyt-dark-100 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Guide in Evidenza</h2>
                <p className="text-gray-500 text-sm">Le risorse più utili per iniziare</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {featuredGuides.map((guide, index) => (
                <Link
                  key={guide.slug}
                  href={`/it/guide/${guide.slug}`}
                  className={`group relative overflow-hidden rounded-2xl border border-gray-800 hover:border-afflyt-cyan-400/50 transition-all duration-300 hover:-translate-y-1 ${
                    index === 0 ? 'md:col-span-2' : ''
                  }`}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-afflyt-dark-50 to-afflyt-dark-100" />
                  <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-400/0 to-afflyt-plasma-500/0 group-hover:from-afflyt-cyan-400/5 group-hover:to-afflyt-plasma-500/5 transition-all duration-300" />

                  <div className={`relative p-8 ${index === 0 ? 'md:flex md:items-center md:gap-8' : ''}`}>
                    <div className={index === 0 ? 'md:flex-1' : ''}>
                      {/* Category */}
                      <div className="flex items-center gap-2 text-afflyt-cyan-400 text-sm font-medium mb-4">
                        {getCategoryIcon(guide.category)}
                        {guide.category}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-afflyt-cyan-400/20 text-xs">
                          Consigliata
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold text-white mb-3 group-hover:text-afflyt-cyan-400 transition-colors ${
                        index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'
                      }`}>
                        {guide.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-gray-400 mb-6 ${index === 0 ? 'text-lg' : ''}`}>
                        {guide.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {guide.readTime}
                        </span>
                        <span className="flex items-center gap-1 text-afflyt-cyan-400 group-hover:gap-2 transition-all font-medium">
                          Leggi la guida
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Guides */}
      <section className="bg-afflyt-dark-200 border-t border-gray-800 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Tutte le Guide
              </h2>
              <p className="text-gray-400">
                Esplora tutte le nostre risorse educative
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span>{guides.length} guide disponibili</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(otherGuides.length > 0 ? otherGuides : guides).map((guide) => (
              <Link
                key={guide.slug}
                href={`/it/guide/${guide.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-afflyt-dark-50 border border-gray-800 hover:border-afflyt-cyan-400/50 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-400/0 to-afflyt-plasma-500/0 group-hover:from-afflyt-cyan-400/5 group-hover:to-afflyt-plasma-500/5 transition-all duration-300" />

                <div className="relative p-6">
                  {/* Category */}
                  <div className="flex items-center gap-2 text-afflyt-cyan-400 text-sm font-medium mb-4">
                    {getCategoryIcon(guide.category)}
                    {guide.category}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-afflyt-cyan-400 transition-colors line-clamp-2">
                    {guide.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {guide.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {guide.readTime}
                    </span>
                    <span className="flex items-center gap-1 text-afflyt-cyan-400 group-hover:gap-2 transition-all">
                      Leggi
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-afflyt-dark-100 border-t border-gray-800 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-400/20 via-afflyt-dark-50 to-afflyt-plasma-500/20" />
            <div className="absolute inset-0 bg-afflyt-dark-50/80" />

            <div className="relative text-center p-12 md:p-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 mb-8">
                <Sparkles className="h-8 w-8 text-white" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Pronto a mettere in pratica?
              </h2>

              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Afflyt ti aiuta ad automatizzare tutto il processo. Dalla ricerca dei deal alla pubblicazione, tutto in un&apos;unica piattaforma.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/it/auth/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-afflyt-cyan-400 text-afflyt-dark-100 font-semibold hover:bg-afflyt-cyan-300 transition-all hover:scale-105 shadow-lg shadow-afflyt-cyan-400/25"
                >
                  Inizia Gratis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/it"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                >
                  Scopri Afflyt
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
