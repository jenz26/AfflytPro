import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';
import { Link, SlidersHorizontal, TrendingUp, Check } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Link,
    title: 'Collega',
    description: 'Connetti il tuo canale Telegram e il tuo tag Amazon Associates. Zero codice, zero configurazioni server.',
    bullets: [
      'Setup guidato in italiano',
      'Nessun bot da installare',
      'Nessun VPS o PC acceso 24/7',
    ],
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Configura la tua strategia',
    description: 'Scegli le categorie, imposta il Deal Score minimo, definisci gli orari di pubblicazione. Tu decidi la direzione, Afflyt esegue.',
    bullets: [
      'Filtri per categoria, prezzo, sconto reale',
      'Validazione Keepa integrata',
      'Orari personalizzabili per ogni canale',
    ],
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Cresci',
    description: 'Afflyt pubblica le offerte giuste, traccia ogni click, e impara cosa funziona. Ogni giorno il tuo canale diventa più efficace.',
    bullets: [
      'Pubblicazione automatica 24/7',
      'Analytics in tempo reale',
      'Ottimizzazione continua basata sui dati',
    ],
  },
];

export function HowItWorksSection() {
  return (
    <LandingSection id="how-it-works" background="gradient">
      {/* H2 + Subtitle - SEO indexed */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-space-grotesk text-white mb-4">
          Dal setup ai guadagni in 5 minuti
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Non serve essere tecnici. Se sai usare Telegram, sai usare Afflyt.
        </p>
      </div>

      {/* 3 Steps */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12">
        {steps.map((step, index) => (
          <AnimatedCard
            key={step.number}
            delay={index * 0.15}
            className="h-full p-6 lg:p-8 rounded-2xl bg-afflyt-glass-white backdrop-blur-md border border-white/10 hover:border-afflyt-cyan-500/30 transition-colors"
          >
            {/* Number + Icon header */}
            <div className="flex items-start justify-between mb-5">
              {/* Large number */}
              <span className="text-5xl lg:text-6xl font-bold font-space-grotesk text-afflyt-cyan-500/20">
                {step.number}
              </span>
              {/* Icon in circle */}
              <div className="w-12 h-12 rounded-xl bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-afflyt-cyan-500" />
              </div>
            </div>

            {/* Title - SEO visible */}
            <h3 className="text-xl font-semibold text-white mb-3 font-space-grotesk">
              {step.title}
            </h3>

            {/* Description - SEO visible */}
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {step.description}
            </p>

            {/* Bullet points */}
            <ul className="space-y-2">
              {step.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-afflyt-cyan-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">{bullet}</span>
                </li>
              ))}
            </ul>
          </AnimatedCard>
        ))}
      </div>

      {/* Closing statement - same as Solution for memorability */}
      <p className="text-center text-afflyt-cyan-500 font-semibold text-lg md:text-xl">
        Tu imposti la strategia. Afflyt fa tutto il resto.
      </p>
    </LandingSection>
  );
}
