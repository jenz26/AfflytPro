'use client';

import { useTranslations } from 'next-intl';
import {
    Send,
    MessageSquare,
    Facebook,
    Twitter,
    Linkedin,
    Zap,
    Clock,
    TrendingUp,
    Users,
    HelpCircle,
    ExternalLink
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ChannelOptionCard, ChannelDifficulty } from './ChannelOptionCard';

interface ChannelsEmptyStateProps {
    onSelectPlatform: (platform: string) => void;
}

interface ChannelOption {
    platform: string;
    icon: any;
    difficulty: ChannelDifficulty;
    timeEstimate: string;
    recommended?: boolean;
    comingSoon?: boolean;
}

const channelOptions: ChannelOption[] = [
    {
        platform: 'telegram',
        icon: Send,
        difficulty: 'easy',
        timeEstimate: '3 min',
        recommended: true,
    },
    {
        platform: 'discord',
        icon: MessageSquare,
        difficulty: 'easy',
        timeEstimate: '2 min',
    },
    {
        platform: 'facebook',
        icon: Facebook,
        difficulty: 'medium',
        timeEstimate: '5 min',
        comingSoon: true,
    },
    {
        platform: 'twitter',
        icon: Twitter,
        difficulty: 'medium',
        timeEstimate: '5 min',
        comingSoon: true,
    },
    {
        platform: 'linkedin',
        icon: Linkedin,
        difficulty: 'medium',
        timeEstimate: '5 min',
        comingSoon: true,
    },
    {
        platform: 'webhook',
        icon: Zap,
        difficulty: 'advanced',
        timeEstimate: '10 min',
        comingSoon: true,
    },
];

export function ChannelsEmptyState({ onSelectPlatform }: ChannelsEmptyStateProps) {
    const t = useTranslations('channels');

    const benefits = [
        { icon: Clock, key: 'autoPublish' },
        { icon: TrendingUp, key: 'optimizedReach' },
        { icon: Users, key: 'multiChannel' },
    ];

    return (
        <div className="space-y-8">
            {/* Hero Card */}
            <GlassCard className="relative p-8 overflow-hidden border-afflyt-cyan-500/30 bg-gradient-to-br from-afflyt-cyan-500/5 to-blue-600/5">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                            backgroundSize: '32px 32px',
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-3xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-afflyt-cyan-500/20 text-afflyt-cyan-400 text-xs font-semibold rounded-full mb-4">
                        <Zap className="w-3.5 h-3.5" />
                        {t('emptyState.badge')}
                    </span>

                    <h2 className="text-3xl font-bold text-white mb-3">
                        {t('emptyState.title')}
                    </h2>
                    <p className="text-lg text-gray-400 leading-relaxed mb-6">
                        {t('emptyState.description')}
                    </p>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {benefits.map(({ icon: BenefitIcon, key }) => (
                            <div
                                key={key}
                                className="flex items-start gap-3 p-4 bg-afflyt-dark-50/50 rounded-lg border border-afflyt-glass-border"
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center">
                                    <BenefitIcon className="w-5 h-5 text-afflyt-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-white font-semibold text-sm mb-1">
                                        {t(`emptyState.benefits.${key}.title`)}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        {t(`emptyState.benefits.${key}.description`)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Channel Options Grid */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    {t('emptyState.selectChannel')}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                    {t('emptyState.selectChannelNote')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channelOptions.map((option) => (
                        <ChannelOptionCard
                            key={option.platform}
                            icon={option.icon}
                            name={t(`platforms.${option.platform}.name`)}
                            description={t(`platforms.${option.platform}.description`)}
                            difficulty={option.difficulty}
                            timeEstimate={option.timeEstimate}
                            difficultyLabel={t(`difficulty.${option.difficulty}`)}
                            recommended={option.recommended}
                            recommendedLabel={option.recommended ? t('recommended') : undefined}
                            comingSoon={option.comingSoon}
                            comingSoonLabel={option.comingSoon ? t('comingSoon') : undefined}
                            connectLabel={t('connect', { platform: t(`platforms.${option.platform}.name`) })}
                            onConnect={() => onSelectPlatform(option.platform)}
                        />
                    ))}
                </div>
            </div>

            {/* Help Section */}
            <div className="flex items-start gap-4 p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">
                        {t('emptyState.helpBox.title')}
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                        {t('emptyState.helpBox.description')}
                    </p>
                    <a
                        href="https://telegram.org/blog/channels"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        {t('emptyState.helpBox.link')}
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
