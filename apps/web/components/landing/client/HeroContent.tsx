'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

export function HeroContent() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-10"
    >
      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Primary CTA */}
        <motion.button
          onClick={() => scrollToSection('beta-signup')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-afflyt-cyan-500 hover:bg-afflyt-cyan-400 text-black font-semibold text-lg transition-colors"
        >
          Richiedi Accesso alla Beta
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Secondary CTA */}
        <motion.button
          onClick={() => scrollToSection('how-it-works')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-lg border border-white/20 transition-colors"
        >
          <Play className="w-5 h-5" />
          Vedi come funziona
        </motion.button>
      </div>

      {/* Trust bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-gray-500 text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          Setup in 5 minuti
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          Gratis durante la beta
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          Supporto italiano
        </span>
      </motion.div>
    </motion.div>
  );
}
