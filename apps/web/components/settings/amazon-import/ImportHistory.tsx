'use client';

import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useAmazonImport } from '@/hooks/useAmazonImport';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ImportHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportHistory({ open, onOpenChange }: ImportHistoryProps) {
  const { history, historyLoading, stats } = useAmazonImport();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">📜 Storico Import</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-afflyt-glass-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-afflyt-dark-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-white">Data</th>
                    <th className="text-left p-3 font-medium text-white">File</th>
                    <th className="text-right p-3 font-medium text-white">Righe</th>
                    <th className="text-right p-3 font-medium text-white">Match</th>
                    <th className="text-center p-3 font-medium text-white">Stato</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {history.map((item) => (
                    <tr key={item.id} className="border-t border-afflyt-glass-border">
                      <td className="p-3 text-gray-400">
                        {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: it })}
                      </td>
                      <td className="p-3 truncate max-w-[150px]">{item.fileName}</td>
                      <td className="p-3 text-right">{item.rowsImported}</td>
                      <td className="p-3 text-right">{item.matchedDeals}</td>
                      <td className="p-3 text-center">
                        {item.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-afflyt-profit-400 mx-auto" />
                        )}
                        {item.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                        )}
                        {item.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-afflyt-glass-border p-4 space-y-2 text-sm">
              <p className="font-medium text-white mb-3">📊 Totali</p>
              <p className="flex justify-between">
                <span className="text-gray-400">Import totali:</span>
                <span className="text-white">{history.length}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Ordini importati:</span>
                <span className="text-white">{stats?.totalOrders || 0}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Revenue tracciata:</span>
                <span className="text-white">€{stats?.totalRevenue?.toFixed(2) || '0'}</span>
              </p>
            </div>

            <p className="text-xs text-gray-500 text-center">
              💡 Importa regolarmente per analytics più accurati
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Nessun import effettuato</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <CyberButton variant="ghost" onClick={() => onOpenChange(false)}>
            Chiudi
          </CyberButton>
        </div>
      </GlassCard>
    </div>
  );
}

export default ImportHistory;
