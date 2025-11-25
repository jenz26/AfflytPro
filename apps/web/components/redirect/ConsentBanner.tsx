'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';

interface ConsentBannerProps {
  isVisible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentBanner = ({
  isVisible,
  onAccept,
  onDecline,
}: ConsentBannerProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-afflyt-dark-50/95 backdrop-blur-lg border-t border-afflyt-cyan-500/20 p-4 shadow-[0_-4px_20px_rgba(0,229,224,0.1)]">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 flex-col sm:flex-row">
              {/* Left: Icon + Message */}
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-afflyt-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-afflyt-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Vuoi il redirect automatico la prossima volta?
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Salta l'attesa e vai direttamente su Amazon
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={onDecline}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  No, chiedi sempre
                </button>
                <CyberButton variant="primary" size="sm" onClick={onAccept}>
                  Sì, attiva
                </CyberButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
