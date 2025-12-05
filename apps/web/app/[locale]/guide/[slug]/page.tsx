import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, Calendar, BookOpen } from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAllGuideSlugs, getGuideBySlug, getAllGuides, markdownToHtml } from '@/lib/content';

// Generate static params for all guides
export async function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

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
      modifiedTime: guide.updatedAt || guide.publishedAt,
      authors: [guide.author],
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
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// JSON-LD Schema for the guide
function GuideJsonLd({ guide }: { guide: NonNullable<ReturnType<typeof getGuideBySlug>> }) {
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    image: 'https://afflyt.io/og-image.png',
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt || guide.publishedAt,
    author: {
      '@type': 'Organization',
      name: guide.author,
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
      '@id': `https://afflyt.io/it/guide/${guide.slug}`,
    },
    keywords: guide.keywords.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
    />
  );
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  // Convert markdown to HTML
  const htmlContent = markdownToHtml(guide.content);

  // Get related guides (exclude current, max 2)
  const allGuides = getAllGuides();
  const relatedGuides = allGuides
    .filter((g) => g.slug !== slug)
    .slice(0, 2);

  return (
    <LandingLayout>
      {/* JSON-LD Schema */}
      <GuideJsonLd guide={guide} />

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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {guide.title}
            </h1>
            <p className="text-xl text-gray-400">
              {guide.description}
            </p>
          </header>

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none mb-16"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* CTA Box */}
          <GlassCard className="p-8 mb-16 bg-linear-to-br from-afflyt-cyan-400/10 to-afflyt-purple-400/10 text-center">
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
                  <Link key={related.slug} href={`/it/guide/${related.slug}`} className="group">
                    <GlassCard className="p-6 h-full hover:border-afflyt-cyan-400/50 transition-all">
                      <span className="text-sm text-afflyt-cyan-400 mb-2 block">
                        {related.category}
                      </span>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-afflyt-cyan-400 transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                        {related.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium text-sm">
                        Leggi la guida
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </LandingLayout>
  );
}
