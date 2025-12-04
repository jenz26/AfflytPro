import Image from 'next/image';
import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';

const integrations = [
  {
    logo: '/logos/amazon.svg',
    name: 'Amazon',
    description: 'Programma Affiliazione ufficiale',
    invert: true,
  },
  {
    logo: '/logos/telegram.svg',
    name: 'Telegram',
    description: 'Bot API sicura',
    invert: false, // già colorato
  },
  {
    logo: '/logos/keepa.svg',
    name: 'Keepa',
    description: 'Storico prezzi verificato',
    invert: false, // ha icona colorata con croce bianca
  },
  {
    logo: '/logos/openai.svg',
    name: 'OpenAI',
    description: 'Copy ottimizzati con AI',
    invert: true,
  },
  {
    logo: '/logos/stripe.svg',
    name: 'Stripe',
    description: 'Pagamenti sicuri',
    invert: false, // viola originale
  },
];

export function TrustSection() {
  return (
    <LandingSection id="trust" background="dark" className="py-12 md:py-16">
      {/* H2 + Subtitle - SEO indexed */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold font-space-grotesk text-white mb-3">
          Costruito su piattaforme che conosci
        </h2>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Afflyt si integra con i servizi che usi già. Nessun rischio, nessuna configurazione esotica.
        </p>
      </div>

      {/* 5 Integration logos */}
      <AnimatedCard className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex flex-col items-center text-center group"
            >
              {/* Logo */}
              <Image
                src={integration.logo}
                alt={integration.name}
                width={120}
                height={60}
                className={`h-12 w-auto mb-4 opacity-70 group-hover:opacity-100 transition-opacity ${
                  integration.invert ? 'brightness-0 invert' : ''
                }`}
              />
              {/* Name */}
              <span className="text-white font-medium text-base mb-1">
                {integration.name}
              </span>
              {/* Description */}
              <span className="text-gray-500 text-xs">
                {integration.description}
              </span>
            </div>
          ))}
        </div>
      </AnimatedCard>

      {/* Closing statement - reassurance */}
      <p className="text-center text-gray-400 text-sm max-w-2xl mx-auto">
        Tutte le integrazioni usano API ufficiali. I tuoi dati restano tuoi. Il tuo account Amazon è al sicuro.
      </p>
    </LandingSection>
  );
}
