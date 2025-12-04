import { LandingSection } from '../LandingSection';
import { LandingAccordion } from '../client/LandingAccordion';
import { AnimatedCard } from '../client/AnimatedCard';

const faqs = [
  {
    question: 'È davvero gratis?',
    answer:
      'Sì. Durante la beta hai accesso completo senza pagare nulla. In cambio chiediamo feedback per migliorare la piattaforma. Quando lanceremo i piani a pagamento, i beta tester avranno 50% di sconto a vita.',
  },
  {
    question: 'Devo installare qualcosa?',
    answer:
      'No. Afflyt è 100% cloud. Niente bot da scaricare, niente VPS, niente PC acceso 24/7. Ti registri, colleghi il canale, e sei operativo in 5 minuti.',
  },
  {
    question: 'Funziona con il mio account Amazon Associates?',
    answer:
      'Sì. Usi il tuo tag affiliato, le commissioni vanno direttamente a te. Afflyt non tocca i tuoi guadagni.',
  },
  {
    question: 'È sicuro per il mio account Amazon?',
    answer:
      'Sì. Usiamo solo API ufficiali (Amazon PA-API, Keepa). Niente scraping aggressivo, niente rischi per il tuo account.',
  },
  {
    question: 'Come è diverso da ProfitBot / DealsBot / altri bot?',
    answer:
      'I bot tradizionali filtrano per sconto e pubblicano tutto. Afflyt analizza quali offerte convertono sul TUO canale e migliora nel tempo. Meno spam, più revenue.',
  },
  {
    question: 'Posso usarlo se ho già un bot?',
    answer:
      'Sì. Puoi usare Afflyt in parallelo e confrontare i risultati. Molti beta tester lo fanno per vedere la differenza.',
  },
  {
    question: 'Quanto dura la beta?',
    answer:
      'Prevediamo 2-3 mesi. Ti avviseremo con largo anticipo prima di passare ai piani a pagamento.',
  },
];

export function FAQSection() {
  return (
    <LandingSection id="faq" background="dark">
      {/* H2 + Subtitle - SEO indexed */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-space-grotesk text-white mb-4">
          Domande frequenti
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Tutto quello che devi sapere prima di iniziare.
        </p>
      </div>

      {/* Accordion - max-width for readability, centered */}
      <AnimatedCard className="max-w-3xl mx-auto">
        <LandingAccordion items={faqs} />
      </AnimatedCard>

      {/* Contact fallback */}
      <p className="text-center text-gray-500 text-sm mt-8">
        Non trovi la risposta?{' '}
        <a
          href="mailto:support@afflyt.io"
          className="text-afflyt-cyan-500 hover:text-afflyt-cyan-400 transition-colors"
        >
          Scrivici a support@afflyt.io
        </a>
      </p>
    </LandingSection>
  );
}
