'use client';

import { Link as LinkIcon, Clock, Info } from 'lucide-react';

interface ComplianceFooterProps {
  asin: string;
  minutesAgo: number;
  amazonDomain?: string;
}

export const ComplianceFooter = ({
  asin,
  minutesAgo,
  amazonDomain = 'amazon.it',
}: ComplianceFooterProps) => {
  // Format time ago
  const timeText =
    minutesAgo < 1
      ? 'meno di 1 min fa'
      : minutesAgo === 1
      ? '1 min fa'
      : `${minutesAgo} min fa`;

  return (
    <div className="mt-6 space-y-2.5 text-center">
      {/* URL Destinazione */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400">
        <LinkIcon className="w-4 h-4 flex-shrink-0 text-afflyt-cyan-500" />
        <span className="font-mono truncate max-w-xs">
          {amazonDomain}/dp/{asin}
        </span>
      </div>

      {/* Price Timestamp */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400">
        <Clock className="w-4 h-4 flex-shrink-0 text-afflyt-cyan-500" />
        <span>Prezzo verificato {timeText}</span>
      </div>

      {/* Affiliate Disclosure */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400">
        <Info className="w-4 h-4 flex-shrink-0 text-afflyt-cyan-500" />
        <span>Link affiliato - Commissioni su acquisti</span>
      </div>
    </div>
  );
};
