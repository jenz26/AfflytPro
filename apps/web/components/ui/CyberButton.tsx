import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CyberButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
}

export const CyberButton = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    onClick
}: CyberButtonProps) => {
    const baseStyles = `
    relative overflow-hidden
    font-mono uppercase tracking-wider
    transition-all duration-300
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
    before:-translate-x-full hover:before:translate-x-full
    before:transition-transform before:duration-700
    active:scale-95
  `;

    const variants = {
        primary: `
      bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-600
      text-afflyt-dark-100 font-semibold
      shadow-[0_0_20px_rgba(0,229,224,0.3)]
      hover:shadow-[0_0_30px_rgba(0,229,224,0.5)]
      border border-afflyt-cyan-400/20
    `,
        secondary: `
      bg-afflyt-glass-white backdrop-blur-xl
      text-afflyt-cyan-400 
      border border-afflyt-glass-border
      hover:bg-afflyt-glass-cyan
      hover:border-afflyt-cyan-500/40
    `,
        ghost: `
      bg-transparent
      text-afflyt-cyan-400
      hover:bg-afflyt-glass-white
    `
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base'
    };

    // Unique corner cut design
    const cornerCut = {
        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
    };

    return (
        <button
            onClick={onClick}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            style={cornerCut}
        >
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </button>
    );
};
