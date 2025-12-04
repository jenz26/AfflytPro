'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';

interface ComparisonFeature {
  name: string;
  description?: string;
  values: Record<string, boolean | string>;
}

interface ComparisonColumn {
  key: string;
  name: string;
  highlight?: boolean;
}

interface LandingTableProps {
  columns: ComparisonColumn[];
  features: ComparisonFeature[];
  className?: string;
}

/**
 * LandingTable - Comparison table for landing pages
 *
 * Use for:
 * - Feature comparison (us vs competitors)
 * - Plan comparison (pricing tiers)
 */
export function LandingTable({
  columns,
  features,
  className,
}: LandingTableProps) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
          <X className="w-4 h-4 text-red-400" />
        </div>
      );
    }

    if (value === '-') {
      return (
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center mx-auto">
          <Minus className="w-4 h-4 text-gray-500" />
        </div>
      );
    }

    return <span className="text-gray-300">{value}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-afflyt-glass-white backdrop-blur-md',
        'border border-white/10',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-6 text-gray-400 font-medium">
                Funzionalita
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-center py-4 px-6 font-semibold',
                    col.highlight
                      ? 'text-afflyt-cyan-400 bg-afflyt-cyan-500/5'
                      : 'text-white'
                  )}
                >
                  {col.highlight && (
                    <span className="block text-xs text-afflyt-cyan-500 mb-1 uppercase tracking-wider">
                      Consigliato
                    </span>
                  )}
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.name}
                className={cn(
                  'border-b border-white/5',
                  'hover:bg-white/[0.02] transition-colors',
                  index === features.length - 1 && 'border-b-0'
                )}
              >
                <td className="py-4 px-6">
                  <div className="text-white font-medium">{feature.name}</div>
                  {feature.description && (
                    <div className="text-gray-500 text-sm mt-0.5">
                      {feature.description}
                    </div>
                  )}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'text-center py-4 px-6',
                      col.highlight && 'bg-afflyt-cyan-500/5'
                    )}
                  >
                    {renderValue(feature.values[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
