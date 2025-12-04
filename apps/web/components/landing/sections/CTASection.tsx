import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';
import { CTAButton } from '../client/CTAButton';
import { Check, Lock } from 'lucide-react';

const features = [
  '2 canali Telegram',
  'Analytics in tempo reale',
  'Deal Score intelligente',
  'Ottimizzazione automatica',
  'Gratis durante la beta',
  '50% sconto a vita dopo',
];

export function CTASection() {
  return (
    <LandingSection id="cta-finale" background="gradient" className="relative overflow-hidden">
      {/* Gradient background accent */}
      <div className="absolute inset-0 -z-10">
        {/* Radial gradient cyan/purple */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-linear-to-br from-afflyt-cyan-500/20 via-afflyt-purple-500/10 to-transparent rounded-full blur-[120px]" />
        {/* Additional glow */}
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-afflyt-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <AnimatedCard className="text-center max-w-3xl mx-auto">
        {/* H2 - SEO indexed */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-space-grotesk text-white mb-4">
          Smetti di postare a caso
        </h2>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Entra nella beta e scopri cosa funziona davvero sul tuo canale.
        </p>

        {/* Feature recap grid - SEO visible */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-xl mx-auto">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-afflyt-cyan-500 shrink-0" />
              <span className="text-gray-300 text-sm text-left">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button - scrolls to #beta-signup */}
        <div className="mb-6">
          <CTAButton targetId="beta-signup">Richiedi Accesso alla Beta</CTAButton>
        </div>

        {/* Urgency message */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Lock className="w-4 h-4" />
          <span>
            Solo 10 posti disponibili —{' '}
            <span className="text-afflyt-cyan-500 font-semibold">7 rimasti</span>
          </span>
        </div>
      </AnimatedCard>
    </LandingSection>
  );
}
