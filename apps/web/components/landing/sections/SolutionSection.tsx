import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';
import { Crosshair, BarChart3, RefreshCw } from 'lucide-react';

const pillars = [
  {
    icon: Crosshair,
    title: 'Deal Score Intelligente',
    description: 'Ogni offerta riceve un punteggio basato su: popolarità prodotto, storico prezzo, categoria, e performance sul TUO canale. Non "sconto > 50%". Ma "questo prodotto, a questo prezzo, per questo pubblico, converte."',
  },
  {
    icon: BarChart3,
    title: 'Analytics che Amazon non ti dà',
    description: 'Sai esattamente: quale post ha generato click, a che ora il tuo pubblico compra, quali categorie convertono, quali prodotti fanno solo curiosi. In tempo reale. Non dopo 48 ore.',
  },
  {
    icon: RefreshCw,
    title: 'Ottimizzazione Continua',
    description: 'Afflyt impara. Testa orari diversi, copy diversi, categorie diverse. Misura. Adatta. Più pubblichi, più diventa preciso. Il tuo canale migliora mentre dormi.',
  },
];

export function SolutionSection() {
  return (
    <LandingSection id="solution" background="gradient">
      {/* H2 + Subtitle - SEO indexed */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-space-grotesk text-white mb-4">
          Non automatizza. Decide.
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Afflyt non è un bot che spara offerte. È un sistema che analizza, sceglie e migliora — ogni giorno.
        </p>
      </div>

      {/* 3 Pillars - content is server rendered for SEO */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {pillars.map((pillar, index) => (
          <AnimatedCard
            key={pillar.title}
            delay={index * 0.1}
            className="h-full p-6 lg:p-8 rounded-2xl bg-afflyt-glass-white backdrop-blur-md border border-white/10 hover:border-afflyt-cyan-500/30 transition-colors"
          >
            {/* Icon - CYAN for positive/solution */}
            <pillar.icon className="w-10 h-10 text-afflyt-cyan-500 mb-5" />

            {/* Title - SEO visible */}
            <h3 className="text-xl font-semibold text-white mb-3 font-space-grotesk">
              {pillar.title}
            </h3>

            {/* Description - SEO visible */}
            <p className="text-gray-400 text-sm leading-relaxed">
              {pillar.description}
            </p>
          </AnimatedCard>
        ))}
      </div>

      {/* Closing statement - payoff */}
      <p className="text-center text-afflyt-cyan-500 font-semibold text-lg md:text-xl">
        Tu imposti la strategia. Afflyt fa tutto il resto.
      </p>
    </LandingSection>
  );
}
