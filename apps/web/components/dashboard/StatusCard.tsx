'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LucideIcon, Bot, Send, BarChart3, Plus, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ItemStatus = 'active' | 'paused' | 'error' | 'incomplete' | 'online' | 'offline';

export interface StatusItem {
    id: string;
    name: string;
    status: ItemStatus;
    meta?: string;
}

// Automations Card
export interface AutomationsCardData {
    type: 'automations';
    items: Array<StatusItem & { dealsFound24h?: number }>;
    activeCount: number;
    totalCount: number;
}

// Channels Card
export interface ChannelsCardData {
    type: 'channels';
    items: Array<StatusItem & { platform: string }>;
}

// Performance Card
export interface PerformanceCardData {
    type: 'performance';
    clicks: number;
    revenue: number;
    trend: number; // percentage vs last period
    sparkline?: number[];
}

export type StatusCardData = AutomationsCardData | ChannelsCardData | PerformanceCardData;

interface StatusCardProps {
    data: StatusCardData;
    onAddClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// STATUS DOT COMPONENT
// ═══════════════════════════════════════════════════════════════

function StatusDot({ status }: { status: ItemStatus }) {
    const colors: Record<ItemStatus, string> = {
        active: 'bg-afflyt-profit-400',
        online: 'bg-afflyt-profit-400',
        paused: 'bg-yellow-400',
        error: 'bg-red-400',
        incomplete: 'bg-red-400',
        offline: 'bg-gray-400'
    };

    const pulseStatuses: ItemStatus[] = ['active', 'online'];
    const shouldPulse = pulseStatuses.includes(status);

    return (
        <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />
            {shouldPulse && (
                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${colors[status]} animate-ping opacity-75`} />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MINI SPARKLINE
// ═══════════════════════════════════════════════════════════════

function MiniSparkline({ data }: { data: number[] }) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const height = 32;
    const width = 80;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="opacity-60">
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-afflyt-cyan-400"
            />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════
// AUTOMATIONS CARD
// ═══════════════════════════════════════════════════════════════

function AutomationsCard({ data }: { data: AutomationsCardData }) {
    const t = useTranslations('dashboard.statusCards.automations');

    return (
        <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-afflyt-cyan-400" />
                    </div>
                    <h3 className="font-semibold text-white">{t('title')}</h3>
                </div>
                <span className="text-sm text-gray-400">
                    {data.activeCount}/{data.totalCount} {t('active')}
                </span>
            </div>

            {/* Items List */}
            <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
                {data.items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">{t('empty')}</p>
                ) : (
                    data.items.slice(0, 4).map(item => (
                        <Link
                            key={item.id}
                            href={`/dashboard/automations?edit=${item.id}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-afflyt-dark-100/50 transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <StatusDot status={item.status} />
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate max-w-[140px]">
                                    {item.name}
                                </span>
                            </div>
                            {item.dealsFound24h !== undefined && item.dealsFound24h > 0 && (
                                <span className="text-xs text-afflyt-cyan-400 bg-afflyt-cyan-500/10 px-2 py-0.5 rounded">
                                    {item.dealsFound24h} {t('deals')}
                                </span>
                            )}
                        </Link>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-afflyt-glass-border">
                <Link href="/dashboard/automations">
                    <CyberButton variant="ghost" size="sm" className="w-full justify-center">
                        {t('manage')}
                        <ChevronRight className="w-4 h-4" />
                    </CyberButton>
                </Link>
            </div>
        </GlassCard>
    );
}

// ═══════════════════════════════════════════════════════════════
// CHANNELS CARD
// ═══════════════════════════════════════════════════════════════

function ChannelsCard({ data, onAddClick }: { data: ChannelsCardData; onAddClick?: () => void }) {
    const t = useTranslations('dashboard.statusCards.channels');

    const platformIcons: Record<string, string> = {
        TELEGRAM: 'TG',
        DISCORD: 'DC',
        EMAIL: '@'
    };

    return (
        <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-afflyt-plasma-500/20 flex items-center justify-center">
                        <Send className="w-4 h-4 text-afflyt-plasma-400" />
                    </div>
                    <h3 className="font-semibold text-white">{t('title')}</h3>
                </div>
                <span className="text-sm text-gray-400">
                    {data.items.length} {t('connected')}
                </span>
            </div>

            {/* Items List */}
            <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
                {data.items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">{t('empty')}</p>
                ) : (
                    data.items.slice(0, 4).map(item => (
                        <Link
                            key={item.id}
                            href={`/dashboard/channels?view=${item.id}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-afflyt-dark-100/50 transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <StatusDot status={item.status} />
                                <span className="text-xs font-mono text-gray-500 bg-afflyt-dark-100 px-1.5 py-0.5 rounded">
                                    {platformIcons[item.platform] || item.platform.slice(0, 2)}
                                </span>
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate max-w-[100px]">
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-afflyt-glass-border flex gap-2">
                {onAddClick && (
                    <CyberButton variant="secondary" size="sm" onClick={onAddClick} className="flex-1 justify-center">
                        <Plus className="w-4 h-4" />
                        {t('add')}
                    </CyberButton>
                )}
                <Link href="/dashboard/channels" className="flex-1">
                    <CyberButton variant="ghost" size="sm" className="w-full justify-center">
                        {t('manage')}
                        <ChevronRight className="w-4 h-4" />
                    </CyberButton>
                </Link>
            </div>
        </GlassCard>
    );
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE CARD
// ═══════════════════════════════════════════════════════════════

function PerformanceCard({ data }: { data: PerformanceCardData }) {
    const t = useTranslations('dashboard.statusCards.performance');

    const TrendIcon = data.trend >= 0 ? TrendingUp : TrendingDown;
    const trendColor = data.trend >= 0 ? 'text-afflyt-profit-400' : 'text-red-400';

    return (
        <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-afflyt-profit-500/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-afflyt-profit-400" />
                    </div>
                    <h3 className="font-semibold text-white">{t('title')}</h3>
                </div>
                {data.sparkline && <MiniSparkline data={data.sparkline} />}
            </div>

            {/* Main Stats */}
            <div className="flex-1 space-y-4">
                {/* Clicks */}
                <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">{t('clicks')}</p>
                    <p className="text-2xl font-bold font-mono text-white">
                        {data.clicks.toLocaleString()}
                    </p>
                </div>

                {/* Revenue */}
                <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">{t('revenue')}</p>
                    <p className="text-2xl font-bold font-mono text-afflyt-profit-400">
                        {data.revenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </p>
                </div>

                {/* Trend */}
                <div className="flex items-center gap-2">
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    <span className={`text-sm font-semibold ${trendColor}`}>
                        {data.trend >= 0 ? '+' : ''}{data.trend}%
                    </span>
                    <span className="text-xs text-gray-500">{t('vsLastWeek')}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-afflyt-glass-border">
                <Link href="/dashboard/analytics">
                    <CyberButton variant="ghost" size="sm" className="w-full justify-center">
                        {t('viewAnalytics')}
                        <ChevronRight className="w-4 h-4" />
                    </CyberButton>
                </Link>
            </div>
        </GlassCard>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export function StatusCard({ data, onAddClick }: StatusCardProps) {
    switch (data.type) {
        case 'automations':
            return <AutomationsCard data={data} />;
        case 'channels':
            return <ChannelsCard data={data} onAddClick={onAddClick} />;
        case 'performance':
            return <PerformanceCard data={data} />;
        default:
            return null;
    }
}
