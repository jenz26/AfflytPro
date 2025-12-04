'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Send, Clock, MousePointerClick, TrendingUp, MessageSquare, Users, Lightbulb } from 'lucide-react';

export interface TelegramChannelData {
    channelId: string;
    channelName: string;
    clicks: number;
    uniqueClicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    epc: number;
    uniqueMessages: number;
    linksPromoted: number;
    avgClicksPerMessage: number;
    avgTimeToClickMinutes: number | null;
    bestPostingHour: number;
    clicksByHour: number[];
}

export interface TelegramChannelsData {
    channels: TelegramChannelData[];
    totals: {
        clicks: number;
        uniqueClicks: number;
        conversions: number;
        revenue: number;
    };
    period: number;
}

interface TelegramChannelsAnalyticsProps {
    data: TelegramChannelsData | null;
    loading?: boolean;
}

function formatTimeToClick(minutes: number | null): string {
    if (minutes === null) return '-';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
}

function formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
}

export function TelegramChannelsAnalytics({ data, loading }: TelegramChannelsAnalyticsProps) {
    if (loading) {
        return (
            <GlassCard className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 w-64 bg-white/10 rounded mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded" />
                        ))}
                    </div>
                </div>
            </GlassCard>
        );
    }

    if (!data || data.channels.length === 0) {
        return (
            <GlassCard className="p-8 text-center">
                <Send className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">No Telegram Channel Data Yet</h4>
                <p className="text-gray-400 text-sm">
                    Once your links start getting clicks from Telegram channels, you'll see detailed analytics here.
                </p>
            </GlassCard>
        );
    }

    const { channels, totals } = data;

    // Find best performing channel by revenue
    const bestChannel = channels.reduce((best, ch) =>
        ch.revenue > best.revenue ? ch : best
    , channels[0]);

    // Find best time to click overall
    const overallClicksByHour = new Array(24).fill(0);
    channels.forEach(ch => {
        ch.clicksByHour.forEach((clicks, hour) => {
            overallClicksByHour[hour] += clicks;
        });
    });
    const bestOverallHour = overallClicksByHour.indexOf(Math.max(...overallClicksByHour));

    // Generate insight
    const generateInsight = () => {
        if (channels.length === 1) {
            const ch = channels[0];
            if (ch.avgTimeToClickMinutes !== null && ch.avgTimeToClickMinutes < 30) {
                return `Your audience in ${ch.channelName} responds quickly! Average time-to-click is just ${formatTimeToClick(ch.avgTimeToClickMinutes)}. This suggests high engagement.`;
            }
            return `${ch.channelName} generated ${ch.clicks} clicks from ${ch.uniqueMessages} posts. Post at ${formatHour(ch.bestPostingHour)} for best engagement.`;
        }

        // Multiple channels
        const mostEngaged = [...channels].sort((a, b) => b.avgClicksPerMessage - a.avgClicksPerMessage)[0];
        const quickestResponse = [...channels].filter(c => c.avgTimeToClickMinutes !== null).sort((a, b) =>
            (a.avgTimeToClickMinutes || 999) - (b.avgTimeToClickMinutes || 999)
        )[0];

        if (mostEngaged.avgClicksPerMessage > bestChannel.avgClicksPerMessage * 0.8 && mostEngaged.channelId !== bestChannel.channelId) {
            return `${mostEngaged.channelName} has the highest engagement (${mostEngaged.avgClicksPerMessage} clicks/message). Consider posting more frequently there.`;
        }

        if (quickestResponse && quickestResponse.avgTimeToClickMinutes && quickestResponse.avgTimeToClickMinutes < 30) {
            return `${quickestResponse.channelName} has the fastest audience response (${formatTimeToClick(quickestResponse.avgTimeToClickMinutes)}). This channel is ideal for flash deals.`;
        }

        return `${bestChannel.channelName} is your top performer with €${bestChannel.revenue.toFixed(2)} in revenue. Best posting time overall: ${formatHour(bestOverallHour)}.`;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <MousePointerClick className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{totals.clicks.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Total Clicks</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{totals.uniqueClicks.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Unique Visitors</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-400">€{totals.revenue.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">Revenue</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-afflyt-cyan-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-afflyt-cyan-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{formatHour(bestOverallHour)}</p>
                            <p className="text-xs text-gray-400">Best Post Time</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Channels Table */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-400" />
                    Telegram Channel Performance
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Channel</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Clicks</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Messages</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Clicks/Msg</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Time to Click</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Best Hour</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Revenue</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">CVR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map((channel) => (
                                <tr
                                    key={channel.channelId}
                                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                                        channel.channelId === bestChannel.channelId ? 'bg-blue-500/5' : ''
                                    }`}
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-afflyt-cyan-500 flex items-center justify-center">
                                                <Send className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <span className="text-white font-medium">
                                                    {channel.channelName}
                                                </span>
                                                {channel.channelId === bestChannel.channelId && (
                                                    <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                                        Top
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500">{channel.channelId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div>
                                            <span className="text-white font-mono">{channel.clicks.toLocaleString()}</span>
                                            <p className="text-xs text-gray-500">{channel.uniqueClicks} unique</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-white font-mono">{channel.uniqueMessages}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className={`font-mono ${
                                            channel.avgClicksPerMessage >= 10 ? 'text-emerald-400' :
                                            channel.avgClicksPerMessage >= 5 ? 'text-yellow-400' : 'text-gray-400'
                                        }`}>
                                            {channel.avgClicksPerMessage.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className={`font-mono ${
                                            channel.avgTimeToClickMinutes !== null && channel.avgTimeToClickMinutes < 30
                                                ? 'text-emerald-400'
                                                : 'text-gray-400'
                                        }`}>
                                            {formatTimeToClick(channel.avgTimeToClickMinutes)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-white font-mono">{formatHour(channel.bestPostingHour)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-emerald-400 font-mono">€{channel.revenue.toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className={`font-mono ${
                                            channel.cvr >= 3 ? 'text-emerald-400' :
                                            channel.cvr >= 1 ? 'text-yellow-400' : 'text-gray-400'
                                        }`}>
                                            {channel.cvr}%
                                        </span>
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
                                    {channels.reduce((sum, ch) => sum + ch.uniqueMessages, 0)}
                                </td>
                                <td className="py-4 px-4 text-right text-gray-400">-</td>
                                <td className="py-4 px-4 text-right text-gray-400">-</td>
                                <td className="py-4 px-4 text-right text-white font-mono">
                                    {formatHour(bestOverallHour)}
                                </td>
                                <td className="py-4 px-4 text-right text-emerald-400 font-mono font-semibold">
                                    €{totals.revenue.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 text-right text-gray-400">
                                    {totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(1) : 0}%
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </GlassCard>

            {/* Hour Distribution (mini heatmap) */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-afflyt-cyan-400" />
                    Clicks by Hour (All Channels)
                </h3>
                <div className="flex gap-1">
                    {overallClicksByHour.map((clicks, hour) => {
                        const maxClicks = Math.max(...overallClicksByHour);
                        const intensity = maxClicks > 0 ? (clicks / maxClicks) : 0;
                        return (
                            <div
                                key={hour}
                                className="flex-1 group relative"
                            >
                                <div
                                    className="h-12 rounded transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: `rgba(0, 229, 224, ${0.1 + intensity * 0.8})`,
                                    }}
                                />
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
                                    {hour % 6 === 0 ? `${hour}h` : ''}
                                </div>
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    {formatHour(hour)}: {clicks} clicks
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(0, 229, 224, 0.1)' }} />
                        <span>Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(0, 229, 224, 0.5)' }} />
                        <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(0, 229, 224, 0.9)' }} />
                        <span>High</span>
                    </div>
                </div>
            </GlassCard>

            {/* Insight Card */}
            <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-afflyt-cyan-500/5 border-blue-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-1">Telegram Insight</h4>
                        <p className="text-gray-300 text-sm">{generateInsight()}</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
