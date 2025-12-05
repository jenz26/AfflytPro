import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { GlassCard } from '@/components/ui/GlassCard';

export const metadata: Metadata = {
  title: 'DealPilot diventa Afflyt - Annuncio Ufficiale | Afflyt',
  description: 'DealPilot evolve e diventa Afflyt, la piattaforma di automazione per affiliate creators e canali Telegram. Scopri cosa cambia, le nuove funzionalita come Deal Score e Analytics, e come accedere subito al nuovo sistema.',
  keywords: ['dealpilot', 'afflyt', 'migrazione', 'rebrand', 'affiliate marketing', 'telegram bot', 'amazon affiliati', 'deal score', 'automazione telegram'],
  alternates: {
    canonical: 'https://afflyt.io/it/blog/dealpilot-diventa-afflyt',
    languages: {
      'it': 'https://afflyt.io/it/blog/dealpilot-diventa-afflyt',
      'x-default': 'https://afflyt.io/it/blog/dealpilot-diventa-afflyt',
    },
  },
  openGraph: {
    title: 'DealPilot diventa Afflyt - Annuncio Ufficiale',
    description: 'DealPilot evolve e diventa Afflyt. Stessa missione, nuove funzionalita potenti per il tuo affiliate marketing su Telegram.',
    type: 'article',
    locale: 'it_IT',
    siteName: 'Afflyt',
    url: 'https://afflyt.io/it/blog/dealpilot-diventa-afflyt',
    publishedTime: '2024-12-01T00:00:00Z',
    modifiedTime: new Date().toISOString(),
    authors: ['Afflyt Team'],
    section: 'Annunci',
    tags: ['rebrand', 'dealpilot', 'afflyt', 'migrazione'],
    images: [
      {
        url: 'https://afflyt.io/og-migration.png',
        width: 1200,
        height: 630,
        alt: 'DealPilot diventa Afflyt - Annuncio Ufficiale della Migrazione',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DealPilot diventa Afflyt',
    description: 'La piattaforma che ami si evolve. Scopri cosa cambia.',
    images: ['https://afflyt.io/og-migration.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// JSON-LD Schema for the migration announcement
function MigrationJsonLd() {
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'DealPilot diventa Afflyt - Annuncio Ufficiale',
    description: 'DealPilot evolve e diventa Afflyt, la piattaforma di automazione per affiliate creators e canali Telegram.',
    image: 'https://afflyt.io/og-migration.png',
    datePublished: '2024-12-01T00:00:00Z',
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Afflyt',
      url: 'https://afflyt.io',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Afflyt',
      url: 'https://afflyt.io',
      logo: {
        '@type': 'ImageObject',
        url: 'https://afflyt.io/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://afflyt.io/it/blog/dealpilot-diventa-afflyt',
    },
    about: {
      '@type': 'Brand',
      name: 'Afflyt',
      alternateName: 'DealPilot',
      description: 'Piattaforma di automazione per affiliate marketing su Telegram',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
    />
  );
}

export default function MigrationPage() {
  return (
    <LandingLayout>
      {/* JSON-LD Schema for SEO */}
      <MigrationJsonLd />
      <div className="min-h-screen bg-afflyt-dark-100">
        <article className="max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <header className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-afflyt-cyan-400/10 border border-afflyt-cyan-400/20 text-afflyt-cyan-400 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Annuncio Ufficiale</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              DealPilot diventa Afflyt
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              La piattaforma che hai imparato ad amare si evolve.
              Stessa missione, nuove funzionalità potenti per portare il tuo affiliate marketing al livello successivo.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Dicembre 2024
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">

            {/* Cosa sta succedendo */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-afflyt-cyan-400" />
                Cosa sta succedendo?
              </h2>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">DealPilot</strong>, la piattaforma che hai utilizzato per automatizzare
                il tuo canale Telegram di offerte Amazon, si evolve e diventa <strong className="text-afflyt-cyan-400">Afflyt</strong>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Non si tratta solo di un cambio di nome. Afflyt rappresenta una
                <strong className="text-white"> nuova generazione</strong> di strumenti per affiliate creator,
                con funzionalità avanzate che prima non erano possibili.
              </p>
            </section>

            {/* Cosa cambia */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Cosa cambia per te?</h2>

              <div className="grid md:grid-cols-2 gap-4 not-prose">
                <GlassCard className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-afflyt-profit-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">I tuoi dati sono al sicuro</h3>
                      <p className="text-sm text-gray-400">Tutti i tuoi canali, automazioni e statistiche sono stati migrati automaticamente.</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-afflyt-profit-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Stesso account</h3>
                      <p className="text-sm text-gray-400">Accedi con le stesse credenziali. Nessuna nuova registrazione richiesta.</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-afflyt-profit-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Nuove funzionalità</h3>
                      <p className="text-sm text-gray-400">Deal Score AI, Analytics avanzati, Copy automatico e molto altro.</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-afflyt-profit-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Stessa missione</h3>
                      <p className="text-sm text-gray-400">Aiutarti a guadagnare di più con meno sforzo. Sempre.</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* Perché il cambiamento */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Perché questo cambiamento?</h2>
              <p className="text-gray-300 leading-relaxed">
                DealPilot è nato come un semplice bot Telegram per trovare offerte.
                Ma ascoltando voi, i nostri utenti, abbiamo capito che serviva molto di più.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">Afflyt</strong> è la risposta: una piattaforma completa che non solo
                trova le offerte, ma le analizza, le valuta con il <strong className="text-afflyt-cyan-400">Deal Score</strong>,
                le pubblica automaticamente nel momento migliore, e ti mostra esattamente quanto stai guadagnando.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Il nuovo nome riflette questa evoluzione: da semplice &quot;pilota dei deal&quot; a
                <strong className="text-white"> copilota AI</strong> per il tuo business di affiliate marketing.
              </p>
            </section>

            {/* Nuove funzionalità */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Le novità di Afflyt</h2>

              <div className="space-y-4 not-prose">
                <GlassCard className="p-6 border-l-4 border-l-afflyt-cyan-400">
                  <h3 className="font-semibold text-white mb-2">Deal Score Intelligente</h3>
                  <p className="text-gray-400">
                    Ogni offerta viene analizzata e valutata da 0 a 100.
                    Pubblica solo i deal che convertono davvero.
                  </p>
                </GlassCard>

                <GlassCard className="p-6 border-l-4 border-l-afflyt-plasma-500">
                  <h3 className="font-semibold text-white mb-2">Analytics in Tempo Reale</h3>
                  <p className="text-gray-400">
                    Dashboard completa con click, conversioni, revenue per canale,
                    per prodotto, per orario. Tutto tracciato.
                  </p>
                </GlassCard>

                <GlassCard className="p-6 border-l-4 border-l-afflyt-profit-400">
                  <h3 className="font-semibold text-white mb-2">Automazioni Avanzate</h3>
                  <p className="text-gray-400">
                    Configura regole intelligenti: pubblica solo offerte sopra un certo score,
                    in certe categorie, a certi orari.
                  </p>
                </GlassCard>
              </div>
            </section>

            {/* Trust section */}
            <section className="mb-12">
              <GlassCard className="p-8 bg-gradient-to-br from-afflyt-cyan-400/5 to-afflyt-plasma-500/5">
                <div className="flex items-start gap-4">
                  <Shield className="h-8 w-8 text-afflyt-cyan-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">La stessa squadra, la stessa passione</h3>
                    <p className="text-gray-400">
                      Dietro Afflyt c&apos;è lo stesso team che ha costruito DealPilot.
                      Conosciamo le tue esigenze perché siamo affiliate creator anche noi.
                      Questa evoluzione è il risultato di mesi di lavoro e del feedback della nostra community.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </section>

            {/* Internal links section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Approfondisci</h2>
              <div className="grid md:grid-cols-3 gap-4 not-prose">
                <Link href="/it" className="group">
                  <GlassCard className="p-5 h-full hover:border-afflyt-cyan-400/50 transition-all">
                    <h3 className="font-semibold text-white mb-2 group-hover:text-afflyt-cyan-400 transition-colors">
                      Scopri tutte le funzionalità
                    </h3>
                    <p className="text-sm text-gray-400">
                      Esplora Deal Score, Analytics, Automazioni e molto altro.
                    </p>
                  </GlassCard>
                </Link>
                <Link href="/it/guide/automatizzare-canale-telegram-affiliate" className="group">
                  <GlassCard className="p-5 h-full hover:border-afflyt-cyan-400/50 transition-all">
                    <h3 className="font-semibold text-white mb-2 group-hover:text-afflyt-cyan-400 transition-colors">
                      Guida: Automatizza Telegram
                    </h3>
                    <p className="text-sm text-gray-400">
                      Come creare un canale affiliate automatizzato.
                    </p>
                  </GlassCard>
                </Link>
                <Link href="/it/auth/register" className="group">
                  <GlassCard className="p-5 h-full hover:border-afflyt-cyan-400/50 transition-all">
                    <h3 className="font-semibold text-white mb-2 group-hover:text-afflyt-cyan-400 transition-colors">
                      Inizia gratis oggi
                    </h3>
                    <p className="text-sm text-gray-400">
                      Crea il tuo account e prova Afflyt senza impegno.
                    </p>
                  </GlassCard>
                </Link>
              </div>
            </section>

          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <GlassCard className="p-8 bg-gradient-to-br from-afflyt-cyan-400/10 to-afflyt-plasma-500/10 inline-block">
              <h2 className="text-2xl font-bold text-white mb-4">
                Pronto a scoprire Afflyt?
              </h2>
              <p className="text-gray-400 mb-6 max-w-md">
                Se eri un utente DealPilot, accedi con le tue credenziali.
                Se sei nuovo, inizia gratis oggi stesso.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/it/auth/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-afflyt-cyan-400 text-afflyt-dark-100 font-semibold hover:bg-afflyt-cyan-300 transition-colors"
                >
                  Accedi ad Afflyt
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/it"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-afflyt-glass-border text-white hover:bg-afflyt-glass-white transition-colors"
                >
                  Scopri le funzionalità
                </Link>
              </div>
            </GlassCard>
          </div>

        </article>
      </div>
    </LandingLayout>
  );
}
