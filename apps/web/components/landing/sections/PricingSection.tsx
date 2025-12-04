import { LandingSection } from '../LandingSection';
import { AnimatedCard } from '../client/AnimatedCard';
import { BetaSignupForm } from '../client/BetaSignupForm';
import { Check, Rocket } from 'lucide-react';

const betaFeatures = [
  '2 canali Telegram',
  'Deal Score + Analytics completi',
  'Pubblicazione automatica',
  'Copy AI',
  'Supporto diretto con il founder',
];

export function PricingSection() {
  return (
    <LandingSection id="beta-signup" background="gradient">
      {/* H2 + Subtitle - SEO indexed */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-space-grotesk text-white mb-4">
          Entra nella beta, gratis
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Pochi posti, accesso completo. Tu ci dai feedback, noi ti diamo il 50% a vita.
        </p>
      </div>

      {/* Single Beta Card - Centered */}
      <AnimatedCard className="max-w-lg mx-auto">
        <div className="relative rounded-2xl p-8 md:p-10 bg-afflyt-glass-white backdrop-blur-md border border-afflyt-cyan-500/50 shadow-[0_0_60px_rgba(0,229,224,0.15)]">
          {/* Badge - centered on top border with solid bg to mask card border */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-[#0a0a0f] text-afflyt-cyan-400 shadow-lg ring-2 ring-afflyt-cyan-500/50">
              <Rocket className="w-4 h-4" />
              Beta Tester
            </span>
          </div>

          {/* Price - SEO visible */}
          <div className="text-center mb-6 pt-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl md:text-6xl font-bold font-space-grotesk text-white">€0</span>
            </div>
            <p className="text-afflyt-cyan-500 font-medium mt-2">
              durante la beta
            </p>
          </div>

          {/* Features - SEO visible */}
          <div className="mb-8">
            <p className="text-white font-semibold mb-4 text-center">Tutto incluso:</p>
            <ul className="space-y-3">
              {betaFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-afflyt-cyan-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Post-beta note */}
          <div className="mb-8 p-4 rounded-xl bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/20">
            <p className="text-sm text-center">
              <span className="text-white font-medium">Dopo la beta:</span>{' '}
              <span className="text-afflyt-cyan-400 font-semibold">50% di sconto a vita</span>{' '}
              <span className="text-gray-400">sul piano che sceglierai</span>
            </p>
          </div>

          {/* Beta Signup Form */}
          <BetaSignupForm spotsRemaining={7} />
        </div>
      </AnimatedCard>

      {/* Closing reassurance */}
      <p className="text-center text-gray-500 text-sm mt-8 max-w-md mx-auto">
        Nessuna carta di credito richiesta. Cancella quando vuoi.
      </p>
    </LandingSection>
  );
}
