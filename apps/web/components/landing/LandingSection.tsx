'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LandingSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function LandingSection({ children, className = '', id }: LandingSectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className={`px-4 py-16 md:py-24 max-w-6xl mx-auto ${className}`}
    >
      {children}
    </motion.section>
  );
}
