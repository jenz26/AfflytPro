/**
 * JSON-LD Schema Component for SEO
 *
 * Includes:
 * - Organization schema
 * - SoftwareApplication schema
 */

export function JsonLdSchema() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Afflyt',
    url: 'https://afflyt.io',
    logo: 'https://afflyt.io/logo.png',
    description: 'Piattaforma di automazione per affiliate marketing Amazon. Trova deal automaticamente, pubblica su Telegram e traccia le conversioni.',
    foundingDate: '2024',
    sameAs: [
      'https://t.me/afflyt_community'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@afflyt.io',
      availableLanguage: ['Italian', 'English']
    }
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Afflyt Pro',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Affiliate Marketing Automation',
    operatingSystem: 'Web',
    description: 'Automatizza il tuo business di affiliate marketing Amazon. Trova deal, pubblica automaticamente e traccia le conversioni.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Piano beta gratuito con accesso completo',
      availability: 'https://schema.org/InStock'
    },
    featureList: [
      'Ricerca automatica deal Amazon',
      'Pubblicazione automatica su Telegram',
      'Tracking click e conversioni',
      'Dashboard analytics avanzata',
      'Deal scoring intelligente'
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '50',
      bestRating: '5',
      worstRating: '1'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}

export default JsonLdSchema;
