import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Clock, BarChart3 } from 'lucide-react';
import { CommandBar } from '@/components/navigation/CommandBar';
import { MarkdownContent } from '@/components/help/MarkdownContent';
import { GlassCard } from '@/components/ui/GlassCard';

interface GuidePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Guide metadata
const guidesMetadata: Record<string, {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  estimatedTime: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzato';
}> = {
  'telegram-bot-setup': {
    title: 'Setup Bot Telegram',
    titleEn: 'Telegram Bot Setup',
    description: 'Guida completa per configurare il tuo bot Telegram e connettere il canale',
    descriptionEn: 'Complete guide to configure your Telegram bot and connect the channel',
    estimatedTime: '5 min',
    difficulty: 'Principiante'
  }
};

export async function generateMetadata({ params }: GuidePageProps) {
  const { locale, slug } = await params;
  const guide = guidesMetadata[slug];

  if (!guide) {
    return {
      title: 'Guide Not Found'
    };
  }

  const title = locale === 'it' ? guide.title : guide.titleEn;
  const description = locale === 'it' ? guide.description : guide.descriptionEn;

  return {
    title: `${title} | Afflyt Pro Help`,
    description,
    openGraph: {
      title: `${title} | Afflyt Pro Help`,
      description,
      type: 'article'
    }
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { locale, slug } = await params;

  // Check if guide exists
  const guide = guidesMetadata[slug];
  if (!guide) {
    notFound();
  }

  // Read markdown file - try locale-specific first, then fallback to default
  let guidePath = path.join(process.cwd(), '..', '..', 'DOCS', 'GUIDES', `${slug}-${locale}.md`);

  let content = '';
  try {
    // Try locale-specific file first (e.g., telegram-bot-setup-en.md)
    content = await fs.readFile(guidePath, 'utf-8');
  } catch (error) {
    // Fallback to default file (e.g., telegram-bot-setup.md)
    try {
      guidePath = path.join(process.cwd(), '..', '..', 'DOCS', 'GUIDES', `${slug}.md`);
      content = await fs.readFile(guidePath, 'utf-8');
    } catch (fallbackError) {
      console.error('Error reading guide:', fallbackError);
      notFound();
    }
  }

  const title = locale === 'it' ? guide.title : guide.titleEn;
  const description = locale === 'it' ? guide.description : guide.descriptionEn;

  return (
    <>
      <CommandBar />
      <div className="min-h-screen bg-afflyt-dark-900 pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Breadcrumbs */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-gray-400 hover:text-afflyt-cyan-400 transition"
                >
                  Dashboard
                </Link>
              </li>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <li>
                <Link
                  href={`/${locale}/help`}
                  className="text-gray-400 hover:text-afflyt-cyan-400 transition"
                >
                  Help Center
                </Link>
              </li>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <li className="text-white font-medium">{title}</li>
            </ol>
          </nav>

          {/* Back Button */}
          <Link
            href={`/${locale}/help`}
            className="inline-flex items-center gap-2 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 mb-6 transition-all hover:gap-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna all'Help Center
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-afflyt-cyan-300 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-afflyt-glass-white border border-afflyt-cyan-500/30 rounded-lg">
                <Clock className="w-4 h-4 text-afflyt-cyan-400" />
                <span className="text-sm text-gray-300">{guide.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-afflyt-glass-white border border-afflyt-profit-500/30 rounded-lg">
                <BarChart3 className="w-4 h-4 text-afflyt-profit-400" />
                <span className="text-sm text-gray-300">{guide.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Guide Content */}
          <GlassCard className="p-8 md:p-12">
            <MarkdownContent content={content} />
          </GlassCard>

          {/* Footer CTA */}
          <div className="mt-8 p-6 bg-gradient-to-r from-afflyt-cyan-500/10 to-afflyt-cyan-600/10 border border-afflyt-cyan-500/30 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Hai bisogno di aiuto?
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Se hai problemi con questa guida, il nostro team è qui per aiutarti
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/help`}
                className="px-4 py-2 bg-afflyt-cyan-500 text-white rounded-lg hover:bg-afflyt-cyan-600 transition font-medium"
              >
                Torna all'Help Center
              </Link>
              <button className="px-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border text-white rounded-lg hover:border-afflyt-cyan-500/50 transition font-medium">
                Contatta il Support
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
