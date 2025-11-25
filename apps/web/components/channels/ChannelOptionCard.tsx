'use client';

import { LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

export type ChannelDifficulty = 'easy' | 'medium' | 'advanced';

interface ChannelOptionCardProps {
    icon: LucideIcon;
    name: string;
    description: string;
    difficulty: ChannelDifficulty;
    timeEstimate: string;
    difficultyLabel: string;
    recommended?: boolean;
    recommendedLabel?: string;
    comingSoon?: boolean;
    comingSoonLabel?: string;
    connectLabel: string;
    onConnect: () => void;
}

export function ChannelOptionCard({
    icon: Icon,
    name,
    description,
    difficulty,
    timeEstimate,
    difficultyLabel,
    recommended = false,
    recommendedLabel,
    comingSoon = false,
    comingSoonLabel,
    connectLabel,
    onConnect,
}: ChannelOptionCardProps) {
    const difficultyColors = {
        easy: 'bg-afflyt-profit-400/20 text-afflyt-profit-400',
        medium: 'bg-yellow-500/20 text-yellow-400',
        advanced: 'bg-red-500/20 text-red-400',
    };

    return (
        <GlassCard
            className={`relative p-6 transition-all duration-300 ${
                comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-afflyt-cyan-500/50 hover:bg-afflyt-glass-white cursor-pointer'
            } ${recommended && !comingSoon ? 'ring-2 ring-afflyt-cyan-500/30 border-afflyt-cyan-500/40' : ''}`}
        >
            {/* Recommended Badge */}
            {recommended && !comingSoon && recommendedLabel && (
                <div className="absolute -top-2 -right-2 z-10">
                    <span className="px-2.5 py-1 bg-gradient-to-r from-afflyt-cyan-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                        {recommendedLabel}
                    </span>
                </div>
            )}

            {/* Coming Soon Badge */}
            {comingSoon && comingSoonLabel && (
                <div className="absolute -top-2 -right-2 z-10">
                    <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
                        {comingSoonLabel}
                    </span>
                </div>
            )}

            {/* Icon */}
            <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    comingSoon
                        ? 'bg-gray-700/30 text-gray-600'
                        : 'bg-gradient-to-br from-afflyt-cyan-500/20 to-blue-600/20 text-afflyt-cyan-400 group-hover:scale-110'
                }`}
            >
                <Icon className="w-7 h-7" />
            </div>

            {/* Content */}
            <div className="mb-4">
                <h4 className="text-lg font-bold text-white mb-2">{name}</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                    {description}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${difficultyColors[difficulty]}`}>
                        {difficultyLabel}
                    </span>
                    <span className="text-gray-500">~{timeEstimate}</span>
                </div>
            </div>

            {/* Action Button */}
            {!comingSoon ? (
                <CyberButton
                    onClick={onConnect}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                >
                    {connectLabel}
                </CyberButton>
            ) : (
                <CyberButton
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    disabled
                >
                    {comingSoonLabel}
                </CyberButton>
            )}
        </GlassCard>
    );
}
