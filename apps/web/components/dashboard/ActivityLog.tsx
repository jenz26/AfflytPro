'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    Clock, ChevronRight, Send, Search, MousePointer, CheckCircle, AlertTriangle, Bot
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ActivityType =
    | 'deal_published'
    | 'deal_found'
    | 'click'
    | 'channel_verified'
    | 'automation_executed'
    | 'error';

export interface Activity {
    id: string;
    type: ActivityType;
    message: string;
    timestamp: Date | string;
    metadata?: Record<string, any>;
}

interface ActivityLogProps {
    activities: Activity[];
    maxVisible?: number;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY CONFIG
// ═══════════════════════════════════════════════════════════════

const activityConfig: Record<ActivityType, {
    icon: typeof Send;
    iconClass: string;
    bgClass: string;
}> = {
    deal_published: {
        icon: Send,
        iconClass: 'text-afflyt-cyan-400',
        bgClass: 'bg-afflyt-cyan-500/10'
    },
    deal_found: {
        icon: Search,
        iconClass: 'text-afflyt-plasma-400',
        bgClass: 'bg-afflyt-plasma-500/10'
    },
    click: {
        icon: MousePointer,
        iconClass: 'text-afflyt-profit-400',
        bgClass: 'bg-afflyt-profit-500/10'
    },
    channel_verified: {
        icon: CheckCircle,
        iconClass: 'text-green-400',
        bgClass: 'bg-green-500/10'
    },
    automation_executed: {
        icon: Bot,
        iconClass: 'text-blue-400',
        bgClass: 'bg-blue-500/10'
    },
    error: {
        icon: AlertTriangle,
        iconClass: 'text-red-400',
        bgClass: 'bg-red-500/10'
    }
};

// ═══════════════════════════════════════════════════════════════
// TIME AGO HELPER
// ═══════════════════════════════════════════════════════════════

function timeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return then.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY ROW
// ═══════════════════════════════════════════════════════════════

function ActivityRow({ activity }: { activity: Activity }) {
    const config = activityConfig[activity.type];
    const IconComponent = config.icon;

    return (
        <div className="flex items-start gap-3 py-2">
            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`w-4 h-4 ${config.iconClass}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 line-clamp-2">
                    {activity.message}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {timeAgo(activity.timestamp)}
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ActivityLog({ activities, maxVisible = 6 }: ActivityLogProps) {
    const t = useTranslations('dashboard.activityLog');

    const visibleActivities = activities.slice(0, maxVisible);

    return (
        <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-white">{t('title')}</h3>
            </div>

            {/* Activity List */}
            <div className="flex-1 space-y-1 min-h-0 overflow-y-auto">
                {visibleActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Clock className="w-12 h-12 text-gray-600 mb-3" />
                        <p className="text-gray-500">{t('empty')}</p>
                        <p className="text-xs text-gray-600 mt-1">{t('emptyHint')}</p>
                    </div>
                ) : (
                    visibleActivities.map(activity => (
                        <ActivityRow key={activity.id} activity={activity} />
                    ))
                )}
            </div>

            {/* Footer */}
            {activities.length > maxVisible && (
                <div className="mt-4 pt-4 border-t border-afflyt-glass-border">
                    <Link href="/dashboard/logs">
                        <CyberButton variant="ghost" size="sm" className="w-full justify-center">
                            {t('viewAll')}
                            <ChevronRight className="w-4 h-4" />
                        </CyberButton>
                    </Link>
                </div>
            )}
        </GlassCard>
    );
}
