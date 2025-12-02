'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Sparkles, ChevronRight, ExternalLink, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Deal {
    id: string;
    title: string;
    score: number;
    discount: number;
    foundAt: Date | string;
    published: boolean;
    asin?: string;
    imageUrl?: string;
}

interface DealFeedProps {
    deals: Deal[];
    onPublish?: (dealId: string) => void;
    maxVisible?: number;
}

// ═══════════════════════════════════════════════════════════════
// SCORE BADGE
// ═══════════════════════════════════════════════════════════════

function ScoreBadge({ score }: { score: number }) {
    const isHot = score >= 90;
    const isGood = score >= 70;

    const bgClass = isHot
        ? 'bg-gradient-to-br from-orange-400 to-red-500'
        : isGood
            ? 'bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600'
            : 'bg-gradient-to-br from-gray-500 to-gray-600';

    return (
        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center shadow-lg relative`}>
            <span className="text-sm font-bold text-white font-mono">{score}</span>
            {isHot && (
                <div className="absolute -top-1 -right-1 text-sm">🔥</div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TIME AGO HELPER
// ═══════════════════════════════════════════════════════════════

function timeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    return `${diffDays}g fa`;
}

// ═══════════════════════════════════════════════════════════════
// DEAL ROW
// ═══════════════════════════════════════════════════════════════

function DealRow({ deal, onPublish }: { deal: Deal; onPublish?: (id: string) => void }) {
    const t = useTranslations('dashboard.dealFeed');

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-afflyt-dark-100/50 transition-colors group">
            {/* Score Badge */}
            <ScoreBadge score={deal.score} />

            {/* Deal Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-afflyt-cyan-400 transition-colors">
                    {deal.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-afflyt-profit-400 font-semibold">
                        -{deal.discount}%
                    </span>
                    <span className="text-xs text-gray-500">
                        {timeAgo(deal.foundAt)}
                    </span>
                </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-2">
                {deal.published ? (
                    <span className="flex items-center gap-1 text-xs text-afflyt-profit-400 bg-afflyt-profit-500/10 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        {t('published')}
                    </span>
                ) : (
                    onPublish && (
                        <CyberButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onPublish(deal.id)}
                        >
                            {t('publish')}
                        </CyberButton>
                    )
                )}

                {deal.asin && (
                    <a
                        href={`https://www.amazon.it/dp/${deal.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-afflyt-cyan-400 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DealFeed({ deals, onPublish, maxVisible = 5 }: DealFeedProps) {
    const t = useTranslations('dashboard.dealFeed');

    const visibleDeals = deals.slice(0, maxVisible);
    const hotDealsCount = deals.filter(d => d.score >= 90).length;

    return (
        <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <h3 className="font-semibold text-white">{t('title')}</h3>
                    {hotDealsCount > 0 && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                            {hotDealsCount} 🔥
                        </span>
                    )}
                </div>
            </div>

            {/* Deal List */}
            <div className="flex-1 space-y-1 min-h-0 overflow-y-auto">
                {visibleDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Sparkles className="w-12 h-12 text-gray-600 mb-3" />
                        <p className="text-gray-500">{t('empty')}</p>
                        <p className="text-xs text-gray-600 mt-1">{t('emptyHint')}</p>
                    </div>
                ) : (
                    visibleDeals.map(deal => (
                        <DealRow key={deal.id} deal={deal} onPublish={onPublish} />
                    ))
                )}
            </div>

            {/* Footer */}
            {deals.length > maxVisible && (
                <div className="mt-4 pt-4 border-t border-afflyt-glass-border">
                    <Link href="/dashboard/deals">
                        <CyberButton variant="ghost" size="sm" className="w-full justify-center">
                            {t('viewAll')} ({deals.length})
                            <ChevronRight className="w-4 h-4" />
                        </CyberButton>
                    </Link>
                </div>
            )}
        </GlassCard>
    );
}
