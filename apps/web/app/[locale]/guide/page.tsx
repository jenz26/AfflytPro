import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { GlassCard } from '@/components/ui/GlassCard';
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

export default function GuidesPage() {
  const guides = getAllGuides();
  const featuredGuides = guides.filter(g => g.featured);
  const otherGuides = guides.filter(g => !g.featured);

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
        {featuredGuides.length > 0 && (
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-afflyt-cyan-400" />
                Guide in Evidenza
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredGuides.map((guide) => (
                  <Link key={guide.slug} href={`/it/guide/${guide.slug}`} className="group">
                    <GlassCard className="p-6 h-full hover:border-afflyt-cyan-400/50 transition-all">
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
                      <span className="inline-flex items-center gap-2 text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium">
                        Leggi la guida
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other Guides */}
        {otherGuides.length > 0 && (
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">
                Altre Guide
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {otherGuides.map((guide) => (
                  <Link key={guide.slug} href={`/it/guide/${guide.slug}`} className="group">
                    <GlassCard className="p-5 h-full hover:border-afflyt-cyan-400/50 transition-all">
                      <span className="text-xs text-afflyt-cyan-400 mb-2 block">{guide.category}</span>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-afflyt-cyan-400 transition-colors line-clamp-2">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {guide.description}
                      </p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
