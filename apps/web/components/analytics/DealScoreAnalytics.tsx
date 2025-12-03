'use client';

import { Gauge, TrendingUp, Award, Target, Flame, Star, ExternalLink } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface DealScoreData {
    distribution: Array<{
        range: string;
        count: number;
        percentage: number;
    }>;
    scoreConversionCorrelation: Array<{
        scoreRange: string;
        avgClicks: number;
        avgConversions: number;
        avgRevenue: number;
        cvr: number;
        totalLinks: number;
    }>;
    topScoringDeals: Array<{
        productId: string;
        title: string;
        asin: string;
        score: number;
        discount: number;
        imageUrl?: string;
        clicks: number;
        conversions: number;
        revenue: number;
    }>;
    scoreTrends: Array<{
        date: string;
        avgScore: number;
        maxScore: number;
        dealsFound: number;
    }>;
    summary: {
        avgScore: number;
        totalDeals: number;
        dealsAbove80: number;
        dealsAbove90: number;
        bestPerformingScoreRange: string;
    };
}

interface DealScoreAnalyticsProps {
    data: DealScoreData | null;
    loading?: boolean;
}

// Score badge component
function ScoreBadge({ score }: { score: number }) {
    const getScoreColor = (s: number) => {
        if (s >= 90) return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (s >= 80) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        if (s >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        if (s >= 40) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const getIcon = (s: number) => {
        if (s >= 90) return <Flame className="w-3 h-3" />;
        if (s >= 70) return <Star className="w-3 h-3" />;
        return null;
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-sm font-mono rounded border ${getScoreColor(score)}`}>
            {getIcon(score)}
            {score}
        </span>
    );
}

// Distribution bar component
function DistributionBar({ range, count, percentage, maxPercentage }: {
    range: string;
    count: number;
    percentage: number;
    maxPercentage: number;
}) {
    const width = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;

    const getBarColor = (range: string) => {
        if (range === '81-100') return 'bg-red-500';
        if (range === '61-80') return 'bg-orange-500';
        if (range === '41-60') return 'bg-yellow-500';
        if (range === '21-40') return 'bg-blue-500';
        return 'bg-gray-500';
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-16 font-mono">{range}</span>
            <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getBarColor(range)} transition-all duration-500`}
                    style={{ width: `${width}%` }}
                />
            </div>
            <span className="text-sm text-white font-mono w-12 text-right">{percentage}%</span>
            <span className="text-xs text-gray-500 w-16 text-right">({count} deals)</span>
        </div>
    );
}

export function DealScoreAnalytics({ data, loading = false }: DealScoreAnalyticsProps) {
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <GlassCard key={i} className="p-4 animate-pulse">
                            <div className="h-4 w-16 bg-white/10 rounded mb-2" />
                            <div className="h-8 w-20 bg-white/10 rounded" />
                        </GlassCard>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GlassCard className="p-6 animate-pulse h-64">
                        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-6 bg-white/10 rounded" />
                            ))}
                        </div>
                    </GlassCard>
                    <GlassCard className="p-6 animate-pulse h-64">
                        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-10 bg-white/10 rounded" />
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    }

    if (!data || data.summary.totalDeals === 0) {
        return (
            <GlassCard className="p-8 text-center">
                <Gauge className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Deal Score Data</h3>
                <p className="text-gray-400">
                    Create affiliate links for products with deal scores to see analytics here.
                </p>
            </GlassCard>
        );
    }

    const maxPercentage = Math.max(...data.distribution.map(d => d.percentage));

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Gauge className="w-4 h-4" />
                        <span className="text-xs">Avg Score</span>
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{data.summary.avgScore}</p>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Target className="w-4 h-4" />
                        <span className="text-xs">Total Deals</span>
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{data.summary.totalDeals}</p>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                        <Star className="w-4 h-4" />
                        <span className="text-xs">Score 80+</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-400 font-mono">{data.summary.dealsAbove80}</p>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs">Score 90+</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400 font-mono">{data.summary.dealsAbove90}</p>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-afflyt-cyan-400" />
                        Score Distribution
                    </h3>
                    <div className="space-y-3">
                        {data.distribution.map((item) => (
                            <DistributionBar
                                key={item.range}
                                range={item.range}
                                count={item.count}
                                percentage={item.percentage}
                                maxPercentage={maxPercentage}
                            />
                        ))}
                    </div>
                </GlassCard>

                {/* Score vs Conversion Rate */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Score vs Conversion Rate
                    </h3>
                    <div className="space-y-3">
                        {data.scoreConversionCorrelation.map((item) => (
                            <div
                                key={item.scoreRange}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                                <span className="text-sm text-gray-400 font-mono w-16">{item.scoreRange}</span>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-sm font-mono text-white">{item.cvr}%</p>
                                        <p className="text-xs text-gray-500">CVR</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-mono text-afflyt-cyan-400">{item.avgClicks}</p>
                                        <p className="text-xs text-gray-500">Avg Clicks</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-mono text-emerald-400">€{item.avgRevenue}</p>
                                        <p className="text-xs text-gray-500">Avg Revenue</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-mono text-gray-400">{item.totalLinks}</p>
                                        <p className="text-xs text-gray-500">Links</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {data.summary.bestPerformingScoreRange !== 'N/A' && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <p className="text-sm text-emerald-400">
                                <Award className="w-4 h-4 inline mr-1" />
                                Best performing score range: <strong>{data.summary.bestPerformingScoreRange}</strong>
                            </p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Top Scoring Deals */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Top Scoring Deals
                </h3>

                {data.topScoringDeals.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No deals with scores found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 border-b border-white/10">
                                    <th className="pb-3 font-medium">#</th>
                                    <th className="pb-3 font-medium">Score</th>
                                    <th className="pb-3 font-medium">Product</th>
                                    <th className="pb-3 font-medium text-right">Discount</th>
                                    <th className="pb-3 font-medium text-right">Clicks</th>
                                    <th className="pb-3 font-medium text-right">Conv.</th>
                                    <th className="pb-3 font-medium text-right">Revenue</th>
                                    <th className="pb-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topScoringDeals.map((deal, index) => (
                                    <tr key={deal.asin} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 text-gray-500 font-mono">{index + 1}</td>
                                        <td className="py-3">
                                            <ScoreBadge score={deal.score} />
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                {deal.imageUrl ? (
                                                    <img
                                                        src={deal.imageUrl}
                                                        alt={deal.title}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                                                        <span className="text-xs text-gray-500">N/A</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white truncate max-w-[200px]">{deal.title}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{deal.asin}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right">
                                            {deal.discount > 0 && (
                                                <span className="text-sm font-mono text-red-400">-{deal.discount}%</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right text-sm font-mono text-white">{deal.clicks}</td>
                                        <td className="py-3 text-right text-sm font-mono text-purple-400">{deal.conversions}</td>
                                        <td className="py-3 text-right text-sm font-mono text-emerald-400">€{deal.revenue}</td>
                                        <td className="py-3 text-right">
                                            <a
                                                href={`https://amazon.it/dp/${deal.asin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 hover:bg-white/10 rounded transition-colors inline-flex"
                                            >
                                                <ExternalLink className="w-4 h-4 text-gray-500 hover:text-white" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Score Trends */}
            {data.scoreTrends.length > 0 && (
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Score Trends
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {data.scoreTrends.slice(-7).map((day) => (
                            <div key={day.date} className="text-center p-3 bg-white/5 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">
                                    {new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short' })}
                                </p>
                                <p className="text-lg font-mono text-white">{day.avgScore}</p>
                                <p className="text-xs text-gray-500">{day.dealsFound} deals</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
