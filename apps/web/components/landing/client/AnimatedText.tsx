'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export function AnimatedText({
  children,
  className = '',
  delay = 0,
  as: Component = 'div'
}: AnimatedTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <Component className={className}>{children}</Component>
    </motion.div>
  );
}
