'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Send, Mail, MessageCircle, Globe, Lightbulb } from 'lucide-react';

interface ChannelData {
    channel: string;
    displayName?: string;
    channelNames?: string[];
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    epc: number;
    clicksPercent: number;
    revenuePercent: number;
}

interface ChannelBreakdownProps {
    channels: ChannelData[];
    totals: {
        clicks: number;
        revenue: number;
    };
    title?: string;
    locked?: boolean;
}

const channelIcons: Record<string, any> = {
    telegram: Send,
    email: Mail,
    discord: MessageCircle,
    direct: Globe
};

const channelColors: Record<string, string> = {
    telegram: 'bg-blue-500',
    email: 'bg-emerald-500',
    discord: 'bg-purple-500',
    direct: 'bg-gray-500'
};

export function ChannelBreakdown({
    channels,
    totals,
    title = 'Channel Performance',
    locked = false
}: ChannelBreakdownProps) {
    // Find top channel for insight
    const topChannel = channels.length > 0
        ? channels.reduce((a, b) => a.clicks > b.clicks ? a : b)
        : null;

    return (
        <GlassCard className="p-6 relative">
            {/* Locked Overlay for FREE tier */}
            {locked && (
                <div className="absolute inset-0 backdrop-blur-sm bg-afflyt-dark-100/80 z-10 flex items-center justify-center rounded-xl">
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-afflyt-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h4 className="text-white font-semibold mb-1">Unlock Channel Analytics</h4>
                        <p className="text-sm text-gray-400 mb-3">Upgrade to PRO to see channel breakdown</p>
                        <button className="px-4 py-2 bg-gradient-to-r from-afflyt-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                            Upgrade to PRO
                        </button>
                    </div>
                </div>
            )}

            <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

            {channels.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No channel data yet</p>
                </div>
            ) : (
                <>
                    {/* Channel Bars */}
                    <div className="space-y-4 mb-6">
                        {channels.map((channel) => {
                            const Icon = channelIcons[channel.channel] || Globe;
                            const barColor = channelColors[channel.channel] || 'bg-gray-500';

                            return (
                                <div key={channel.channel} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-white capitalize">
                                                {channel.displayName || channel.channel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="text-gray-400">
                                                {channel.clicks.toLocaleString()} clicks
                                            </span>
                                            <span className="text-emerald-400 font-mono">
                                                €{channel.revenue}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${barColor} transition-all duration-500`}
                                            style={{ width: `${channel.clicksPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{channel.clicksPercent}% of clicks</span>
                                        <span>CVR: {channel.cvr}% | EPC: €{channel.epc}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Insight */}
                    {topChannel && (
                        <div className="flex items-start gap-3 p-3 bg-afflyt-cyan-500/10 rounded-lg border border-afflyt-cyan-500/20">
                            <Lightbulb className="w-5 h-5 text-afflyt-cyan-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">
                                <span className="text-afflyt-cyan-400 font-medium capitalize">{topChannel.displayName || topChannel.channel}</span> is your top performing channel with {topChannel.clicksPercent}% of total clicks. Focus your efforts here for maximum ROI.
                            </p>
                        </div>
                    )}
                </>
            )}
        </GlassCard>
    );
}
