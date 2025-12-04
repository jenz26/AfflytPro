'use client';

import { useState } from 'react';
import { Upload, History, Package, DollarSign, Target, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useAmazonImport } from '@/hooks/useAmazonImport';
import { ImportModal } from './ImportModal';
import { ImportHistory } from './ImportHistory';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export function ImportSection() {
  const { openModal, stats, lastImport, hasImported, statsLoading, isModalOpen, closeModal } =
    useAmazonImport();

  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📊 Sincronizza Report Amazon
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Importa i tuoi dati per analytics avanzati
            </p>
          </div>
        </div>

        {hasImported ? (
          // Stato: ha già importato
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-afflyt-dark-50 border border-afflyt-glass-border">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {statsLoading ? '-' : stats?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-gray-400">Ordini</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-afflyt-dark-50 border border-afflyt-glass-border">
                <div className="w-10 h-10 bg-afflyt-profit-400/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-afflyt-profit-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-afflyt-profit-400">
                    €{statsLoading ? '-' : stats?.totalCommission?.toFixed(2) || '0'}
                  </p>
                  <p className="text-xs text-gray-400">Commissioni</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-afflyt-dark-50 border border-afflyt-glass-border">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {statsLoading ? '-' : `${stats?.conversionRate?.toFixed(1) || '0'}%`}
                  </p>
                  <p className="text-xs text-gray-400">CVR</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-afflyt-dark-50 border border-afflyt-glass-border">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {lastImport?.createdAt
                      ? formatDistanceToNow(new Date(lastImport.createdAt), {
                          addSuffix: true,
                          locale: it,
                        })
                      : 'Mai'}
                  </p>
                  <p className="text-xs text-gray-400">Ultimo import</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <CyberButton onClick={openModal} variant="primary">
                <Upload className="mr-2 h-4 w-4" />
                Importa Report CSV
              </CyberButton>
              <CyberButton variant="ghost" onClick={() => setHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                Storico Import
              </CyberButton>
            </div>
          </div>
        ) : (
          // Stato: mai importato
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-3xl">
              📊
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Importa i tuoi report Amazon Associates per
                <br />
                sbloccare analytics avanzati e ottimizzazione AI
              </p>

              <ul className="text-sm text-left max-w-xs mx-auto space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-afflyt-profit-400">✓</span>
                  <span className="text-gray-300">Vedi quali deal convertono meglio</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-afflyt-profit-400">✓</span>
                  <span className="text-gray-300">Calcola CVR e revenue reali</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-afflyt-profit-400">✓</span>
                  <span className="text-gray-300">Ottimizza automaticamente lo scoring</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-gray-500">Ultimo import: Mai</p>

            <CyberButton onClick={openModal} variant="primary">
              <Upload className="mr-2 h-4 w-4" />
              Importa Report CSV
            </CyberButton>
          </div>
        )}
      </GlassCard>

      <ImportModal isOpen={isModalOpen} onClose={closeModal} />
      <ImportHistory open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}

export default ImportSection;
