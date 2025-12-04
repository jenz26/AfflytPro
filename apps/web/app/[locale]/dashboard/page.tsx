'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Shield, Zap, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { HeroSection, HeroData } from '@/components/dashboard/HeroSection';
import { StatusCard, AutomationsCardData, ChannelsCardData, PerformanceCardData } from '@/components/dashboard/StatusCard';
import { ActionSuggestions, Suggestion } from '@/components/dashboard/ActionSuggestions';
import { DealFeed, Deal } from '@/components/dashboard/DealFeed';
import { ActivityLog, Activity as ActivityItem } from '@/components/dashboard/ActivityLog';
import { ImportBanner } from '@/components/settings/amazon-import';
import { API_BASE } from '@/lib/api/config';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DashboardData {
    hero: HeroData;
    automations: Array<{
        id: string;
        name: string;
        status: 'active' | 'paused' | 'error' | 'incomplete';
        lastRun?: string;
        dealsFound24h: number;
    }>;
    channels: Array<{
        id: string;
        name: string;
        platform: string;
        status: 'online' | 'offline' | 'error';
        lastActivity?: string;
    }>;
    performance: {
        clicks: number;
        revenue: number;
        trend: number;
        sparkline: number[];
    };
    suggestions: Suggestion[];
    recentDeals: Deal[];
    activities: ActivityItem[];
    accountData: {
        plan: string;
        planDisplay?: string;
        ttl: number;
        ttlDisplay?: string;
        limits: {
            rules: { used: number; max: number | string };
            activeRules?: { used: number; max: number | string };
            offers: { used: number; max: number | string };
            channels: { used: number; max: number | string };
        };
        features?: {
            aiCopy: boolean;
            abTesting: boolean;
            customTemplates: boolean;
            analytics: string;
        };
        credits: {
            used: number;
            total: number;
            remaining: number;
            daysRemaining: number;
        };
    };
    onboardingProgress?: {
        channelConnected: boolean;
        credentialsSet: boolean;
        automationCreated: boolean;
    };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function DashboardPage() {
    const locale = useLocale();
    const t = useTranslations('dashboard');
    const tAccount = useTranslations('dashboard.account');

    // State
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = `/${locale}/auth/login`;
                    return;
                }

                const response = await fetch(`${API_BASE}/user/dashboard/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();
                setDashboardData(data);
                setLoading(false);
            } catch (err: any) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [locale]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">{t('loading')}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !dashboardData) {
        return (
            <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-2">{t('error')}</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    // Build card data
    const automationsCardData: AutomationsCardData = {
        type: 'automations',
        items: dashboardData.automations,
        activeCount: dashboardData.automations.filter(a => a.status === 'active').length,
        totalCount: dashboardData.automations.length
    };

    const channelsCardData: ChannelsCardData = {
        type: 'channels',
        items: dashboardData.channels
    };

    const performanceCardData: PerformanceCardData = {
        type: 'performance',
        clicks: dashboardData.performance.clicks,
        revenue: dashboardData.performance.revenue,
        trend: dashboardData.performance.trend,
        sparkline: dashboardData.performance.sparkline
    };

    // North Star Metric
    const WAA = dashboardData.automations.filter(a => a.status === 'active').length;
    const WAATarget = 5;

    return (
        <div className="min-h-screen bg-afflyt-dark-100">
            {/* Header with Account Status */}
            <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-afflyt-dark-100" />
                                </div>
                                {t('title')}
                            </h1>
                            <p className="text-gray-400 mt-1">{t('subtitle')}</p>
                        </div>

                        {/* Account Status Badges */}
                        <div className="flex items-center gap-4">
                            {/* Plan & TTL */}
                            <GlassCard className="px-4 py-3" padding="none">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-afflyt-plasma-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">{tAccount('plan')} {dashboardData.accountData.planDisplay || dashboardData.accountData.plan}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-white font-mono">
                                                {dashboardData.accountData.ttlDisplay || `${dashboardData.accountData.ttl}h`}
                                            </span>
                                            <span className="text-xs text-afflyt-cyan-400">{tAccount('remaining')}</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* North Star Metric - WAA */}
                            <GlassCard className="px-4 py-3 border-afflyt-cyan-500/30" padding="none">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-afflyt-cyan-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">{tAccount('weeklyActive')}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-white font-mono">{WAA}/{WAATarget}</span>
                                            <span className="text-xs text-afflyt-cyan-400">{tAccount('automations')}</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* System Status */}
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                                <span className="text-sm text-afflyt-profit-400">{tAccount('systemActive')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
                {/* Hero Section */}
                <HeroSection data={dashboardData.hero} />

                {/* Amazon Import Banner */}
                <ImportBanner />

                {/* Status Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <StatusCard data={automationsCardData} />
                    <StatusCard
                        data={channelsCardData}
                        onAddClick={() => window.location.href = `/${locale}/dashboard/channels`}
                    />
                    <StatusCard data={performanceCardData} />
                </div>

                {/* Action Suggestions */}
                {dashboardData.suggestions.length > 0 && (
                    <ActionSuggestions suggestions={dashboardData.suggestions} maxVisible={3} />
                )}

                {/* Bottom Grid: Deals & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DealFeed
                        deals={dashboardData.recentDeals}
                        maxVisible={5}
                    />
                    <ActivityLog
                        activities={dashboardData.activities}
                        maxVisible={6}
                    />
                </div>
            </div>
        </div>
    );
}
