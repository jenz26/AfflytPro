'use client';

import {
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  DollarSign,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { DetectedFile, ReportType } from '@/hooks/useAmazonImport';

const reportTypeConfig: Record<
  ReportType,
  { label: string; icon: typeof Package; color: string; bgColor: string }
> = {
  orders: {
    label: 'Ordini',
    icon: Package,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  earnings: {
    label: 'Guadagni',
    icon: DollarSign,
    color: 'text-afflyt-profit-400',
    bgColor: 'bg-afflyt-profit-400/20',
  },
  daily_trends: {
    label: 'Trend',
    icon: TrendingUp,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  tracking: {
    label: 'Tracking',
    icon: Tag,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  link_type: {
    label: 'Link Type',
    icon: Tag,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
};

interface FileRowProps {
  file: DetectedFile;
  onRemove: () => void;
}

export function FileRow({ file, onRemove }: FileRowProps) {
  const config = file.type ? reportTypeConfig[file.type] : null;
  const Icon = config?.icon || FileText;

  return (
    <div
      className={`
      flex items-center justify-between p-3 rounded-lg border
      ${file.status === 'error' ? 'border-red-500/50 bg-red-500/5' : ''}
      ${file.status === 'done' ? 'border-afflyt-profit-400/50 bg-afflyt-profit-400/5' : ''}
      ${file.status === 'ready' ? 'border-afflyt-glass-border bg-afflyt-dark-50' : ''}
      ${file.status === 'detecting' || file.status === 'uploading' ? 'border-afflyt-glass-border bg-afflyt-dark-50' : ''}
    `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config?.bgColor || 'bg-gray-500/20'}`}
        >
          {file.status === 'detecting' && (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          )}
          {file.status === 'uploading' && (
            <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
          )}
          {file.status === 'ready' && <Icon className={`h-5 w-5 ${config?.color}`} />}
          {file.status === 'done' && <CheckCircle className="h-5 w-5 text-afflyt-profit-400" />}
          {file.status === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.file.name}</p>
          <p className="text-xs text-gray-400">
            {file.status === 'detecting' && 'Rilevamento tipo...'}
            {file.status === 'uploading' && 'Caricamento...'}
            {file.status === 'ready' && config && `${config.label} - ${file.rowCount} righe`}
            {file.status === 'done' &&
              file.result &&
              `${file.result.rowsImported} importati - ${file.result.matchedDeals} match`}
            {file.status === 'error' && <span className="text-red-400">{file.error}</span>}
          </p>
        </div>
      </div>

      {/* Remove button */}
      {(file.status === 'ready' || file.status === 'error') && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default FileRow;
