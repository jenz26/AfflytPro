import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';
import { Skull, Dices, BarChart3 } from 'lucide-react';

const problems = [
  {
    icon: Skull,
    title: 'Sconti alti ≠ Vendite',
    description: 'Un prodotto cinese al 70% genera curiosità. Un Bimby al 18% genera commissioni. Il problema non è trovare sconti. È trovare lo sconto giusto sul prodotto giusto — quello che il tuo pubblico stava già aspettando.',
  },
  {
    icon: Dices,
    title: 'I bot filtrano, non pensano',
    description: 'I bot tradizionali cercano "sconto > 50%" e pubblicano tutto. Nessuna intelligenza. Nessun contesto. Risultato: il tuo canale diventa una slot machine. A volte vinci, quasi sempre perdi.',
  },
  {
    icon: BarChart3,
    title: 'Amazon non ti dice cosa funziona',
    description: 'Il report commissioni arriva dopo 48h. Non sai quale post ha generato la vendita. Non sai a che ora il tuo pubblico compra. Non sai quali categorie rendono. Decidi a occhio. E continui a sbagliare.',
  },
];

export function ProblemSection() {
  return (
    <LandingSection id="problem" background="dark">
      {/* H2 - SEO indexed */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-space-grotesk text-white">
          Il problema che conosci bene
        </h2>
      </div>

      {/* Problem cards - content is server rendered for SEO */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {problems.map((problem, index) => (
          <AnimatedCard
            key={problem.title}
            delay={index * 0.1}
            className="h-full p-6 lg:p-8 rounded-2xl bg-afflyt-glass-white backdrop-blur-md border border-white/10 hover:border-red-500/30 transition-colors"
          >
            {/* Icon */}
            <problem.icon className="w-10 h-10 text-red-400 mb-5" />

            {/* Title - SEO visible */}
            <h3 className="text-xl font-semibold text-white mb-3 font-space-grotesk">
              {problem.title}
            </h3>

            {/* Description - SEO visible, longer text needs good line-height */}
            <p className="text-gray-400 text-sm leading-relaxed">
              {problem.description}
            </p>
          </AnimatedCard>
        ))}
      </div>
    </LandingSection>
  );
}
