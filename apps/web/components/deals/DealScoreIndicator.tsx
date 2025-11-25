'use client';

import { motion } from 'framer-motion';

interface DealScoreIndicatorProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function DealScoreIndicator({
  score,
  size = 'md',
  showLabel = true
}: DealScoreIndicatorProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.min(Math.max(score, 0), 100);

  // Calculate color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-400';
    if (score >= 60) return 'from-afflyt-cyan-500 to-blue-400';
    if (score >= 40) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-orange-400';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'HOT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'OK';
    return 'WEAK';
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      width: 60,
      height: 60,
      strokeWidth: 4,
      fontSize: 'text-sm',
      labelSize: 'text-[8px]',
      radius: 24
    },
    md: {
      width: 80,
      height: 80,
      strokeWidth: 6,
      fontSize: 'text-lg',
      labelSize: 'text-[10px]',
      radius: 32
    },
    lg: {
      width: 120,
      height: 120,
      strokeWidth: 8,
      fontSize: 'text-2xl',
      labelSize: 'text-xs',
      radius: 48
    }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.width}
        height={config.height}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={config.radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={config.strokeWidth}
          fill="none"
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={config.radius}
          stroke="url(#scoreGradient)"
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.1
          }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={`${getScoreColor(clampedScore).split(' ')[0].replace('from-', '')}`} stopOpacity="1">
              <animate
                attributeName="stop-color"
                values={clampedScore >= 80 ? "#10b981;#34d399;#10b981" :
                        clampedScore >= 60 ? "#06b6d4;#3b82f6;#06b6d4" :
                        clampedScore >= 40 ? "#eab308;#f59e0b;#eab308" :
                        "#ef4444;#f97316;#ef4444"}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" className={`${getScoreColor(clampedScore).split(' ')[1].replace('to-', '')}`} stopOpacity="1">
              <animate
                attributeName="stop-color"
                values={clampedScore >= 80 ? "#34d399;#10b981;#34d399" :
                        clampedScore >= 60 ? "#3b82f6;#06b6d4;#3b82f6" :
                        clampedScore >= 40 ? "#f59e0b;#eab308;#f59e0b" :
                        "#f97316;#ef4444;#f97316"}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`font-bold text-white ${config.fontSize}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
            type: "spring",
            stiffness: 200
          }}
        >
          {Math.round(clampedScore)}
        </motion.span>
        {showLabel && (
          <motion.span
            className={`font-semibold tracking-wider ${config.labelSize} ${
              clampedScore >= 80 ? 'text-green-400' :
              clampedScore >= 60 ? 'text-afflyt-cyan-400' :
              clampedScore >= 40 ? 'text-yellow-400' :
              'text-red-400'
            }`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {getScoreLabel(clampedScore)}
          </motion.span>
        )}
      </div>

      {/* Glow effect for high scores */}
      {clampedScore >= 80 && (
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
      )}
    </div>
  );
}
