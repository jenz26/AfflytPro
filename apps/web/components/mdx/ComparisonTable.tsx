'use client';

import { Check, X, Minus } from 'lucide-react';

interface ComparisonTableProps {
  headers: string[];
  rows: (string | boolean)[][];
  highlight?: number; // Column index to highlight (1-based)
}

function CellContent({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
        <Check className="h-4 w-4 text-emerald-400" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20">
        <X className="h-4 w-4 text-red-400" />
      </span>
    );
  }
  if (value === '-') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-500/20">
        <Minus className="h-4 w-4 text-gray-400" />
      </span>
    );
  }
  // Check for emoji indicators
  if (typeof value === 'string') {
    if (value.startsWith('✅')) {
      return (
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20">
            <Check className="h-3 w-3 text-emerald-400" />
          </span>
          <span>{value.replace('✅', '').trim()}</span>
        </span>
      );
    }
    if (value.startsWith('❌')) {
      return (
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20">
            <X className="h-3 w-3 text-red-400" />
          </span>
          <span>{value.replace('❌', '').trim()}</span>
        </span>
      );
    }
  }
  return <span>{value}</span>;
}

export function ComparisonTable({ headers, rows, highlight }: ComparisonTableProps) {
  return (
    <div className="my-8 overflow-x-auto">
      <div className="inline-block min-w-full rounded-xl border border-gray-800 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-afflyt-dark-50">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-left text-sm font-semibold ${
                    highlight === index + 1
                      ? 'text-afflyt-cyan-400 bg-afflyt-cyan-400/10'
                      : 'text-white'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-gray-800 hover:bg-white/5 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-6 py-4 text-sm ${
                      highlight === cellIndex + 1
                        ? 'bg-afflyt-cyan-400/5 text-white font-medium'
                        : cellIndex === 0
                        ? 'text-white font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    <CellContent value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
