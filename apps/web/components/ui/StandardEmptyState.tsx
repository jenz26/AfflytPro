/**
 * StandardEmptyState - Consistent empty state component
 *
 * Design System Rules:
 * - Always: Large icon + Title + Description + CTA button
 * - Icon: 64px (w-16 h-16)
 * - Title: text-xl font-bold
 * - Description: text-gray-400 max-w-md
 * - Single primary CTA
 */

import { LucideIcon } from 'lucide-react';
import { CyberButton } from './CyberButton';

interface StandardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
}

export const StandardEmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
}: StandardEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Icon */}
      <div className="w-16 h-16 mb-4 text-gray-500 flex items-center justify-center">
        <Icon className="w-full h-full" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 mb-6 max-w-md">
        {description}
      </p>

      {/* CTA */}
      <CyberButton
        variant="primary"
        onClick={onAction}
        disabled={actionDisabled}
      >
        {actionLabel}
      </CyberButton>
    </div>
  );
};
