import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, Calendar, BookOpen } from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { GlassCard } from '@/components/ui/GlassCard';

// Guide content type
interface GuideContent {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  publishedAt: string;
  content: string; // HTML content (will be markdown converted)
  keywords: string[];
}

// Static guide data - Replace with CMS/MDX in production
const guidesData: Record<string, GuideContent> = {
  'automatizzare-canale-telegram-affiliate': {
    slug: 'automatizzare-canale-telegram-affiliate',
    title: 'Come automatizzare un canale Telegram Affiliate',
    description: 'Guida completa per creare e automatizzare un canale Telegram di offerte Amazon. Dalla creazione del bot alla pubblicazione automatica dei deal.',
    readTime: '12 min',
    category: 'Automazione',
    publishedAt: '2024-12-01',
    keywords: ['telegram affiliate', 'bot telegram amazon', 'automatizzare telegram', 'canale offerte'],
    content: `
      <p class="text-xl text-gray-300 mb-8">
        Questa guida sarà disponibile a breve. Stiamo preparando contenuti di alta qualità per aiutarti a massimizzare i tuoi guadagni come affiliate.
      </p>
      <div class="bg-afflyt-cyan-400/10 border border-afflyt-cyan-400/20 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-white mb-2">Cosa imparerai in questa guida:</h3>
        <ul class="space-y-2 text-gray-300">
          <li>• Come creare un bot Telegram per il tuo canale</li>
          <li>• Configurare la pubblicazione automatica dei deal</li>
          <li>• Ottimizzare i tempi di pubblicazione</li>
          <li>• Tracking delle conversioni e analytics</li>
        </ul>
      </div>
      <p class="text-gray-400">
        Nel frattempo, puoi iniziare a esplorare Afflyt e provare le nostre automazioni in prima persona.
      </p>
    `,
  },
  'scegliere-prodotti-migliori-automazione': {
    slug: 'scegliere-prodotti-migliori-automazione',
    title: 'Come scegliere i prodotti migliori usando l\'automazione',
    description: 'Scopri come utilizzare il Deal Score e l\'automazione per selezionare solo i prodotti che convertono meglio per il tuo pubblico.',
    readTime: '10 min',
    category: 'Strategia',
    publishedAt: '2024-12-01',
    keywords: ['prodotti amazon affiliate', 'deal score', 'migliori offerte', 'selezione prodotti'],
    content: `
      <p class="text-xl text-gray-300 mb-8">
        Questa guida sarà disponibile a breve. Stiamo preparando contenuti di alta qualità per aiutarti a selezionare i prodotti più profittevoli.
      </p>
      <div class="bg-afflyt-cyan-400/10 border border-afflyt-cyan-400/20 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-white mb-2">Cosa imparerai in questa guida:</h3>
        <ul class="space-y-2 text-gray-300">
          <li>• Come funziona il Deal Score di Afflyt</li>
          <li>• Criteri per selezionare prodotti vincenti</li>
          <li>• Analisi dei dati storici per previsioni</li>
          <li>• Automazione della selezione prodotti</li>
        </ul>
      </div>
      <p class="text-gray-400">
        Nel frattempo, puoi iniziare a esplorare Afflyt e provare le nostre automazioni in prima persona.
      </p>
    `,
  },
};

// Generate static params for known guides
export async function generateStaticParams() {
  return Object.keys(guidesData).map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guidesData[slug];

  if (!guide) {
    return {
      title: 'Guida non trovata - Afflyt',
    };
  }

  return {
    title: `${guide.title} | Afflyt Guide`,
    description: guide.description,
    keywords: guide.keywords,
    alternates: {
      canonical: `https://afflyt.io/it/guide/${guide.slug}`,
      languages: {
        'it': `https://afflyt.io/it/guide/${guide.slug}`,
        'x-default': `https://afflyt.io/it/guide/${guide.slug}`,
      },
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      locale: 'it_IT',
      siteName: 'Afflyt',
      url: `https://afflyt.io/it/guide/${guide.slug}`,
      publishedTime: guide.publishedAt,
      authors: ['Afflyt Team'],
      images: [
        {
          url: 'https://afflyt.io/og-image.png',
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
      images: ['https://afflyt.io/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const guide = guidesData[slug];

  if (!guide) {
    notFound();
  }

  // Get related guides (exclude current)
  const relatedGuides = Object.values(guidesData)
    .filter((g) => g.slug !== slug)
    .slice(0, 2);

  return (
    <LandingLayout>
      <div className="min-h-screen bg-afflyt-dark-100">
        <article className="max-w-4xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link
              href="/it/guide"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna alle guide
            </Link>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="px-3 py-1 rounded-full bg-afflyt-cyan-400/10 text-afflyt-cyan-400">
                {guide.category}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {guide.readTime} di lettura
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(guide.publishedAt).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {guide.title}
            </h1>
            <p className="text-xl text-gray-400">
              {guide.description}
            </p>
          </header>

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none mb-16"
            dangerouslySetInnerHTML={{ __html: guide.content }}
          />

          {/* CTA Box */}
          <GlassCard className="p-8 mb-16 bg-gradient-to-br from-afflyt-cyan-400/10 to-afflyt-purple-400/10 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Pronto a mettere in pratica?
            </h2>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              Afflyt automatizza tutto il processo per te. Inizia gratis e scopri quanto tempo puoi risparmiare.
            </p>
            <Link
              href="/it/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-afflyt-cyan-400 text-afflyt-dark-100 font-semibold hover:bg-afflyt-cyan-300 transition-colors"
            >
              Prova Afflyt Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassCard>

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-afflyt-cyan-400" />
                Guide correlate
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedGuides.map((related) => (
                  <GlassCard
                    key={related.slug}
                    className="p-6 hover:border-afflyt-cyan-400/50 transition-all group"
                  >
                    <span className="text-sm text-afflyt-cyan-400 mb-2 block">
                      {related.category}
                    </span>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-afflyt-cyan-400 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {related.description}
                    </p>
                    <Link
                      href={`/it/guide/${related.slug}`}
                      className="inline-flex items-center gap-2 text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium text-sm"
                    >
                      Leggi la guida
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </LandingLayout>
  );
}
