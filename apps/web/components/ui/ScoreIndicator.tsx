// components/ui/ScoreIndicator.tsx
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ScoreIndicatorProps {
  score: number;
  variant?: 'pill' | 'text' | 'bar' | 'arc';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Unified Score Indicator for Afflyt Pro
 * Use 'pill' in tables, 'text' in cards, 'bar' in lists, 'arc' in details
 */
export const ScoreIndicator = ({
  score,
  variant = 'pill',
  size = 'md',
  showLabel = false,
  className = ''
}: ScoreIndicatorProps) => {
  // Color system based on score thresholds
  const getScoreStyles = (score: number) => {
    if (score >= 85) return {
      bg: 'bg-green-400/10',
      border: 'border-green-400/30',
      text: 'text-green-400',
      dot: 'bg-green-400',
      gradient: 'from-green-300 to-emerald-500',
      label: 'HOT'
    };
    if (score >= 70) return {
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/30',
      text: 'text-cyan-400',
      dot: 'bg-cyan-400',
      gradient: 'from-cyan-300 to-cyan-500',
      label: 'GOOD'
    };
    if (score >= 50) return {
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/30',
      text: 'text-yellow-400',
      dot: 'bg-yellow-400',
      gradient: 'from-yellow-300 to-orange-500',
      label: 'OK'
    };
    return {
      bg: 'bg-red-400/10',
      border: 'border-red-400/30',
      text: 'text-red-400',
      dot: 'bg-red-400',
      gradient: 'from-red-300 to-red-500',
      label: 'LOW'
    };
  };

  const styles = getScoreStyles(score);

  // Size configurations
  const sizes = {
    sm: {
      pill: 'px-2 py-0.5 text-xs',
      text: 'text-xl',
      bar: 'h-1',
      arc: 'w-12 h-12',
      label: 'text-[10px]'
    },
    md: {
      pill: 'px-3 py-1.5 text-sm',
      text: 'text-3xl',
      bar: 'h-1.5',
      arc: 'w-16 h-16',
      label: 'text-xs'
    },
    lg: {
      pill: 'px-4 py-2 text-base',
      text: 'text-5xl',
      bar: 'h-2',
      arc: 'w-20 h-20',
      label: 'text-sm'
    }
  };

  // Pill variant (best for tables)
  if (variant === 'pill') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2',
        sizes[size].pill,
        styles.bg,
        styles.border,
        'border rounded-full',
        className
      )}>
        <div className={cn('w-2 h-2 rounded-full', styles.dot, score >= 85 && 'animate-pulse')} />
        <span className={cn(styles.text, 'font-mono font-bold')}>
          {score}
        </span>
        {showLabel && (
          <span className={cn(styles.text, 'font-bold tracking-wider')}>
            {styles.label}
          </span>
        )}
      </div>
    );
  }

  // Gradient text variant (best for cards)
  if (variant === 'text') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <span className={cn(
          sizes[size].text,
          'font-black font-mono',
          'bg-gradient-to-br',
          styles.gradient,
          'bg-clip-text text-transparent',
          'drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]'
        )}>
          {score}
        </span>
        {showLabel && (
          <span className={cn(
            sizes[size].label,
            styles.text,
            'font-bold tracking-wider uppercase'
          )}>
            {styles.label}
          </span>
        )}
      </div>
    );
  }

  // Bar variant (best for lists)
  if (variant === 'bar') {
    return (
      <div className={cn('flex items-center gap-3 w-full', className)}>
        <span className={cn(
          'font-mono font-bold',
          size === 'sm' ? 'text-xs w-6' : size === 'md' ? 'text-sm w-8' : 'text-base w-10',
          styles.text
        )}>
          {score}
        </span>
        <div className={cn(
          'flex-1 bg-gray-800 rounded-full overflow-hidden',
          sizes[size].bar
        )}>
          <div
            className={cn(
              'h-full transition-all duration-500',
              styles.dot
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        {showLabel && (
          <span className={cn(
            sizes[size].label,
            styles.text,
            'font-bold tracking-wider uppercase'
          )}>
            {styles.label}
          </span>
        )}
      </div>
    );
  }

  // Arc variant (best for detail views)
  if (variant === 'arc') {
    const gradientId = useId();
    const sizeMap = { sm: 30, md: 40, lg: 50 };
    const radius = sizeMap[size];
    const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={cn('relative', sizes[size].arc, className)}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="rgba(255,255,255,0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={`url(#${gradientId})`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="0%" stopColor={
                score >= 85 ? '#10b981' :
                score >= 70 ? '#00D4FF' :
                score >= 50 ? '#fbbf24' : '#ef4444'
              } />
              <stop offset="100%" stopColor={
                score >= 85 ? '#059669' :
                score >= 70 ? '#00E5E0' :
                score >= 50 ? '#f97316' : '#dc2626'
              } />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'font-bold text-white',
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
          )}>
            {score}
          </span>
          {showLabel && (
            <span className={cn(
              sizes[size].label,
              styles.text,
              'font-bold tracking-wider uppercase'
            )}>
              {styles.label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return null;
};

// Export individual variants for specific use cases
export const ScorePill = (props: Omit<ScoreIndicatorProps, 'variant'>) =>
  <ScoreIndicator {...props} variant="pill" />;

export const ScoreText = (props: Omit<ScoreIndicatorProps, 'variant'>) =>
  <ScoreIndicator {...props} variant="text" />;

export const ScoreBar = (props: Omit<ScoreIndicatorProps, 'variant'>) =>
  <ScoreIndicator {...props} variant="bar" />;

export const ScoreArc = (props: Omit<ScoreIndicatorProps, 'variant'>) =>
  <ScoreIndicator {...props} variant="arc" />;

// Backward compatibility - ScoreCircle maps to ScoreArc (the original circular design)
export const ScoreCircle = ScoreArc;
