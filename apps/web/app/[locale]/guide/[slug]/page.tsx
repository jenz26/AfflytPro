import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  BookOpen,
  Sparkles,
  CheckCircle2,
  User
} from 'lucide-react';
import { LandingLayout } from '@/components/landing/LandingLayout';
import { ShareButton } from '@/components/guides/ShareButton';
import { MDXContent } from '@/components/guides/MDXContent';
import { getAllGuideSlugs, getGuideBySlug, getAllGuides, markdownToHtml, serializeMdx } from '@/lib/content';

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

// Category icon mapping
function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    'Automazione': <Sparkles className="h-5 w-5" />,
    'Analytics': <CheckCircle2 className="h-5 w-5" />,
    'Strategia': <BookOpen className="h-5 w-5" />,
  };
  return icons[category] || <BookOpen className="h-5 w-5" />;
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

  // Convert content based on file type
  const mdxSource = guide.isMdx ? await serializeMdx(guide.content) : null;
  const htmlContent = !guide.isMdx ? markdownToHtml(guide.content) : null;

  // Get related guides (same category first, then others)
  const allGuides = getAllGuides();
  const relatedGuides = allGuides
    .filter((g) => g.slug !== slug)
    .sort((a, b) => {
      if (a.category === guide.category && b.category !== guide.category) return -1;
      if (b.category === guide.category && a.category !== guide.category) return 1;
      return 0;
    })
    .slice(0, 3);

  const formattedDate = new Date(guide.publishedAt).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LandingLayout>
      <GuideJsonLd guide={guide} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-afflyt-dark-200 via-afflyt-dark-100 to-afflyt-dark-100">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-afflyt-cyan-400/5 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-afflyt-plasma-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-16">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/it" className="hover:text-gray-300 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/it/guide" className="hover:text-gray-300 transition-colors">
                Guide
              </Link>
              <span>/</span>
              <span className="text-gray-400 truncate max-w-[200px]">{guide.title}</span>
            </div>
          </nav>

          {/* Category Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-afflyt-cyan-400/10 border border-afflyt-cyan-400/20 text-afflyt-cyan-400 text-sm font-medium mb-6">
            {getCategoryIcon(guide.category)}
            {guide.category}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {guide.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-400 mb-8 max-w-3xl leading-relaxed">
            {guide.description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{guide.author}</p>
                <p className="text-gray-500 text-xs">Team Afflyt</p>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-700" />

            {/* Date */}
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>

            {/* Read time */}
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{guide.readTime} di lettura</span>
            </div>

            {/* Share button */}
            <ShareButton title={guide.title} />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-afflyt-dark-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Article Content */}
          <article
            className="prose prose-lg max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-afflyt-cyan-400/20
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-afflyt-cyan-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-afflyt-cyan-400 prose-code:bg-afflyt-cyan-400/10 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-afflyt-dark-50 prose-pre:border prose-pre:border-afflyt-cyan-400/20 prose-pre:rounded-xl prose-pre:p-6
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:text-gray-300 prose-li:mb-2 marker:prose-li:text-afflyt-cyan-400
              prose-table:text-sm
              prose-thead:border-b-2 prose-thead:border-afflyt-cyan-400/30
              prose-th:text-white prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:text-left
              prose-td:text-gray-300 prose-td:py-3 prose-td:px-4 prose-td:border-b prose-td:border-gray-700/50
              prose-blockquote:border-l-4 prose-blockquote:border-afflyt-cyan-400 prose-blockquote:bg-afflyt-cyan-400/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-300
              prose-hr:border-gray-700 prose-hr:my-12
              prose-img:rounded-xl prose-img:shadow-2xl
            "
          >
            {mdxSource ? (
              <MDXContent source={mdxSource} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
            )}
          </article>

          {/* Tags */}
          {guide.keywords.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Argomenti trattati</h3>
              <div className="flex flex-wrap gap-2">
                {guide.keywords.slice(0, 8).map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA Box */}
          <div className="mt-16 relative overflow-hidden rounded-2xl bg-gradient-to-br from-afflyt-cyan-400/20 via-afflyt-dark-50 to-afflyt-plasma-500/20 p-8 md:p-12">
            <div className="absolute inset-0 bg-afflyt-dark-50/80" />
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Pronto a mettere in pratica?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                Afflyt automatizza tutto il processo per te. Inizia gratis e scopri quanto tempo puoi risparmiare.
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
                  href="/it/guide"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                >
                  <BookOpen className="h-5 w-5" />
                  Altre Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Guides Section */}
      {relatedGuides.length > 0 && (
        <div className="bg-afflyt-dark-200 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Continua a imparare
                </h2>
                <p className="text-gray-400">
                  Guide correlate che potrebbero interessarti
                </p>
              </div>
              <Link
                href="/it/guide"
                className="hidden sm:inline-flex items-center gap-2 text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium transition-colors"
              >
                Tutte le guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={`/it/guide/${related.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-afflyt-dark-50 border border-gray-800 hover:border-afflyt-cyan-400/50 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-400/0 to-afflyt-plasma-500/0 group-hover:from-afflyt-cyan-400/5 group-hover:to-afflyt-plasma-500/5 transition-all duration-300" />

                  <div className="relative p-6">
                    {/* Category */}
                    <div className="flex items-center gap-2 text-afflyt-cyan-400 text-sm font-medium mb-4">
                      {getCategoryIcon(related.category)}
                      {related.category}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-afflyt-cyan-400 transition-colors line-clamp-2">
                      {related.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {related.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {related.readTime}
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

            {/* Mobile link */}
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/it/guide"
                className="inline-flex items-center gap-2 text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
              >
                Tutte le guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Back to top */}
      <div className="bg-afflyt-dark-100 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/it/guide"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alle guide
          </Link>
        </div>
      </div>
    </LandingLayout>
  );
}
