'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    DollarSign,
    MousePointerClick,
    Target,
    TrendingUp,
    RefreshCw,
    Download,
    Clock,
    Smartphone,
    Lightbulb
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    AnalyticsKPICard,
    RevenueChart,
    TopLinksTable,
    ChannelBreakdown,
    PeriodSelector
} from '@/components/analytics';
import { API_BASE } from '@/lib/api/config';

// Types
interface OverviewData {
    revenue: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
    clicks: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
    cvr: { current: number; change: number; benchmark: number; trend: 'up' | 'down' | 'stable' };
    epc: { current: number; change: number; industry: number; trend: 'up' | 'down' | 'stable' };
    conversions: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
    period: number;
}

interface TimeSeriesData {
    data: Array<{ date: string; clicks: number; revenue: number; conversions: number }>;
    period: number;
}

interface TopLinksData {
    links: Array<{
        id: string;
        shortCode: string;
        shortUrl: string;
        product: { title: string; imageUrl?: string; asin: string };
        metrics: { clicks: number; conversions: number; revenue: number; cvr: number; epc: number };
    }>;
    total: number;
    period: number;
}

interface ChannelsData {
    channels: Array<{
        channel: string;
        clicks: number;
        conversions: number;
        revenue: number;
        cvr: number;
        epc: number;
        clicksPercent: number;
        revenuePercent: number;
    }>;
    totals: { clicks: number; revenue: number };
    period: number;
}

export default function AnalyticsPage() {
    const locale = useLocale();
    const t = useTranslations('analytics');

    // State
    const [period, setPeriod] = useState('7d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
    const [topLinks, setTopLinks] = useState<TopLinksData | null>(null);
    const [channels, setChannels] = useState<ChannelsData | null>(null);

    // Fetch all analytics data
    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = `/${locale}/auth/login`;
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch all endpoints in parallel
            const [overviewRes, timeSeriesRes, topLinksRes, channelsRes] = await Promise.all([
                fetch(`${API_BASE}/analytics/overview?period=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/time-series?period=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/top-links?period=${period}&limit=5`, { headers }),
                fetch(`${API_BASE}/analytics/channels?period=${period}`, { headers })
            ]);

            if (!overviewRes.ok || !timeSeriesRes.ok || !topLinksRes.ok || !channelsRes.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const [overviewData, timeSeriesData, topLinksData, channelsData] = await Promise.all([
                overviewRes.json(),
                timeSeriesRes.json(),
                topLinksRes.json(),
                channelsRes.json()
            ]);

            setOverview(overviewData);
            setTimeSeries(timeSeriesData);
            setTopLinks(topLinksData);
            setChannels(channelsData);
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when period changes
    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    // Generate insight based on data
    const generateInsight = () => {
        if (!overview || !timeSeries) return null;

        if (overview.clicks.current === 0) {
            return {
                type: 'info',
                message: 'Start generating affiliate links and sharing them to see your analytics here!'
            };
        }

        if (overview.cvr.current > overview.cvr.benchmark) {
            return {
                type: 'success',
                message: `Your conversion rate (${overview.cvr.current}%) is above the industry average (${overview.cvr.benchmark}%)! Keep up the great work.`
            };
        }

        if (overview.clicks.trend === 'down') {
            return {
                type: 'warning',
                message: 'Your clicks are trending down. Consider posting more deals or trying different products.'
            };
        }

        return {
            type: 'info',
            message: 'Your performance is on track. Continue optimizing your channels for better results.'
        };
    };

    const insight = generateInsight();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics Intelligence Center</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Transform data into revenue-generating decisions
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <PeriodSelector value={period} onChange={setPeriod} />
                    <button
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && !overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <GlassCard key={i} className="p-5 animate-pulse">
                            <div className="h-8 w-8 bg-white/10 rounded-lg mb-4" />
                            <div className="h-8 w-24 bg-white/10 rounded mb-2" />
                            <div className="h-4 w-16 bg-white/10 rounded" />
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* KPI Cards */}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnalyticsKPICard
                        title="Revenue"
                        icon={DollarSign}
                        value={`€${overview.revenue.current.toFixed(2)}`}
                        change={overview.revenue.change}
                        trend={overview.revenue.trend}
                        color="green"
                        tooltip="Total affiliate commission earned"
                    />
                    <AnalyticsKPICard
                        title="Clicks"
                        icon={MousePointerClick}
                        value={overview.clicks.current.toLocaleString()}
                        change={overview.clicks.change}
                        trend={overview.clicks.trend}
                        color="cyan"
                        tooltip="Total link clicks"
                    />
                    <AnalyticsKPICard
                        title="CVR"
                        icon={Target}
                        value={`${overview.cvr.current}%`}
                        change={overview.cvr.change}
                        trend={overview.cvr.trend}
                        benchmark={{ value: overview.cvr.benchmark, label: 'Benchmark' }}
                        color="purple"
                        tooltip="Conversion Rate - percentage of clicks that convert to sales"
                    />
                    <AnalyticsKPICard
                        title="EPC"
                        icon={TrendingUp}
                        value={`€${overview.epc.current.toFixed(2)}`}
                        change={overview.epc.change}
                        trend={overview.epc.trend}
                        benchmark={{ value: overview.epc.industry, label: 'Industry' }}
                        color="orange"
                        tooltip="Earnings Per Click - average revenue per click"
                    />
                </div>
            )}

            {/* AI Insight */}
            {insight && !loading && (
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                    insight.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : insight.type === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/20'
                }`}>
                    <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        insight.type === 'success'
                            ? 'text-emerald-400'
                            : insight.type === 'warning'
                                ? 'text-yellow-400'
                                : 'text-afflyt-cyan-400'
                    }`} />
                    <p className="text-sm text-gray-300">{insight.message}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - Takes 2 columns */}
                <div className="lg:col-span-2">
                    {timeSeries && (
                        <RevenueChart
                            data={timeSeries.data}
                            title="Revenue & Clicks Trend"
                            showRevenue={true}
                            showClicks={true}
                        />
                    )}
                </div>

                {/* Channel Breakdown */}
                <div>
                    {channels && (
                        <ChannelBreakdown
                            channels={channels.channels}
                            totals={channels.totals}
                            locked={false} // Set to true for FREE tier users
                        />
                    )}
                </div>
            </div>

            {/* Top Links Table */}
            {topLinks && (
                <TopLinksTable
                    links={topLinks.links}
                    title="Top Performing Links"
                    showViewAll={topLinks.total > 5}
                    onViewAll={() => {
                        // Navigate to links page
                        window.location.href = `/${locale}/dashboard/links`;
                    }}
                />
            )}

            {/* Quick Stats Footer */}
            {overview && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4 text-center">
                        <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-lg font-mono text-white">{overview.period}d</p>
                        <p className="text-xs text-gray-500">Period Analyzed</p>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <Target className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-lg font-mono text-white">{overview.conversions.current}</p>
                        <p className="text-xs text-gray-500">Conversions</p>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <Smartphone className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-lg font-mono text-white">-</p>
                        <p className="text-xs text-gray-500">Top Device</p>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-lg font-mono text-white">-</p>
                        <p className="text-xs text-gray-500">Best Hour</p>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
