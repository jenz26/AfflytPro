'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  question: string;
  answer: string;
}

interface LandingAccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

/**
 * LandingAccordion - FAQ accordion for landing pages
 */
export function LandingAccordion({
  items,
  className,
  allowMultiple = false,
}: LandingAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleIndex = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              'rounded-xl overflow-hidden',
              'bg-afflyt-glass-white backdrop-blur-md',
              'border transition-colors duration-300',
              isOpen
                ? 'border-afflyt-cyan-500/30'
                : 'border-white/10 hover:border-white/20'
            )}
          >
            {/* Question Button */}
            <button
              onClick={() => toggleIndex(index)}
              className={cn(
                'w-full flex items-center justify-between',
                'px-6 py-5 text-left',
                'transition-colors duration-300',
                isOpen ? 'bg-afflyt-cyan-500/5' : 'hover:bg-white/[0.02]'
              )}
            >
              <span className="text-white font-medium pr-4">{item.question}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    isOpen ? 'text-afflyt-cyan-400' : 'text-gray-400'
                  )}
                />
              </motion.div>
            </button>

            {/* Answer */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 leading-relaxed">{item.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
