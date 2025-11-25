'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Activity,
    TrendingUp,
    Clock,
    Shield,
    Zap,
    DollarSign,
    Gauge,
    Sparkles,
    ChevronRight,
    BarChart3
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { OnboardingFlow } from '@/components/dashboard/OnboardingFlow';
import { KPIWidget } from '@/components/dashboard/KPIWidget';
import { API_BASE } from '@/lib/api/config';

export default function DashboardPage() {
    const locale = useLocale();
    const t = useTranslations('dashboard');
    const tKPI = useTranslations('dashboard.kpi');
    const tHotDeals = useTranslations('dashboard.hotDeals');
    const tQuickStats = useTranslations('dashboard.quickStats');
    const tStates = useTranslations('dashboard.states');
    const tAccount = useTranslations('dashboard.account');

    // State
    const [userState, setUserState] = useState<'new' | 'partial' | 'active'>('new');
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

                // Calculate user state
                const { onboardingProgress } = data;
                const steps = Object.values(onboardingProgress);
                const completed = steps.filter(Boolean).length;

                if (completed === 0) setUserState('new');
                else if (completed < 3) setUserState('partial');
                else setUserState('active');

                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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

    // No data fallback
    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">{t('error')}</p>
                </div>
            </div>
        );
    }

    const { onboardingProgress, accountData, performance, recentDeals } = dashboardData;

    // North Star Metric
    const WAA = performance.activeAutomations;
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
                            <p className="text-gray-400 mt-1">
                                {userState === 'new'
                                    ? tStates('new')
                                    : userState === 'partial'
                                        ? tStates('partial')
                                        : tStates('active')
                                }
                            </p>
                        </div>

                        {/* Account Status Badge */}
                        <div className="flex items-center gap-4">
                            {/* Plan & TTL */}
                            <GlassCard className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-afflyt-plasma-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">{tAccount('plan')} {accountData.plan}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-white font-mono">{accountData.ttl}h</span>
                                            <span className="text-xs text-afflyt-cyan-400">TTL</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* North Star Metric - WAA */}
                            <GlassCard className="px-4 py-3 border-afflyt-cyan-500/30">
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
                {/* Onboarding Section - Shows for new/partial users */}
                {userState !== 'active' && (
                    <OnboardingFlow
                        progress={onboardingProgress}
                        onProgressUpdate={() => { }}
                    />
                )}

                {/* KPI Grid - Always visible but enhanced for active users */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* Performance Widget */}
                    <KPIWidget
                        title={tKPI('totalPerformance')}
                        icon={TrendingUp}
                        mainValue={performance.totalClicks.toLocaleString()}
                        mainLabel={tKPI('totalClicks')}
                        subValue={`€${performance.revenue.toFixed(2)}`}
                        subLabel={tKPI('estimatedRevenue')}
                        trend={{
                            value: 23,
                            positive: true,
                            label: tKPI('vsLastWeek')
                        }}
                        sparkline={[40, 55, 45, 70, 65, 80, 75]}
                        color="cyan"
                    />

                    {/* Governance/Limits Widget */}
                    <KPIWidget
                        title={tKPI('limitsStatus')}
                        icon={Gauge}
                        mainValue={`${accountData.limits.rules.used}/${accountData.limits.rules.max}`}
                        mainLabel={tKPI('activeRules')}
                        subValue={`${accountData.limits.offers.used}/${accountData.limits.offers.max}`}
                        subLabel={tKPI('sentOffers')}
                        status={
                            accountData.limits.rules.used / accountData.limits.rules.max > 0.8
                                ? 'warning'
                                : 'good'
                        }
                        color="plasma"
                    />

                    {/* Afflyt Credits Widget */}
                    <KPIWidget
                        title={tKPI('afflytCredits')}
                        icon={DollarSign}
                        mainValue={`${accountData.credits?.used || 0}`}
                        mainLabel={tKPI('consumed')}
                        subValue={`${accountData.credits?.remaining || 0}`}
                        subLabel={tKPI('remaining')}
                        progress={{
                            value: accountData.credits ? (accountData.credits.used / accountData.credits.total) * 100 : 0,
                            label: `${accountData.credits?.daysRemaining || 30} ${tKPI('daysRemaining')}`
                        }}
                        color="profit"
                    />

                    {/* Last Activity Widget */}
                    <KPIWidget
                        title={tKPI('lastActivity')}
                        icon={Clock}
                        mainValue="15m fa"
                        mainLabel={tKPI('lastClick')}
                        subValue="2h fa"
                        subLabel={tKPI('lastDeal')}
                        activity={{
                            recentDeals: recentDeals
                        }}
                        color="cyan"
                    />
                </div>

                {/* Active User Dashboard Content */}
                {userState === 'active' && (
                    <>
                        {/* Hot Deals Preview */}
                        <GlassCard className="p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-orange-400" />
                                    {tHotDeals('title')}
                                </h2>
                                <CyberButton variant="secondary" size="sm">
                                    {tHotDeals('seeAll')}
                                    <ChevronRight className="w-4 h-4" />
                                </CyberButton>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {recentDeals.map((deal: any, index: number) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border hover:border-afflyt-cyan-500/40 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${deal.score >= 90
                                                    ? 'from-orange-400 to-red-500'
                                                    : 'from-afflyt-cyan-400 to-afflyt-cyan-600'
                                                    } flex items-center justify-center`}>
                                                    <span className="text-sm font-bold text-white font-mono">
                                                        {deal.score}
                                                    </span>
                                                </div>
                                                {deal.score >= 90 && (
                                                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                                                        {tHotDeals('hot')}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">{deal.time}</span>
                                        </div>
                                        <p className="text-sm text-white line-clamp-1">{deal.title}</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Quick Stats */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-afflyt-cyan-400" />
                                {tQuickStats('title')}
                            </h3>

                            <div className="grid grid-cols-4 gap-6">
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">{tQuickStats('dealsAnalyzed')}</span>
                                    <span className="text-2xl font-mono text-white mt-1">4,892</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">{tQuickStats('dealsPublished')}</span>
                                    <span className="text-2xl font-mono text-afflyt-cyan-400 mt-1">147</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">{tQuickStats('conversionRate')}</span>
                                    <span className="text-2xl font-mono text-afflyt-profit-400 mt-1">{performance.conversionRate}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-400">{tQuickStats('averageScore')}</span>
                                    <span className="text-2xl font-mono text-white mt-1">78.5</span>
                                </div>
                            </div>
                        </GlassCard>
                    </>
                )}
            </div>
        </div>
    );
}
