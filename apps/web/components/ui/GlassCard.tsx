import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export const GlassCard = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div className={cn(
            "relative overflow-hidden",
            "bg-afflyt-glass-white backdrop-blur-2xl",
            "border border-afflyt-glass-border",
            "shadow-[0_8px_32px_rgba(0,229,224,0.08)]",
            "before:absolute before:inset-0",
            "before:bg-gradient-to-br before:from-afflyt-cyan-500/5 before:to-transparent",
            "hover:shadow-[0_8px_40px_rgba(0,229,224,0.12)]",
            "hover:border-afflyt-cyan-500/30",
            "transition-all duration-500",
            className
        )}>
            {/* Glow effect on hover */}
            <div className="absolute -top-1 -left-1 w-20 h-20 bg-afflyt-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
