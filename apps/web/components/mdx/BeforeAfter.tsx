'use client';

import { X, Check, ArrowRight } from 'lucide-react';

interface SideContent {
  title: string;
  points: string[];
}

interface BeforeAfterProps {
  before: SideContent;
  after: SideContent;
}

export function BeforeAfter({ before, after }: BeforeAfterProps) {
  return (
    <div className="my-10 grid md:grid-cols-2 gap-6">
      {/* Before */}
      <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-8 shadow-lg shadow-red-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <h4 className="text-xl font-bold text-red-400">{before.title}</h4>
        </div>
        <ul className="space-y-4">
          {before.points.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* After */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-8 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
          <h4 className="text-xl font-bold text-emerald-400">{after.title}</h4>
        </div>
        <ul className="space-y-4">
          {after.points.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Alternative horizontal layout
export function BeforeAfterHorizontal({ before, after }: BeforeAfterProps) {
  return (
    <div className="my-8 p-6 rounded-2xl border border-gray-800 bg-afflyt-dark-50">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Before */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-red-400 mb-3">{before.title}</h4>
          <ul className="space-y-2">
            {before.points.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* After */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-emerald-400 mb-3">{after.title}</h4>
          <ul className="space-y-2">
            {after.points.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
