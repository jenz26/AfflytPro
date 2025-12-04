'use client';

import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { useAmazonImport } from '@/hooks/useAmazonImport';
import { ImportModal } from './ImportModal';
import { differenceInDays } from 'date-fns';

export function ImportBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { hasImported, lastImport, openModal, isModalOpen, closeModal } = useAmazonImport();

  // Non mostrare se dismissato
  if (dismissed) return null;

  // Non mostrare se ha importato negli ultimi 30 giorni
  if (hasImported && lastImport) {
    const daysSinceImport = differenceInDays(new Date(), new Date(lastImport.createdAt));
    if (daysSinceImport < 30) return null;
  }

  return (
    <>
      <div className="relative rounded-lg border border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-orange-500/10 p-4 mb-6">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 hover:bg-afflyt-glass-white rounded transition-colors text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-12 w-12 rounded-full bg-orange-500/20 items-center justify-center text-2xl">
            💡
          </div>

          <div className="flex-1">
            <p className="font-medium text-white">Migliora i tuoi analytics</p>
            <p className="text-sm text-gray-400">
              Importa i tuoi report Amazon Associates per sbloccare CVR reali, revenue tracking e
              ottimizzazione automatica.
            </p>
          </div>

          <CyberButton onClick={openModal} variant="primary" className="flex-shrink-0">
            Importa Report
            <ArrowRight className="ml-2 h-4 w-4" />
          </CyberButton>
        </div>
      </div>

      <ImportModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}

export default ImportBanner;
