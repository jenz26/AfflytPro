'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Radio, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';

interface ChannelData {
    channel: string;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    epc: number;
    clicksPercent: number;
    revenuePercent: number;
}

interface ChannelDeepDiveProps {
    channels: ChannelData[];
    totals: { clicks: number; revenue: number };
    loading?: boolean;
}

function getChannelIcon(channel: string): string {
    const icons: Record<string, string> = {
        telegram: '📱',
        discord: '💬',
        email: '📧',
        twitter: '🐦',
        instagram: '📷',
        facebook: '👥',
        whatsapp: '💚',
        direct: '🔗',
    };
    return icons[channel.toLowerCase()] || '📢';
}

function getChannelColor(channel: string): string {
    const colors: Record<string, string> = {
        telegram: 'from-blue-500 to-cyan-500',
        discord: 'from-indigo-500 to-purple-500',
        email: 'from-red-500 to-orange-500',
        twitter: 'from-sky-400 to-blue-500',
        instagram: 'from-pink-500 to-purple-500',
        facebook: 'from-blue-600 to-blue-700',
        whatsapp: 'from-green-500 to-emerald-500',
        direct: 'from-gray-500 to-gray-600',
    };
    return colors[channel.toLowerCase()] || 'from-gray-500 to-gray-600';
}

export function ChannelDeepDive({ channels, totals, loading }: ChannelDeepDiveProps) {
    if (loading) {
        return (
            <GlassCard className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 w-48 bg-white/10 rounded mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded" />
                        ))}
                    </div>
                </div>
            </GlassCard>
        );
    }

    if (channels.length === 0) {
        return (
            <GlassCard className="p-8 text-center">
                <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">No Channel Data Yet</h4>
                <p className="text-gray-400 text-sm">
                    Start sharing your links across different channels to see performance comparisons.
                </p>
            </GlassCard>
        );
    }

    // Find best performing channel
    const bestChannel = channels.reduce((best, ch) =>
        ch.revenue > best.revenue ? ch : best
    , channels[0]);

    // Generate insight
    const generateInsight = () => {
        if (channels.length < 2) {
            return "Add more channels to compare performance across different platforms.";
        }

        const topByClicks = [...channels].sort((a, b) => b.clicks - a.clicks)[0];
        const topByRevenue = [...channels].sort((a, b) => b.revenue - a.revenue)[0];
        const topByCVR = [...channels].sort((a, b) => b.cvr - a.cvr)[0];

        if (topByClicks.channel !== topByRevenue.channel) {
            return `${getChannelIcon(topByClicks.channel)} ${topByClicks.channel} drives the most traffic, but ${getChannelIcon(topByRevenue.channel)} ${topByRevenue.channel} generates more revenue. Consider promoting higher-value products on ${topByRevenue.channel}.`;
        }

        if (topByCVR.cvr > 0 && topByCVR.channel !== topByClicks.channel) {
            return `${getChannelIcon(topByCVR.channel)} ${topByCVR.channel} has the best conversion rate (${topByCVR.cvr}%). Focus on increasing traffic to this channel for maximum ROI.`;
        }

        return `${getChannelIcon(bestChannel.channel)} ${bestChannel.channel} is your top performer. Keep optimizing content for this channel.`;
    };

    return (
        <div className="space-y-6">
            {/* Channel Comparison Table */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-afflyt-cyan-400" />
                    Channel Performance Comparison
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Channel</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Clicks</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Conversions</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Revenue</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">CVR</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">EPC</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map((channel, index) => (
                                <tr
                                    key={channel.channel}
                                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                                        channel.channel === bestChannel.channel ? 'bg-afflyt-cyan-500/5' : ''
                                    }`}
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getChannelColor(channel.channel)} flex items-center justify-center text-lg`}>
                                                {getChannelIcon(channel.channel)}
                                            </div>
                                            <div>
                                                <span className="text-white font-medium capitalize">
                                                    {channel.channel}
                                                </span>
                                                {channel.channel === bestChannel.channel && (
                                                    <span className="ml-2 px-2 py-0.5 bg-afflyt-cyan-500/20 text-afflyt-cyan-400 text-xs rounded">
                                                        Top
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-white font-mono">{channel.clicks.toLocaleString()}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-white font-mono">{channel.conversions}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-emerald-400 font-mono">€{channel.revenue.toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className={`font-mono ${channel.cvr >= 3 ? 'text-emerald-400' : channel.cvr >= 1 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {channel.cvr}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-white font-mono">€{channel.epc.toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${getChannelColor(channel.channel)} rounded-full`}
                                                    style={{ width: `${channel.clicksPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-400 text-sm font-mono w-10">
                                                {channel.clicksPercent}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-white/20">
                                <td className="py-4 px-4 text-gray-400 font-medium">Total</td>
                                <td className="py-4 px-4 text-right text-white font-mono font-semibold">
                                    {totals.clicks.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-right text-white font-mono font-semibold">
                                    {channels.reduce((sum, ch) => sum + ch.conversions, 0)}
                                </td>
                                <td className="py-4 px-4 text-right text-emerald-400 font-mono font-semibold">
                                    €{totals.revenue.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 text-right text-gray-400">-</td>
                                <td className="py-4 px-4 text-right text-gray-400">-</td>
                                <td className="py-4 px-4 text-right text-gray-400">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </GlassCard>

            {/* Insight Card */}
            <GlassCard className="p-6 bg-gradient-to-br from-afflyt-cyan-500/10 to-blue-500/5 border-afflyt-cyan-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-afflyt-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-afflyt-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-1">AI Insight</h4>
                        <p className="text-gray-300 text-sm">{generateInsight()}</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
