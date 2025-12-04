import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';
import { ShoppingCart, Send, LineChart, Sparkles, CreditCard } from 'lucide-react';

const integrations = [
  {
    icon: ShoppingCart,
    name: 'Amazon',
    description: 'Programma Affiliazione ufficiale',
  },
  {
    icon: Send,
    name: 'Telegram',
    description: 'Bot API sicura',
  },
  {
    icon: LineChart,
    name: 'Keepa',
    description: 'Storico prezzi verificato',
  },
  {
    icon: Sparkles,
    name: 'OpenAI',
    description: 'Copy ottimizzati con AI',
  },
  {
    icon: CreditCard,
    name: 'Stripe',
    description: 'Pagamenti sicuri',
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
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                <integration.icon className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              {/* Name */}
              <span className="text-white font-medium text-sm mb-1">
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
