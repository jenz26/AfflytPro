import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface KPIWidgetProps {
    title: string;
    icon: LucideIcon;
    mainValue: string;
    mainLabel: string;
    subValue?: string;
    subLabel?: string;
    trend?: {
        value: number;
        positive: boolean;
        label: string;
    };
    progress?: {
        value: number;
        label: string;
    };
    status?: 'good' | 'warning' | 'critical';
    activity?: {
        recentDeals: Array<{
            score: number;
            title: string;
            time: string;
        }>;
    };
    sparkline?: number[];
    color: 'cyan' | 'plasma' | 'profit' | 'warning';
}

export const KPIWidget = ({
    title,
    icon: Icon,
    mainValue,
    mainLabel,
    subValue,
    subLabel,
    trend,
    progress,
    status,
    activity,
    sparkline,
    color
}: KPIWidgetProps) => {
    const colorClasses = {
        cyan: 'text-afflyt-cyan-400 bg-afflyt-cyan-500/10',
        plasma: 'text-afflyt-plasma-400 bg-afflyt-plasma-500/10',
        profit: 'text-afflyt-profit-400 bg-afflyt-profit-500/10',
        warning: 'text-yellow-400 bg-yellow-500/10'
    };

    const statusColors = {
        good: 'text-afflyt-profit-400',
        warning: 'text-yellow-400',
        critical: 'text-red-400'
    };

    return (
        <GlassCard className="p-6 relative overflow-hidden group hover:border-afflyt-cyan-500/40 transition-all">
            {/* Background Glow Effect */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 ${colorClasses[color]} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[0]}`} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
                    </div>

                    {status && (
                        <div className={`w-2 h-2 ${statusColors[status]} rounded-full ${status === 'critical' ? 'animate-pulse' : ''
                            }`} />
                    )}
                </div>

                {/* Main Value */}
                <div className="mb-3">
                    <p className="text-2xl font-bold text-white font-mono">{mainValue}</p>
                    <p className="text-xs text-gray-500 mt-1">{mainLabel}</p>
                </div>

                {/* Secondary Value */}
                {subValue && (
                    <div className="mb-3">
                        <p className="text-lg font-medium text-gray-300 font-mono">{subValue}</p>
                        <p className="text-xs text-gray-500">{subLabel}</p>
                    </div>
                )}

                {/* Trend - Enhanced */}
                {trend && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            trend.positive
                                ? 'bg-afflyt-profit-400/10 text-afflyt-profit-400'
                                : 'bg-red-400/10 text-red-400'
                        }`}>
                            {trend.positive ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="font-semibold">{trend.value}%</span>
                        </div>
                        <span className="text-gray-500">{trend.label}</span>
                    </div>
                )}

                {/* Mini Sparkline Chart */}
                {sparkline && sparkline.length > 0 && (
                    <div className="h-8 flex items-end gap-0.5 mt-3">
                        {sparkline.map((value, i) => {
                            const maxValue = Math.max(...sparkline);
                            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-t transition-all duration-300 ${
                                        color === 'cyan'
                                            ? 'bg-afflyt-cyan-500/30 hover:bg-afflyt-cyan-500/50'
                                            : color === 'profit'
                                                ? 'bg-afflyt-profit-400/30 hover:bg-afflyt-profit-400/50'
                                                : color === 'plasma'
                                                    ? 'bg-afflyt-plasma-400/30 hover:bg-afflyt-plasma-400/50'
                                                    : 'bg-yellow-400/30 hover:bg-yellow-400/50'
                                    }`}
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Progress Bar */}
                {progress && (
                    <div className="mt-3">
                        <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${progress.value > 80
                                        ? 'from-yellow-400 to-orange-400'
                                        : 'from-afflyt-cyan-500 to-afflyt-cyan-400'
                                    }`}
                                style={{ width: `${progress.value}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{progress.label}</p>
                    </div>
                )}

                {/* Activity List */}
                {activity && (
                    <div className="mt-3 space-y-2">
                        {activity.recentDeals.slice(0, 3).map((deal, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${deal.score >= 85
                                            ? 'bg-orange-500/20 text-orange-400'
                                            : 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400'
                                        }`}>
                                        {deal.score}
                                    </div>
                                    <span className="text-gray-400 truncate max-w-[120px]">
                                        {deal.title}
                                    </span>
                                </div>
                                <span className="text-gray-600">{deal.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
