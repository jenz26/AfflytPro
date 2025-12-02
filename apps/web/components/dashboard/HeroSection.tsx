'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    Sparkles, Rocket, AlertTriangle, Pause, Flame, Clock
} from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type HeroType = 'welcome' | 'deals_found' | 'hot_deal' | 'warning' | 'idle' | 'paused';

export interface HeroData {
    type: HeroType;
    message: string;
    metric?: number;
    ctaLink: string;
    ctaLabel: string;
    secondaryCtaLink?: string;
    secondaryCtaLabel?: string;
}

interface HeroSectionProps {
    data: HeroData;
    userName?: string;
}

// ═══════════════════════════════════════════════════════════════
// HELPER - Get greeting based on time
// ═══════════════════════════════════════════════════════════════

function getGreeting(t: ReturnType<typeof useTranslations>): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greetings.morning');
    if (hour >= 12 && hour < 18) return t('greetings.afternoon');
    if (hour >= 18 && hour < 22) return t('greetings.evening');
    return t('greetings.night');
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function HeroSection({ data, userName }: HeroSectionProps) {
    const t = useTranslations('dashboard.hero');

    // Config per tipo di hero
    const heroConfig: Record<HeroType, {
        icon: typeof Sparkles;
        gradient: string;
        iconBg: string;
        borderColor: string;
    }> = {
        welcome: {
            icon: Rocket,
            gradient: 'from-afflyt-cyan-500/20 via-afflyt-cyan-500/5 to-transparent',
            iconBg: 'from-afflyt-cyan-400 to-afflyt-cyan-600',
            borderColor: 'border-afflyt-cyan-500/30'
        },
        deals_found: {
            icon: Sparkles,
            gradient: 'from-afflyt-cyan-500/20 via-afflyt-cyan-500/5 to-transparent',
            iconBg: 'from-afflyt-cyan-400 to-afflyt-cyan-600',
            borderColor: 'border-afflyt-cyan-500/30'
        },
        hot_deal: {
            icon: Flame,
            gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
            iconBg: 'from-orange-400 to-red-500',
            borderColor: 'border-orange-500/30'
        },
        warning: {
            icon: AlertTriangle,
            gradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
            iconBg: 'from-yellow-400 to-yellow-600',
            borderColor: 'border-yellow-500/30'
        },
        idle: {
            icon: Clock,
            gradient: 'from-gray-500/20 via-gray-500/5 to-transparent',
            iconBg: 'from-gray-400 to-gray-600',
            borderColor: 'border-gray-500/30'
        },
        paused: {
            icon: Pause,
            gradient: 'from-afflyt-plasma-500/20 via-afflyt-plasma-500/5 to-transparent',
            iconBg: 'from-afflyt-plasma-400 to-afflyt-plasma-600',
            borderColor: 'border-afflyt-plasma-500/30'
        }
    };

    const config = heroConfig[data.type];
    const IconComponent = config.icon;
    const greeting = getGreeting(t);

    return (
        <div className={`relative overflow-hidden rounded-xl bg-afflyt-dark-50 border ${config.borderColor} p-6 mb-6`}>
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} pointer-events-none`} />

            {/* Animated glow effect for hot_deal */}
            {data.type === 'hot_deal' && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 animate-pulse pointer-events-none" />
            )}

            <div className="relative z-10 flex items-center justify-between">
                {/* Left side - Message */}
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-7 h-7 text-white" />
                    </div>

                    <div>
                        <p className="text-sm text-gray-400 mb-1">
                            {greeting}{userName ? `, ${userName}` : ''}!
                        </p>
                        <h2 className="text-xl font-bold text-white">
                            {data.message}
                        </h2>
                        {data.metric !== undefined && (
                            <p className="text-sm text-gray-400 mt-1">
                                {t('lastUpdate', { time: '5 min' })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right side - CTAs */}
                <div className="flex items-center gap-3">
                    {data.secondaryCtaLink && data.secondaryCtaLabel && (
                        <Link href={data.secondaryCtaLink}>
                            <CyberButton variant="secondary">
                                {data.secondaryCtaLabel}
                            </CyberButton>
                        </Link>
                    )}
                    <Link href={data.ctaLink}>
                        <CyberButton variant="primary">
                            {data.ctaLabel}
                        </CyberButton>
                    </Link>
                </div>
            </div>
        </div>
    );
}
