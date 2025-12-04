import { LandingSection } from '../LandingSection';
import { Send, ExternalLink, Play } from 'lucide-react';

export function DemoSection() {
  return (
    <LandingSection id="demo" background="gradient">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-space-grotesk text-white mb-4">
          Vedi Afflyt in azione
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Non ti chiediamo di fidarti. Ti facciamo vedere.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
        {/* Left Column - Screenshots (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Screenshot Placeholder */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-afflyt-cyan-500/20 to-afflyt-plasma-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative aspect-video bg-afflyt-dark-800 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
              {/* Placeholder content */}
              <div className="text-center">
                <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <span className="text-gray-500 text-sm">Screenshot Dashboard</span>
              </div>
              {/* Decorative grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `linear-gradient(#00E5E0 1px, transparent 1px), linear-gradient(90deg, #00E5E0 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
          </div>

          {/* Secondary Screenshots Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video bg-afflyt-dark-800 rounded-lg flex items-center justify-center border border-white/10">
              <span className="text-gray-600 text-xs">Analytics View</span>
            </div>
            <div className="aspect-video bg-afflyt-dark-800 rounded-lg flex items-center justify-center border border-white/10">
              <span className="text-gray-600 text-xs">Deal Score</span>
            </div>
          </div>
        </div>

        {/* Right Column - Telegram CTA (40%) */}
        <div className="lg:col-span-2">
          <div className="bg-afflyt-dark-800/50 border border-white/10 rounded-2xl p-8">
            {/* Telegram Icon */}
            <div className="w-16 h-16 bg-afflyt-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-afflyt-cyan-400" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold font-space-grotesk text-white mb-3">
              Guarda i post live
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Entra nel canale demo e vedi come Afflyt pubblica le offerte.
              Deal Score, copy ottimizzati, timing perfetto.
            </p>

            {/* Primary CTA */}
            <a
              href="https://t.me/afflyt_demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-afflyt-cyan-500 to-blue-500 hover:from-afflyt-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-afflyt-cyan-500/20 hover:shadow-afflyt-cyan-500/30 hover:scale-[1.02]"
            >
              <Send className="w-5 h-5" />
              Apri Canale Demo
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Secondary Link */}
            <a
              href="https://t.me/afflyt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 hover:text-afflyt-cyan-400 transition-colors"
            >
              Canale Updates
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
