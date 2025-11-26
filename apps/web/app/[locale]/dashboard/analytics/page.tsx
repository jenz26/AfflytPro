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
    Lightbulb,
    LayoutDashboard,
    Radio,
    Package,
    CalendarClock,
    Brain,
    Lock
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    AnalyticsKPICard,
    RevenueChart,
    TopLinksTable,
    ChannelBreakdown,
    PeriodSelector,
    TimeHeatmap,
    ChannelDeepDive,
    ProductAnalytics,
    AIInsights,
    ExportDropdown
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

interface HeatmapData {
    heatmap: Array<{
        day: string;
        dayIndex: number;
        hour: number;
        value: number;
        intensity: number;
    }>;
    bestTime: { day: string; hour: number; clicks: number } | null;
    totalClicks: number;
    period: number;
}

interface ProductsData {
    byCategory: Array<{
        category: string;
        clicks: number;
        conversions: number;
        revenue: number;
        cvr: number;
        avgPrice: number;
    }>;
    byPriceRange: Array<{
        range: string;
        clicks: number;
        conversions: number;
        revenue: number;
        cvr: number;
    }>;
    topPerformers: Array<{
        productId: string;
        title: string;
        clicks: number;
        conversions: number;
        revenue: number;
        cvr: number;
        avgPrice: number;
    }>;
    totals: {
        totalProducts: number;
        totalClicks: number;
        totalConversions: number;
        totalRevenue: number;
    };
}

interface InsightsData {
    insights: Array<{
        type: 'success' | 'warning' | 'info' | 'opportunity';
        category: string;
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        actionable: boolean;
        action?: { label: string; href: string };
        metric?: { value: number; unit: string; trend?: 'up' | 'down' };
    }>;
    score: number;
    summary: {
        totalLinks: number;
        activeLinks: number;
        totalClicks: number;
        totalConversions: number;
        totalRevenue: number;
        cvr: number;
    };
    period: number;
}

