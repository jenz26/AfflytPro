'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatProps {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function Stat({ value, label, trend, description }: StatProps) {
  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    down: <TrendingDown className="h-4 w-4 text-red-400" />,
    neutral: <Minus className="h-4 w-4 text-gray-400" />,
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-afflyt-dark-50 border border-gray-800 p-5 hover:border-afflyt-cyan-400/30 transition-colors">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-400/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl font-bold text-white">{value}</span>
          {trend && trendIcons[trend]}
        </div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div className={`my-8 grid grid-cols-2 ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
