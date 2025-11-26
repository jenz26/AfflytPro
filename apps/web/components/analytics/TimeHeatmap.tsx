'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Clock, TrendingUp } from 'lucide-react';

interface HeatmapCell {
    day: string;
    dayIndex: number;
    hour: number;
    value: number;
    intensity: number;
}

interface BestTime {
    day: string;
    hour: number;
    clicks: number;
}

interface TimeHeatmapProps {
    heatmap: HeatmapCell[];
    bestTime: BestTime | null;
    totalClicks: number;
    loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Get color based on intensity (0-100)
function getIntensityColor(intensity: number): string {
    if (intensity === 0) return 'bg-white/5';
    if (intensity < 25) return 'bg-blue-500/30';
    if (intensity < 50) return 'bg-cyan-500/50';
    if (intensity < 75) return 'bg-orange-500/60';
    return 'bg-red-500/70';
}

function formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
}

export function TimeHeatmap({ heatmap, bestTime, totalClicks, loading }: TimeHeatmapProps) {
    // Convert array to grid lookup
    const getCell = (dayIndex: number, hour: number): HeatmapCell | undefined => {
        return heatmap.find(c => c.dayIndex === dayIndex && c.hour === hour);
    };

    if (loading) {
        return (
            <GlassCard className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 w-48 bg-white/10 rounded mb-6" />
                    <div className="h-64 bg-white/5 rounded" />
                </div>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-6">
            {/* Heatmap */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    Clicks by Hour & Day
                </h3>

                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Hour labels */}
                        <div className="flex mb-2">
                            <div className="w-12" /> {/* Spacer for day labels */}
                            {HOURS.filter(h => h % 3 === 0).map(hour => (
                                <div
                                    key={hour}
                                    className="flex-1 text-center text-xs text-gray-500"
                                    style={{ minWidth: '40px' }}
                                >
                                    {formatHour(hour)}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        {DAYS.map((day, dayIndex) => (
                            <div key={day} className="flex items-center mb-1">
                                <div className="w-12 text-xs text-gray-400 font-medium">
                                    {day}
                                </div>
                                <div className="flex flex-1 gap-0.5">
                                    {HOURS.map(hour => {
                                        const cell = getCell(dayIndex, hour);
                                        const intensity = cell?.intensity || 0;
                                        const value = cell?.value || 0;
                                        const isBestTime = bestTime &&
                                            bestTime.day.toLowerCase() === day.toLowerCase().slice(0, 3) + day.slice(3) &&
                                            bestTime.hour === hour;

                                        return (
                                            <div
                                                key={hour}
                                                className={`
                                                    flex-1 h-6 rounded-sm transition-all cursor-pointer
                                                    ${getIntensityColor(intensity)}
                                                    ${isBestTime ? 'ring-2 ring-yellow-400' : ''}
                                                    hover:ring-1 hover:ring-white/50
                                                `}
                                                title={`${day} ${formatHour(hour)}: ${value} clicks`}
                                                style={{ minWidth: '12px' }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
                            <span className="text-xs text-gray-500">Low</span>
                            <div className="flex gap-1">
                                <div className="w-4 h-4 rounded bg-white/5" />
                                <div className="w-4 h-4 rounded bg-blue-500/30" />
                                <div className="w-4 h-4 rounded bg-cyan-500/50" />
                                <div className="w-4 h-4 rounded bg-orange-500/60" />
                                <div className="w-4 h-4 rounded bg-red-500/70" />
                            </div>
                            <span className="text-xs text-gray-500">High</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Best Time Card */}
            {bestTime && (
                <GlassCard className="p-6 bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border-orange-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-1">Optimization Tip</h4>
                            <p className="text-gray-300 text-sm">
                                Your audience is most active on <span className="text-orange-400 font-medium">{bestTime.day}</span> at{' '}
                                <span className="text-orange-400 font-medium">{formatHour(bestTime.hour)}</span>.
                                Schedule your posts during this window for maximum engagement.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                {bestTime.clicks} clicks recorded at this time slot
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* No data state */}
            {totalClicks === 0 && (
                <GlassCard className="p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">No Click Data Yet</h4>
                    <p className="text-gray-400 text-sm">
                        Start sharing your affiliate links to see when your audience is most active.
                    </p>
                </GlassCard>
            )}
        </div>
    );
}
