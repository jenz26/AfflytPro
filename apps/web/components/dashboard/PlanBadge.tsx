'use client';

import { cn } from '@/lib/utils';

export type PlanType = 'FREE' | 'PRO' | 'BUSINESS';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const PLAN_CONFIG = {
  FREE: {
    label: 'Free',
    colors: 'bg-gray-500/20 border-gray-500/40 text-gray-300',
    icon: '🆓',
  },
  PRO: {
    label: 'Pro',
    colors: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300',
    icon: '⭐',
  },
  BUSINESS: {
    label: 'Business',
    colors: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300',
    icon: '🚀',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function PlanBadge({
  plan,
  size = 'md',
  className = '',
  showIcon = true,
}: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-bold backdrop-blur-sm',
        config.colors,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </div>
  );
}
