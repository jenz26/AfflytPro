'use client';

import { useTranslations } from 'next-intl';
import { Send, MessageSquare, Settings, Trash2, MoreVertical, Copy, Tag } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export interface ChannelStats {
    totalPosts: number;
    totalClicks: number;
    totalRevenue: number;
    lastPostAt?: string;
}

export interface Channel {
    id: string;
    name: string;
    platform: 'TELEGRAM' | 'DISCORD';
    status: 'CONNECTED' | 'PENDING' | 'ERROR';
    channelId: string;
    amazonTag?: string | null;
    stats?: ChannelStats;
    credential?: {
        id: string;
        label: string;
    };
}

interface ChannelCardProps {
    channel: Channel;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ChannelCard({ channel, onEdit, onDelete }: ChannelCardProps) {
    const t = useTranslations('channels');

    const statusColors = {
        CONNECTED: 'bg-afflyt-profit-400/20 text-afflyt-profit-400',
        PENDING: 'bg-yellow-500/20 text-yellow-400',
        ERROR: 'bg-red-500/20 text-red-400',
    };

    const platformIcons = {
        TELEGRAM: Send,
        DISCORD: MessageSquare,
    };

    const platformColors = {
        TELEGRAM: 'bg-blue-500/10 text-blue-400',
        DISCORD: 'bg-purple-500/10 text-purple-400',
    };

    const Icon = platformIcons[channel.platform];
    const stats = channel.stats || { totalPosts: 0, totalClicks: 0, totalRevenue: 0 };

    return (
        <GlassCard className="p-6 hover:border-afflyt-cyan-500/40 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platformColors[channel.platform]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">{channel.name}</h4>
                        <p className="text-gray-500 text-sm font-mono">{channel.channelId}</p>
                        {channel.amazonTag && (
                            <p className="text-xs text-afflyt-cyan-400 mt-1 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {channel.amazonTag}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusColors[channel.status]}`}>
                        {channel.status === 'CONNECTED' && (
                            <span className="w-1.5 h-1.5 bg-afflyt-profit-400 rounded-full animate-pulse" />
                        )}
                        {t(`status.${channel.status.toLowerCase()}`)}
                    </span>

                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-afflyt-glass-border">
                <div>
                    <div className="text-2xl font-bold text-white font-mono">
                        {stats.totalPosts.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {t('stats.posts')}
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-afflyt-cyan-400 font-mono">
                        {stats.totalClicks.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {t('stats.clicks')}
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-afflyt-profit-400 font-mono">
                        {stats.totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {t('stats.revenue')}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
