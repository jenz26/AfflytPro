'use client';

import { useState, useCallback, useEffect } from 'react';
import { API_BASE } from '@/lib/api/config';

export type ReportType = 'orders' | 'earnings' | 'daily_trends' | 'tracking' | 'link_type';

export interface DetectedFile {
  file: File;
  type: ReportType | null;
  confidence: number;
  rowCount: number;
  status: 'detecting' | 'ready' | 'error' | 'uploading' | 'done';
  error?: string;
  result?: ImportResult;
}

export interface ImportResult {
  success: boolean;
  reportType: ReportType;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  rowsFailed: number;
  matchedDeals: number;
  unmatchedDeals: number;
  errors: Array<{ row: number; error: string }>;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface ImportStats {
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  totalCommission: number;
  totalClicks: number;
  conversionRate: number;
  trackingIds: Array<{
    trackingId: string;
    clicks: number;
    orderedItems: number;
    commission: number;
  }>;
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  reportType: ReportType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rowsTotal: number;
  rowsImported: number;
  matchedDeals: number;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

// Detect report type from file content
async function detectReportType(file: File): Promise<{
  type: ReportType | null;
  confidence: number;
  rowCount: number;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const firstLine = lines[0]?.toLowerCase() || '';
      const headers = lines[1]?.toLowerCase() || '';

      let type: ReportType | null = null;
      let confidence = 0;

      // Check first line (report description)
      if (firstLine.includes('orders') || firstLine.includes('ordini')) {
        type = 'orders';
        confidence = 0.95;
      } else if (firstLine.includes('earnings') || firstLine.includes('guadagni')) {
        type = 'earnings';
        confidence = 0.95;
      } else if (firstLine.includes('daily') || firstLine.includes('trend')) {
        type = 'daily_trends';
        confidence = 0.95;
      } else if (firstLine.includes('tracking') || firstLine.includes('monitoraggio')) {
        type = 'tracking';
        confidence = 0.95;
      } else if (firstLine.includes('link')) {
        type = 'link_type';
        confidence = 0.95;
      }

      // Fallback: check headers
      if (!type) {
        if (headers.includes('asin') && headers.includes('quantità')) {
          type = 'orders';
          confidence = 0.7;
        } else if (headers.includes('commissioni') || headers.includes('spedizione')) {
          type = 'earnings';
          confidence = 0.7;
        } else if (headers.includes('clic') && headers.includes('conversione')) {
          type = 'daily_trends';
          confidence = 0.7;
        }
      }

      // Count data rows
      const rowCount = Math.max(0, lines.filter((l) => l.trim()).length - 2);

      resolve({ type, confidence, rowCount });
    };

    reader.onerror = () => {
      resolve({ type: null, confidence: 0, rowCount: 0 });
    };

    reader.readAsText(file);
  });
}

export function useAmazonImport() {
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'instructions' | 'upload' | 'processing' | 'results'
  >('instructions');
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch import history
  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/user/amazon-import/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.imports || []);
      }
    } catch (error) {
      console.error('Failed to fetch import history', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch import stats
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/user/amazon-import/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch import stats', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  // Add files and detect types
  const addFiles = useCallback(async (newFiles: File[]) => {
    const detected: DetectedFile[] = newFiles.map((file) => ({
      file,
      type: null,
      confidence: 0,
      rowCount: 0,
      status: 'detecting' as const,
    }));

    setFiles((prev) => [...prev, ...detected]);

    // Detect types in parallel
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const result = await detectReportType(file);

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                ...result,
                status: result.type ? 'ready' : 'error',
                error: result.type ? undefined : 'Tipo report non riconosciuto',
              }
            : f
        )
      );
    }
  }, []);

  // Remove file
  const removeFile = useCallback((file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Start import
  const startImport = useCallback(async () => {
    const readyFiles = files.filter((f) => f.status === 'ready');
    if (readyFiles.length === 0) return;

    setFiles((prev) =>
      prev.map((f) => (f.status === 'ready' ? { ...f, status: 'uploading' as const } : f))
    );

    setCurrentStep('processing');
    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      readyFiles.forEach((f) => formData.append('files', f.file));

      const res = await fetch(`${API_BASE}/user/amazon-import/upload-multiple`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();

      // Update files with results
      setFiles((prev) =>
        prev.map((f) => {
          const result = data.results?.find((r: any) => r.fileName === f.file.name);
          return {
            ...f,
            status: 'done' as const,
            result,
          };
        })
      );

      // Refresh data
      fetchHistory();
      fetchStats();

      setCurrentStep('results');
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          error: error.message || 'Upload failed',
        }))
      );
      setCurrentStep('upload');
    } finally {
      setIsUploading(false);
    }
  }, [files, fetchHistory, fetchStats]);

  // Open modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setCurrentStep('instructions');
    setFiles([]);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentStep('instructions');
    setFiles([]);
  }, []);

  // Computed values
  const readyFilesCount = files.filter((f) => f.status === 'ready').length;
  const hasErrors = files.some((f) => f.status === 'error');
  const lastImport = history?.[0];
  const hasImported = history && history.length > 0;

  // Aggregate results
  const aggregateResults = files.reduce(
    (acc, f) => {
      if (f.result) {
        acc.totalOrders += f.result.rowsImported;
        acc.matchedDeals += f.result.matchedDeals;
        acc.unmatchedDeals += f.result.unmatchedDeals;
      }
      return acc;
    },
    { totalOrders: 0, matchedDeals: 0, unmatchedDeals: 0 }
  );

  return {
    // State
    files,
    isModalOpen,
    currentStep,
    history,
    stats,

    // Loading states
    historyLoading,
    statsLoading,
    isUploading,

    // Computed
    readyFilesCount,
    hasErrors,
    lastImport,
    hasImported,
    aggregateResults,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    startImport,
    openModal,
    closeModal,
    setCurrentStep,
    fetchHistory,
    fetchStats,
  };
}

export default useAmazonImport;
