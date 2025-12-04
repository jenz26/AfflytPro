'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';

interface LandingCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function LandingCard({ icon, title, description, delay = 0 }: LandingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <GlassCard className="p-6 h-full">
        {icon && <div className="text-afflyt-cyan-500 mb-4">{icon}</div>}
        <h3 className="font-space-grotesk font-semibold text-lg text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </GlassCard>
    </motion.div>
  );
}
