'use client';

import { X, ArrowLeft, ArrowRight, Upload, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { FileDropzone } from './FileDropzone';
import { FileRow } from './FileRow';
import { useAmazonImport } from '@/hooks/useAmazonImport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const {
    currentStep,
    setCurrentStep,
    files,
    addFiles,
    removeFile,
    startImport,
    readyFilesCount,
    isUploading,
    aggregateResults,
    stats,
    clearFiles,
  } = useAmazonImport();

  if (!isOpen) return null;

  const handleClose = () => {
    clearFiles();
    setCurrentStep('instructions');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {currentStep === 'instructions' && '📥 Importa Report Amazon Associates'}
            {currentStep === 'upload' && '📁 Carica i file CSV'}
            {currentStep === 'processing' && '⏳ Importazione in corso...'}
            {currentStep === 'results' && '✅ Importazione completata!'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Instructions */}
        {currentStep === 'instructions' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-white">📋 Come scaricare i report</h4>

              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="font-medium text-white">1.</span>
                  <span>
                    Vai su{' '}
                    <a
                      href="https://affiliate-program.amazon.it/home/reports"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline inline-flex items-center gap-1"
                    >
                      Amazon Associates Reports
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-white">2.</span>
                  <span>Seleziona il periodo (consigliamo ultimi 12 mesi)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-white">3.</span>
                  <span>Scarica questi report come CSV:</span>
                </li>
              </ol>

              <div className="rounded-lg border border-afflyt-glass-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-afflyt-dark-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-white">Report</th>
                      <th className="text-left p-3 font-medium text-white">Contenuto</th>
                      <th className="text-left p-3 font-medium text-white">Priorità</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-t border-afflyt-glass-border">
                      <td className="p-3">📦 Fee-Orders</td>
                      <td className="p-3 text-gray-400">Ordini</td>
                      <td className="p-3">
                        <span className="text-yellow-400">⭐ Critico</span>
                      </td>
                    </tr>
                    <tr className="border-t border-afflyt-glass-border">
                      <td className="p-3">💰 Fee-Earnings</td>
                      <td className="p-3 text-gray-400">Guadagni</td>
                      <td className="p-3">
                        <span className="text-yellow-400">⭐ Critico</span>
                      </td>
                    </tr>
                    <tr className="border-t border-afflyt-glass-border">
                      <td className="p-3">📈 Fee-DailyTrends</td>
                      <td className="p-3 text-gray-400">Trend giornalieri</td>
                      <td className="p-3">
                        <span className="text-orange-400">🔶 Consigliato</span>
                      </td>
                    </tr>
                    <tr className="border-t border-afflyt-glass-border">
                      <td className="p-3">🏷️ Fee-Tracking</td>
                      <td className="p-3 text-gray-400">Per tracking ID</td>
                      <td className="p-3">
                        <span className="text-gray-400">⚪ Opzionale</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-400">
                💡 <strong className="text-white">Tip:</strong> Puoi trascinare tutti i file
                insieme!
              </p>
            </div>

            <div className="flex justify-end">
              <CyberButton onClick={() => setCurrentStep('upload')} variant="primary">
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </CyberButton>
            </div>
          </div>
        )}

        {/* Step 2: Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentStep('instructions')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </button>

            <FileDropzone onFilesSelected={addFiles} compact={files.length > 0} />

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">File caricati:</p>
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <FileRow key={i} file={f} onRemove={() => removeFile(f.file)} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <CyberButton variant="ghost" onClick={handleClose}>
                Annulla
              </CyberButton>
              <CyberButton
                onClick={startImport}
                disabled={readyFilesCount === 0 || isUploading}
                variant="primary"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importazione...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importa Dati ({readyFilesCount})
                  </>
                )}
              </CyberButton>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 'processing' && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-400 mb-4" />
              <p className="text-lg font-medium text-white">Elaborazione in corso...</p>
              <p className="text-sm text-gray-400">Analisi di {files.length} file</p>
            </div>

            <div className="space-y-2">
              {files.map((f, i) => (
                <FileRow key={i} file={f} onRemove={() => {}} />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && (
          <div className="space-y-4">
            <div className="flex justify-center py-4">
              <div className="h-16 w-16 rounded-full bg-afflyt-profit-400/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-afflyt-profit-400" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-afflyt-dark-50">
                <p className="text-2xl font-bold text-white">{aggregateResults.totalOrders}</p>
                <p className="text-xs text-gray-400">Ordini</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-afflyt-dark-50">
                <p className="text-2xl font-bold text-afflyt-profit-400">
                  €{stats?.totalCommission?.toFixed(2) || '0'}
                </p>
                <p className="text-xs text-gray-400">Commissioni</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-afflyt-dark-50">
                <p className="text-2xl font-bold text-white">{aggregateResults.matchedDeals}</p>
                <p className="text-xs text-gray-400">Match Afflyt</p>
              </div>
            </div>

            <div className="rounded-lg border border-afflyt-glass-border p-4 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-400">Abbinati automaticamente:</span>
                <span className="font-medium text-white">{aggregateResults.matchedDeals}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Non abbinati (pre-Afflyt):</span>
                <span className="font-medium text-white">{aggregateResults.unmatchedDeals}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Match rate:</span>
                <span className="font-medium text-white">
                  {aggregateResults.totalOrders > 0
                    ? Math.round(
                        (aggregateResults.matchedDeals / aggregateResults.totalOrders) * 100
                      )
                    : 0}
                  %
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <CyberButton variant="ghost" onClick={handleClose}>
                Chiudi
              </CyberButton>
              <CyberButton
                onClick={() => (window.location.href = '/it/dashboard')}
                variant="primary"
              >
                Vai alla Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </CyberButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default ImportModal;
