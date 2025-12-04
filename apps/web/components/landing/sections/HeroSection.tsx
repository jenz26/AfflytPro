import { LandingSection } from '../LandingSection';
import { LandingBadge } from '../LandingBadge';
import { HeroContent } from '../client/HeroContent';

export function HeroSection() {
  return (
    <LandingSection id="hero" className="pt-24 md:pt-32 lg:pt-40 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Cyan blob - top right */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-afflyt-cyan-500/20 rounded-full blur-[120px]" />
        {/* Purple blob - bottom left */}
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-afflyt-plasma-500/15 rounded-full blur-[100px]" />
      </div>

      <div className="text-center max-w-4xl mx-auto relative">
        {/* Badge - SEO visible */}
        <div className="mb-6">
          <LandingBadge>Beta Privata — Posti Limitati</LandingBadge>
        </div>

        {/* H1 - SEO critical, server rendered */}
        <h1 className="font-space-grotesk text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
          Il copilota AI per affiliate creator su Telegram
        </h1>

        {/* Main paragraph - SEO visible */}
        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Smetti di postare a caso. Afflyt monitora migliaia di offerte, seleziona quelle giuste per il tuo pubblico, e pubblica nel momento perfetto.
        </p>

        {/* Feature list - SEO visible, inline style */}
        <p className="mt-4 text-afflyt-cyan-500 font-semibold tracking-wide">
          Deal Score · Analytics granulari · Copy AI · Ottimizzazione continua
        </p>

        {/* Client component - buttons and trust bar with animations */}
        <HeroContent />
      </div>
    </LandingSection>
  );
}
