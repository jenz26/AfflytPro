import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { InterstitialRedirect } from '@/components/redirect/InterstitialRedirect';

const prisma = new PrismaClient();

interface RedirectPageProps {
  params: {
    shortCode: string;
  };
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { shortCode } = await params;

  // Fetch link from database
  const link = await prisma.shortLink.findUnique({
    where: { shortCode },
  });

  if (!link) {
    notFound();
  }

  // Check if link has expired
  if (link.expiresAt && link.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-4xl">⏰</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Scaduto</h1>
          <p className="text-gray-400 mb-6">
            Questo deal non è più disponibile
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-afflyt-cyan-500 hover:bg-afflyt-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    );
  }

  // Calculate minutes ago
  const minutesAgo = Math.floor(
    (Date.now() - link.priceCheckedAt.getTime()) / 60000
  );

  // Render interstitial
  return (
    <InterstitialRedirect
      amazonUrl={link.amazonUrl}
      product={{
        title: link.title,
        imageUrl: link.imageUrl,
        currentPrice: link.currentPrice,
        originalPrice: link.originalPrice,
        discount: link.discount,
        asin: link.asin,
      }}
      minutesAgo={minutesAgo}
      shortCode={link.shortCode}
      linkId={link.id}
    />
  );
}

// Optional: Generate metadata for SEO
export async function generateMetadata({ params }: RedirectPageProps) {
  const { shortCode } = await params;

  const link = await prisma.shortLink.findUnique({
    where: { shortCode },
    select: { title: true, currentPrice: true, discount: true },
  });

  if (!link) {
    return {
      title: 'Link non trovato',
    };
  }

  return {
    title: `${link.title} - €${link.currentPrice.toFixed(2)}${link.discount ? ` (-${link.discount}%)` : ''}`,
    description: `Scopri questa offerta su Amazon. Redirect sicuro e verificato.`,
    robots: 'noindex, nofollow', // Non indicizzare le pagine di redirect
  };
}
