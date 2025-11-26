'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';

interface DataPoint {
    date: string;
    clicks: number;
    revenue: number;
    conversions: number;
}

interface RevenueChartProps {
    data: DataPoint[];
    title?: string;
    showRevenue?: boolean;
    showClicks?: boolean;
    showConversions?: boolean;
}

export function RevenueChart({
    data,
    title = 'Revenue & Clicks Trend',
    showRevenue = true,
    showClicks = true,
    showConversions = false
}: RevenueChartProps) {
    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-afflyt-dark-100 border border-white/10 rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(label)}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-400">{entry.name}:</span>
                            <span className="font-mono text-white">
                                {entry.name === 'Revenue' ? `€${entry.value}` : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <div className="flex items-center gap-4 text-xs">
                    {showRevenue && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            <span className="text-gray-400">Revenue</span>
                        </div>
                    )}
                    {showClicks && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-afflyt-cyan-400" />
                            <span className="text-gray-400">Clicks</span>
                        </div>
                    )}
                    {showConversions && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-400" />
                            <span className="text-gray-400">Conversions</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `€${value}`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showRevenue && (
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#10B981"
                                strokeWidth={2}
                                fill="url(#revenueGradient)"
                            />
                        )}
                        {showClicks && (
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="clicks"
                                name="Clicks"
                                stroke="#06B6D4"
                                strokeWidth={2}
                                fill="url(#clicksGradient)"
                            />
                        )}
                        {showConversions && (
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="conversions"
                                name="Conversions"
                                stroke="#A855F7"
                                strokeWidth={2}
                                dot={false}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-500">No data available for this period</p>
                </div>
            )}
        </GlassCard>
    );
}
