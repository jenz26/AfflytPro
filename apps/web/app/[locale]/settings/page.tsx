'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    User,
    CreditCard,
    Send,
    Key,
    FileText,
    Bell,
    Shield,
    ChevronRight,
    Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface SettingsCardData {
    key: string;
    icon: React.ElementType;
    path: string;
    color: string;
    stat?: string;
}

export default function SettingsHubPage() {
    const locale = useLocale();
    const t = useTranslations('settings');

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
            stat: 'PRO'
        },
        {
            key: 'channels',
            icon: Send,
            path: `/${locale}/settings/channels`,
            color: 'from-afflyt-cyan-400 to-afflyt-cyan-600',
            stat: '3'
        },
        {
            key: 'apiKeys',
            icon: Key,
            path: `/${locale}/settings/api-keys`,
            color: 'from-yellow-500 to-orange-500',
            stat: '2'
        },
        {
            key: 'templates',
            icon: FileText,
            path: `/${locale}/settings/templates`,
            color: 'from-purple-500 to-purple-600',
            stat: '5'
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
    ];

    return (
        <div className="space-y-8">
            {/* Quick Stats Banner */}
            <GlassCard className="p-6 border-afflyt-cyan-500/30 bg-gradient-to-r from-afflyt-cyan-500/5 to-blue-600/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            M
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Marco R.</h2>
                            <p className="text-gray-400 text-sm">marco@contindigital.it</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-semibold rounded">
                                    PRO
                                </span>
                                <span className="text-xs text-gray-500">
                                    {t('hub.memberSince', { date: 'Oct 2024' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-afflyt-cyan-400 font-mono">847</div>
                            <div className="text-xs text-gray-500 uppercase">{t('hub.ttlUsed')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-afflyt-profit-400 font-mono">3</div>
                            <div className="text-xs text-gray-500 uppercase">{t('hub.channels')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white font-mono">12</div>
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
