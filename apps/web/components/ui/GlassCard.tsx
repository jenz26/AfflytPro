import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * GlassCard - Standardized card component following Afflyt Pro design system
 *
 * Design tokens:
 * - Border radius: 12px (standard)
 * - Padding: 20px (default md)
 * - Border: 1px solid rgba(0,229,224,0.15)
 * - Background: rgba(255,255,255,0.02)
 * - Backdrop blur: 10px (standard)
 */
export const GlassCard = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick
}: GlassCardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',  // 20px - standard
    lg: 'p-8',
  };

  const variantClasses = {
    default: '',
    interactive: 'cursor-pointer hover:scale-[1.02]',
    flat: 'backdrop-blur-none shadow-none',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles - ALWAYS the same
        'relative overflow-hidden',
        'rounded-xl', // 12px border radius
        'bg-afflyt-glass-white',
        'border border-afflyt-glass-border',
        'backdrop-blur-md',

        // Padding
        paddingClasses[padding],

        // Variant specific
        variantClasses[variant],

        // Hover effects
        'hover:border-afflyt-cyan-500/30',
        'hover:shadow-[0_8px_32px_rgba(0,229,224,0.12)]',
        'transition-all duration-300',

        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-500/5 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
