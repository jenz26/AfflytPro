'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    Target, Flame, AlertTriangle, CreditCard, Rocket, Zap, Settings
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SuggestionType =
    | 'complete_setup'
    | 'hot_deal'
    | 'channel_issue'
    | 'low_credits'
    | 'create_automation'
    | 'connect_channel'
    | 'idle_warning';

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface Suggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    ctaLink: string;
    ctaLabel: string;
    priority: SuggestionPriority;
    metadata?: Record<string, any>;
}

interface ActionSuggestionsProps {
    suggestions: Suggestion[];
    maxVisible?: number;
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTION CARD CONFIG
// ═══════════════════════════════════════════════════════════════

const suggestionConfig: Record<SuggestionType, {
    icon: typeof Target;
    iconBg: string;
    borderColor: string;
    glowColor: string;
}> = {
    complete_setup: {
        icon: Settings,
        iconBg: 'bg-afflyt-cyan-500/20',
        borderColor: 'border-afflyt-cyan-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(0,229,224,0.15)]'
    },
    hot_deal: {
        icon: Flame,
        iconBg: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]'
    },
    channel_issue: {
        icon: AlertTriangle,
        iconBg: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]'
    },
    low_credits: {
        icon: CreditCard,
        iconBg: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]'
    },
    create_automation: {
        icon: Rocket,
        iconBg: 'bg-afflyt-plasma-500/20',
        borderColor: 'border-afflyt-plasma-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
    },
    connect_channel: {
        icon: Zap,
        iconBg: 'bg-afflyt-profit-500/20',
        borderColor: 'border-afflyt-profit-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]'
    },
    idle_warning: {
        icon: Target,
        iconBg: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        glowColor: 'hover:shadow-[0_0_20px_rgba(156,163,175,0.15)]'
    }
};

// ═══════════════════════════════════════════════════════════════
// SINGLE SUGGESTION CARD
// ═══════════════════════════════════════════════════════════════

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
    const config = suggestionConfig[suggestion.type];
    const IconComponent = config.icon;

    return (
        <div
            className={`
                relative p-4 rounded-xl bg-afflyt-dark-50 border ${config.borderColor}
                ${config.glowColor} transition-all duration-300 group
                hover:-translate-y-1
            `}
        >
            {/* Priority indicator */}
            {suggestion.priority === 'high' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}

            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-5 h-5 text-current opacity-80" />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                        {suggestion.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                        {suggestion.description}
                    </p>

                    <Link href={suggestion.ctaLink}>
                        <CyberButton variant="secondary" size="sm">
                            {suggestion.ctaLabel}
                        </CyberButton>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ActionSuggestions({ suggestions, maxVisible = 3 }: ActionSuggestionsProps) {
    const t = useTranslations('dashboard.suggestions');

    // Sort by priority and limit
    const sortedSuggestions = [...suggestions]
        .sort((a, b) => {
            const priorityOrder: Record<SuggestionPriority, number> = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, maxVisible);

    if (sortedSuggestions.length === 0) {
        return null;
    }

    return (
        <GlassCard className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-afflyt-cyan-400" />
                <h3 className="font-semibold text-white">{t('title')}</h3>
                {suggestions.length > maxVisible && (
                    <span className="text-xs text-gray-500 ml-auto">
                        +{suggestions.length - maxVisible} {t('more')}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSuggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
            </div>
        </GlassCard>
    );
}
