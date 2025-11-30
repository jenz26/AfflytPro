'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    User,
    CreditCard,
    Key,
    Bell,
    Shield,
    ChevronRight,
    Zap,
    Loader2,
    Tag,
    Sparkles
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { API_BASE } from '@/lib/api/config';
import { removeAuthToken } from '@/lib/auth';

interface SettingsCardData {
    key: string;
    icon: React.ElementType;
    path: string;
    color: string;
    stat?: string;
}

interface UserProfile {
    name: string | null;
    email: string;
    plan: string;
    createdAt: string;
}

interface UserStats {
    ttlUsed: number;
    channels: number;
    automations: number;
    credentials: number;
    affiliateTags: number;
}

export default function SettingsHubPage() {
    const locale = useLocale();
    const t = useTranslations('settings');
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userStats, setUserStats] = useState<UserStats>({
        ttlUsed: 0,
        channels: 0,
        automations: 0,
        credentials: 0,
        affiliateTags: 0,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push(`/${locale}/auth/login`);
                    return;
                }

                // Fetch user profile
                const profileRes = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!profileRes.ok) {
                    if (profileRes.status === 401) {
                        removeAuthToken();
                        router.push(`/${locale}/auth/login`);
                        return;
                    }
                    throw new Error('Failed to fetch profile');
                }

                const profileData = await profileRes.json();
                setUserProfile(profileData.user);

                // Fetch channels count
                try {
                    const channelsRes = await fetch(`${API_BASE}/user/channels`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (channelsRes.ok) {
                        const channelsData = await channelsRes.json();
                        setUserStats(prev => ({
                            ...prev,
                            channels: channelsData.channels?.length || 0,
                        }));
                    }
                } catch (e) {
                    console.error('Failed to fetch channels', e);
                }

                // Fetch credentials count
                try {
                    const credentialsRes = await fetch(`${API_BASE}/user/credentials`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (credentialsRes.ok) {
                        const credentialsData = await credentialsRes.json();
                        setUserStats(prev => ({
                            ...prev,
                            credentials: Array.isArray(credentialsData) ? credentialsData.length : 0,
                        }));
                    }
                } catch (e) {
                    console.error('Failed to fetch credentials', e);
                }

                // Fetch affiliate tags count
                try {
                    const tagsRes = await fetch(`${API_BASE}/user/affiliate-tags`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (tagsRes.ok) {
                        const tagsData = await tagsRes.json();
                        setUserStats(prev => ({
                            ...prev,
                            affiliateTags: Array.isArray(tagsData) ? tagsData.length : 0,
                        }));
                    }
                } catch (e) {
                    console.error('Failed to fetch affiliate tags', e);
                }

            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [locale, router]);

    // Get user initials for avatar
    const getInitials = (name: string | null, email: string): string => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    // Format member since date
    const formatMemberSince = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    };

    const cards: SettingsCardData[] = [
        {
            key: 'profile',
            icon: User,
            path: `/${locale}/settings/profile`,
            color: 'from-blue-500 to-blue-600',
        },
        {
            key: 'billing',
            icon: CreditCard,
            path: `/${locale}/settings/billing`,
            color: 'from-afflyt-profit-400 to-afflyt-profit-500',
            stat: userProfile?.plan?.toUpperCase() || 'FREE'
        },
        {
            key: 'apiKeys',
            icon: Key,
            path: `/${locale}/settings/api-keys`,
            color: 'from-yellow-500 to-orange-500',
            stat: userStats.credentials.toString()
        },
        {
            key: 'affiliateTags',
            icon: Tag,
            path: `/${locale}/settings/affiliate-tags`,
            color: 'from-orange-500 to-amber-500',
            stat: userStats.affiliateTags.toString()
        },
        {
            key: 'notifications',
            icon: Bell,
            path: `/${locale}/settings/notifications`,
            color: 'from-pink-500 to-rose-500',
        },
        {
            key: 'security',
            icon: Shield,
            path: `/${locale}/settings/security`,
            color: 'from-red-500 to-red-600',
        },
        {
            key: 'tester',
            icon: Sparkles,
            path: `/${locale}/settings/tester`,
            color: 'from-purple-500 to-pink-500',
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-8">
                <GlassCard className="p-6 border-afflyt-cyan-500/30 bg-gradient-to-r from-afflyt-cyan-500/5 to-blue-600/5">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-afflyt-cyan-400 animate-spin" />
                    </div>
                </GlassCard>
            </div>
        );
    }

    if (!userProfile) {
        return null;
    }

    return (
        <div className="space-y-8">
            {/* Quick Stats Banner */}
            <GlassCard className="p-6 border-afflyt-cyan-500/30 bg-gradient-to-r from-afflyt-cyan-500/5 to-blue-600/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {getInitials(userProfile.name, userProfile.email)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {userProfile.name || userProfile.email.split('@')[0]}
                            </h2>
                            <p className="text-gray-400 text-sm">{userProfile.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-semibold rounded">
                                    {userProfile.plan?.toUpperCase() || 'FREE'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {t('hub.memberSince', { date: formatMemberSince(userProfile.createdAt) })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-afflyt-cyan-400 font-mono">{userStats.ttlUsed}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('hub.ttlUsed')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-afflyt-profit-400 font-mono">{userStats.channels}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('hub.channels')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white font-mono">{userStats.automations}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('hub.automations')}</div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link key={card.key} href={card.path}>
                            <GlassCard className="p-6 hover:border-afflyt-cyan-500/40 transition-all group cursor-pointer h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    {card.stat && (
                                        <span className="px-2 py-1 bg-afflyt-glass-white text-white text-xs font-mono rounded">
                                            {card.stat}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-afflyt-cyan-400 transition-colors">
                                    {t(`tabs.${card.key}`)}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {t(`hub.descriptions.${card.key}`)}
                                </p>
                                <div className="flex items-center text-afflyt-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    {t('hub.manage')}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </GlassCard>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-afflyt-cyan-400" />
                    {t('hub.quickActions')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 bg-afflyt-dark-50 hover:bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border transition-colors text-left">
                        <div className="text-sm font-medium text-white mb-1">{t('hub.actions.exportData')}</div>
                        <div className="text-xs text-gray-500">{t('hub.actions.exportDataDesc')}</div>
                    </button>
                    <button className="p-4 bg-afflyt-dark-50 hover:bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border transition-colors text-left">
                        <div className="text-sm font-medium text-white mb-1">{t('hub.actions.downloadInvoices')}</div>
                        <div className="text-xs text-gray-500">{t('hub.actions.downloadInvoicesDesc')}</div>
                    </button>
                    <button className="p-4 bg-afflyt-dark-50 hover:bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border transition-colors text-left">
                        <div className="text-sm font-medium text-white mb-1">{t('hub.actions.contactSupport')}</div>
                        <div className="text-xs text-gray-500">{t('hub.actions.contactSupportDesc')}</div>
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