export default function AnalyticsPage() {
    const locale = useLocale();
    const t = useTranslations('analytics');

    // State
    const [period, setPeriod] = useState('7d');
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userTier, setUserTier] = useState<string>('FREE');
    const [insightsLoading, setInsightsLoading] = useState(false);

    // Check if user has paid plan (BUSINESS or higher)
    const isPro = userTier !== 'FREE';

    // Tab definitions (dynamic based on tier)
    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, locked: false },
        { id: 'channels', label: 'Channels', icon: Radio, locked: false },
        { id: 'products', label: 'Products', icon: Package, locked: false },
        { id: 'time', label: 'Time Analysis', icon: CalendarClock, locked: false },
        { id: 'ai', label: 'AI Insights', icon: Brain, locked: !isPro, tier: 'PRO' },
    ];

    // Data states
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
    const [topLinks, setTopLinks] = useState<TopLinksData | null>(null);
    const [channels, setChannels] = useState<ChannelsData | null>(null);
    const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
    const [productsData, setProductsData] = useState<ProductsData | null>(null);
    const [insightsData, setInsightsData] = useState<InsightsData | null>(null);

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
            const [overviewRes, timeSeriesRes, topLinksRes, channelsRes, heatmapRes, productsRes] = await Promise.all([
                fetch(`${API_BASE}/analytics/overview?period=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/time-series?period=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/top-links?period=${period}&limit=5`, { headers }),
                fetch(`${API_BASE}/analytics/channels?period=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/heatmap?period=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/products?period=${period}`, { headers })
            ]);

            if (!overviewRes.ok || !timeSeriesRes.ok || !topLinksRes.ok || !channelsRes.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const [overviewData, timeSeriesData, topLinksData, channelsData, heatmapDataRes, productsDataRes] = await Promise.all([
                overviewRes.json(),
                timeSeriesRes.json(),
                topLinksRes.json(),
                channelsRes.json(),
                heatmapRes.ok ? heatmapRes.json() : null,
                productsRes.ok ? productsRes.json() : null
            ]);

            setOverview(overviewData);
            setTimeSeries(timeSeriesData);
            setTopLinks(topLinksData);
            setChannels(channelsData);
            setHeatmapData(heatmapDataRes);
            setProductsData(productsDataRes);

            // Fetch user profile to get plan
            try {
                const profileRes = await fetch(`${API_BASE}/auth/me`, { headers });
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setUserTier(profile.plan || 'FREE');
                }
            } catch (e) {
                console.error('Failed to fetch user profile:', e);
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch AI Insights (PRO only)
    const fetchInsights = async () => {
        if (!isPro) return;

        setInsightsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`${API_BASE}/analytics/insights?period=${period}`, { headers });

            if (res.ok) {
                const data = await res.json();
                setInsightsData(data);
            }
        } catch (err) {
            console.error('Failed to fetch insights:', err);
        } finally {
            setInsightsLoading(false);
        }
    };

    // Fetch on mount and when period changes
    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    // Fetch insights when tab changes to AI or when period changes (if PRO)
    useEffect(() => {
        if (activeTab === 'ai' && isPro && !insightsData) {
            fetchInsights();
        }
    }, [activeTab, isPro, period]);

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
                    <ExportDropdown period={period} />
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
            {insight && !loading && activeTab === 'overview' && (
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

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => !tab.locked && setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400 border border-afflyt-cyan-500/30'
                                    : tab.locked
                                        ? 'text-gray-500 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.locked && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                    <Lock className="w-3 h-3" />
                                    {tab.tier}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
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
                        <p className="text-lg font-mono text-white">
                            {heatmapData?.bestTime
                                ? `${heatmapData.bestTime.hour.toString().padStart(2, '0')}:00`
                                : '-'}
                        </p>
                        <p className="text-xs text-gray-500">Best Hour</p>
                    </GlassCard>
                </div>
            )}
                </>
            )}

            {/* Tab: Channels Deep Dive */}
            {activeTab === 'channels' && (
                <ChannelDeepDive
                    channels={channels?.channels || []}
                    totals={channels?.totals || { clicks: 0, revenue: 0 }}
                    loading={loading}
                />
            )}

            {/* Tab: Product Analytics */}
            {activeTab === 'products' && (
                <ProductAnalytics
                    byCategory={productsData?.byCategory || []}
                    byPriceRange={productsData?.byPriceRange || []}
                    topPerformers={productsData?.topPerformers || []}
                    totals={productsData?.totals || { totalProducts: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 }}
                    loading={loading}
                />
            )}

            {/* Tab: Time Analysis */}
            {activeTab === 'time' && (
                <TimeHeatmap
                    heatmap={heatmapData?.heatmap || []}
                    bestTime={heatmapData?.bestTime || null}
                    totalClicks={heatmapData?.totalClicks || 0}
                    loading={loading}
                />
            )}

            {/* Tab: AI Insights */}
            {activeTab === 'ai' && (
                isPro ? (
                    <AIInsights
                        insights={insightsData?.insights || []}
                        score={insightsData?.score || 0}
                        summary={insightsData?.summary || {
                            totalLinks: 0,
                            activeLinks: 0,
                            totalClicks: 0,
                            totalConversions: 0,
                            totalRevenue: 0,
                            cvr: 0
                        }}
                        loading={insightsLoading}
                    />
                ) : (
                    <GlassCard className="p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-afflyt-dark-900/80 to-afflyt-dark-900 z-10" />
                        <div className="relative z-20 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Insights</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Get personalized recommendations, anomaly detection, and revenue forecasting powered by AI.
                            </p>
                            <button className="px-6 py-3 bg-gradient-to-r from-afflyt-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-afflyt-cyan-600 hover:to-blue-700 transition-all">
                                Upgrade to PRO - €49/month
                            </button>
                            <p className="text-xs text-gray-500 mt-3">
                                Full access to advanced analytics, custom date ranges, and AI insights
                            </p>
                        </div>
                    </GlassCard>
                )
            )}
        </div>
    );
}
