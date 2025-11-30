'use client';

import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
    User,
    CreditCard,
    Key,
    Bell,
    Shield,
    ArrowLeft,
    Settings,
    Tag,
    Sparkles
} from 'lucide-react';
import { CommandBar } from '@/components/navigation/CommandBar';

interface SettingsTab {
    key: string;
    icon: React.ElementType;
    path: string;
}

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('settings');

    const tabs: SettingsTab[] = [
        { key: 'profile', icon: User, path: `/${locale}/settings/profile` },
        { key: 'billing', icon: CreditCard, path: `/${locale}/settings/billing` },
        { key: 'apiKeys', icon: Key, path: `/${locale}/settings/api-keys` },
        { key: 'affiliateTags', icon: Tag, path: `/${locale}/settings/affiliate-tags` },
        { key: 'notifications', icon: Bell, path: `/${locale}/settings/notifications` },
        { key: 'security', icon: Shield, path: `/${locale}/settings/security` },
        { key: 'tester', icon: Sparkles, path: `/${locale}/settings/tester` },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <>
            <CommandBar />
            <main className="pt-16 lg:pt-16 min-h-screen bg-afflyt-dark-100">
                {/* Settings Header */}
                <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
                    <div className="px-8 py-6">
                        <div className="flex items-center gap-4 mb-6">
                            <Link
                                href={`/${locale}/dashboard`}
                                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-afflyt-dark-100" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('title')}
                                    </h1>
                                    <p className="text-sm text-gray-400">
                                        {t('subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <nav className="flex items-center gap-1 overflow-x-auto pb-2 -mb-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const active = isActive(tab.path);

                                return (
                                    <Link
                                        key={tab.key}
                                        href={tab.path}
                                        className={`relative flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all whitespace-nowrap ${
                                            active
                                                ? 'bg-afflyt-dark-100 text-afflyt-cyan-400 border-t border-l border-r border-afflyt-glass-border'
                                                : 'text-gray-400 hover:text-white hover:bg-afflyt-glass-white'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {t(`tabs.${tab.key}`)}
                                        </span>
                                        {active && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-afflyt-dark-100" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </>
    );
}
