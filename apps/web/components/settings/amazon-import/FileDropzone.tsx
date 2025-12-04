'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function FileDropzone({ onFilesSelected, disabled, compact }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg transition-all cursor-pointer
        ${
          isDragActive
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-afflyt-glass-border hover:border-orange-500/50 hover:bg-orange-500/5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${compact ? 'p-4' : 'p-8'}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center text-center">
        {compact ? (
          <>
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-400">Trascina altri file CSV qui</p>
          </>
        ) : (
          <>
            <div className="p-4 bg-orange-500/10 rounded-lg mb-4">
              <FileText className="h-10 w-10 text-orange-400" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Trascina i file CSV qui</p>
            <p className="text-sm text-gray-400 mb-3">
              oppure <span className="text-orange-400">sfoglia</span>
            </p>
            <p className="text-xs text-gray-500">Formati supportati: .csv (max 10MB per file)</p>
          </>
        )}
      </div>
    </div>
  );
}

export default FileDropzone;
