import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Afflyt Pro - Affiliate Marketing Automation',
    template: '%s | Afflyt Pro',
  },
  description: 'Automate your affiliate marketing with AI-powered deal discovery, multi-channel publishing, and real-time analytics.',
  keywords: ['affiliate marketing', 'amazon associates', 'automation', 'deal finder', 'telegram bot'],
  authors: [{ name: 'Afflyt' }],
  creator: 'Afflyt',
  publisher: 'Afflyt',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'it_IT',
    url: 'https://afflyt.io',
    siteName: 'Afflyt Pro',
    title: 'Afflyt Pro - Affiliate Marketing Automation',
    description: 'Automate your affiliate marketing with AI-powered deal discovery and multi-channel publishing.',
    images: [
      {
        url: '/images/logo-dark-theme.webp',
        width: 1200,
        height: 630,
        alt: 'Afflyt Pro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Afflyt Pro - Affiliate Marketing Automation',
    description: 'Automate your affiliate marketing with AI-powered deal discovery.',
    images: ['/images/logo-dark-theme.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a1a' },
    { media: '(prefers-color-scheme: light)', color: '#22d3ee' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
