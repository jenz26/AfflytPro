import { ReactNode } from 'react';

interface LandingBadgeProps {
  children: ReactNode;
  variant?: 'cyan' | 'purple' | 'green';
}

export function LandingBadge({ children, variant = 'cyan' }: LandingBadgeProps) {
  const variants = {
    cyan: 'bg-afflyt-cyan-500/10 text-afflyt-cyan-500 border-afflyt-cyan-500/20',
    purple: 'bg-afflyt-plasma-500/10 text-afflyt-plasma-500 border-afflyt-plasma-500/20',
    green: 'bg-afflyt-profit-500/10 text-afflyt-profit-500 border-afflyt-profit-500/20',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
}
