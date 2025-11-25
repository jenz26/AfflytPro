import { cn } from '@/lib/utils';
import { ReactNode, MouseEvent } from 'react';

interface CyberButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * CyberButton - Standardized button component
 *
 * Design System Rules:
 * - ONLY 3 variants allowed: primary, secondary, ghost
 * - Primary: Cyan gradient + shadow (1 per screen MAX)
 * - Secondary: Bordered transparent (2-3 per screen)
 * - Ghost: Text only (unlimited)
 *
 * Border radius: 8px (standard for buttons)
 * Transition: 300ms
 */
export const CyberButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled,
  type = 'button'
}: CyberButtonProps) => {
  const variants = {
    // PRIMARY: Cyan gradient + glow (use ONCE per screen)
    primary: cn(
      'bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600',
      'text-afflyt-dark-100 font-semibold',
      'shadow-[0_0_20px_rgba(0,229,224,0.3)]',
      'hover:shadow-[0_0_30px_rgba(0,229,224,0.5)]',
      'hover:scale-[1.02]',
    ),
    // SECONDARY: Bordered + transparent (use 2-3 per screen)
    secondary: cn(
      'border border-afflyt-cyan-500/40',
      'bg-transparent',
      'text-afflyt-cyan-400 font-semibold',
      'hover:bg-afflyt-cyan-500/10',
      'hover:border-afflyt-cyan-500/60',
    ),
    // GHOST: Text only (unlimited)
    ghost: cn(
      'text-afflyt-cyan-400 font-semibold',
      'hover:bg-afflyt-cyan-500/10',
    ),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles
        'relative overflow-hidden',
        'rounded-lg', // 8px border radius for buttons
        'font-medium',
        'inline-flex items-center justify-center gap-2',
        'transition-all duration-300',
        'active:scale-95',

        // Shimmer effect on hover
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        'before:-translate-x-full hover:before:translate-x-full',
        'before:transition-transform before:duration-700',

        // Variant and size
        variants[variant],
        sizes[size],

        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',

        className
      )}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
