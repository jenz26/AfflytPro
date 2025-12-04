'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTAButtonProps {
  targetId: string;
  children: React.ReactNode;
}

export function CTAButton({ targetId, children }: CTAButtonProps) {
  const handleClick = () => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group relative px-10 py-5 rounded-xl bg-afflyt-cyan-500 hover:bg-afflyt-cyan-400 text-afflyt-dark-900 font-bold text-lg md:text-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(0,229,224,0.4)] hover:shadow-[0_0_60px_rgba(0,229,224,0.6)]"
    >
      {/* Animated glow ring */}
      <span className="absolute inset-0 rounded-xl bg-afflyt-cyan-500/50 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />

      {children}
      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
    </motion.button>
  );
}
