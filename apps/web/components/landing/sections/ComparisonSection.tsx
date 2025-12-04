import { LandingSection } from '../LandingSection';
import { LandingTable } from '../LandingTable';
import { AnimatedCard } from '../client/AnimatedCard';

const comparisonRows = [
  {
    aspect: 'Come trova offerte',
    traditional: '"Sconto > 50%"',
    afflyt: 'Deal Score: popolarità + storico prezzo + performance canale',
  },
  {
    aspect: 'Cosa pubblica',
    traditional: 'Tutto quello che passa i filtri',
    afflyt: 'Solo offerte con alto potenziale per il TUO pubblico',
  },
  {
    aspect: 'Analytics',
    traditional: 'Report Amazon dopo 48h',
    afflyt: 'Dashboard real-time: click, orari, categorie, conversioni',
  },
  {
    aspect: 'Impara dal canale?',
    traditional: 'No, stesse regole per sempre',
    afflyt: 'Sì, ottimizza automaticamente nel tempo',
  },
  {
    aspect: 'A/B Testing',
    traditional: 'Manuale (se ti ricordi)',
    afflyt: 'Automatico su copy, orari, categorie',
  },
  {
    aspect: 'Sai cosa funziona?',
    traditional: 'Vai a occhio',
    afflyt: 'Dati per singola offerta',
  },
];

export function ComparisonSection() {
  return (
    <LandingSection id="comparison" background="dark">
      {/* H2 + Subtitle - SEO indexed */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-space-grotesk text-white mb-4">
          Perché Afflyt è diverso
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          I bot tradizionali filtrano per sconto. Afflyt pensa.
        </p>
      </div>

      {/* Table - wrapped in AnimatedCard for fade-in */}
      <AnimatedCard className="max-w-5xl mx-auto mb-10">
        <LandingTable rows={comparisonRows} />
      </AnimatedCard>

      {/* Closing statement */}
      <p className="text-center text-lg md:text-xl max-w-3xl mx-auto">
        <span className="text-white font-medium">Il risultato?</span>{' '}
        <span className="text-gray-400">
          Meno offerte, più conversioni. Il tuo canale smette di sembrare spam e inizia a generare revenue.
        </span>
      </p>
    </LandingSection>
  );
}
