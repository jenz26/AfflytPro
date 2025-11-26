'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface AnalyticsKPICardProps {
    title: string;
    icon: LucideIcon;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
    benchmark?: {
        value: number;
        label: string;
    };
    subtitle?: string;
    color?: 'cyan' | 'green' | 'purple' | 'orange';
    tooltip?: string;
}

export function AnalyticsKPICard({
    title,
    icon: Icon,
    value,
    change,
    trend,
    benchmark,
    subtitle,
    color = 'cyan',
    tooltip
}: AnalyticsKPICardProps) {
    const colorMap = {
        cyan: {
            bg: 'bg-afflyt-cyan-500/10',
            text: 'text-afflyt-cyan-400',
            glow: 'from-afflyt-cyan-500/20'
        },
        green: {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            glow: 'from-emerald-500/20'
        },
        purple: {
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            glow: 'from-purple-500/20'
        },
        orange: {
            bg: 'bg-orange-500/10',
            text: 'text-orange-400',
            glow: 'from-orange-500/20'
        }
    };

    const colors = colorMap[color];

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
        if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-emerald-400 bg-emerald-400/10';
        if (trend === 'down') return 'text-red-400 bg-red-400/10';
        return 'text-gray-400 bg-gray-400/10';
    };

    return (
        <GlassCard className="p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-radial ${colors.glow} to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <span className="text-sm text-gray-400">{title}</span>
                    </div>
                    {tooltip && (
                        <div className="group/tooltip relative">
                            <Info className="w-4 h-4 text-gray-600 hover:text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-6 w-48 p-2 bg-afflyt-dark-100 border border-white/10 rounded-lg text-xs text-gray-400 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20">
                                {tooltip}
                            </div>
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="mb-2">
                    <p className="text-3xl font-bold text-white font-mono tracking-tight">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>

                {/* Trend & Benchmark */}
                <div className="flex items-center justify-between">
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="font-medium">
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                        </div>
                    )}

                    {benchmark && (
                        <div className="text-xs text-gray-500">
                            <span className="text-gray-400">{benchmark.label}:</span>{' '}
                            <span className="font-mono">{benchmark.value}</span>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
