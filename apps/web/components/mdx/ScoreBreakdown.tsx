'use client';

interface Factor {
  name: string;
  score: number;
  max: number;
  color?: string;
}

interface Bonus {
  name: string;
  value: number;
}

interface ScoreBreakdownProps {
  total: number;
  factors: Factor[];
  bonus?: Bonus;
}

const colorClasses: Record<string, { bg: string; bar: string }> = {
  green: { bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' },
  yellow: { bg: 'bg-amber-500/20', bar: 'bg-amber-500' },
  blue: { bg: 'bg-blue-500/20', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500/20', bar: 'bg-purple-500' },
  orange: { bg: 'bg-orange-500/20', bar: 'bg-orange-500' },
  cyan: { bg: 'bg-afflyt-cyan-400/20', bar: 'bg-afflyt-cyan-400' },
};

function CircularProgress({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on score
  let color = 'text-red-500';
  if (value >= 70) color = 'text-emerald-500';
  else if (value >= 50) color = 'text-amber-500';
  else if (value >= 30) color = 'text-orange-500';

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-800"
        />
        {/* Progress circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={color}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

export function ScoreBreakdown({ total, factors, bonus }: ScoreBreakdownProps) {
  return (
    <div className="my-8 p-6 rounded-2xl border border-gray-800 bg-afflyt-dark-50">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Circular score */}
        <div className="flex flex-col items-center">
          <CircularProgress value={total} />
          <p className="mt-2 text-sm text-gray-400 font-medium">Deal Score</p>
        </div>

        {/* Factors */}
        <div className="flex-1 space-y-4">
          {factors.map((factor) => {
            const colorClass = colorClasses[factor.color || 'cyan'];
            const percentage = (factor.score / factor.max) * 100;

            return (
              <div key={factor.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{factor.name}</span>
                  <span className="text-sm text-white font-medium">
                    {factor.score}/{factor.max}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${colorClass.bg}`}>
                  <div
                    className={`h-full rounded-full ${colorClass.bar} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Bonus */}
          {bonus && (
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-afflyt-cyan-400 font-medium">
                  {bonus.name}
                </span>
                <span className="text-sm text-afflyt-cyan-400 font-bold">
                  +{bonus.value}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
