'use client';

import { useTranslations } from 'next-intl';
import {
    CheckCircle, Rocket, Target, Filter, Gauge, Send,
    AlertTriangle, Play, FileText
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { MissionConfig, WizardConfig } from '../CreateMissionWizard';

interface Step6ReviewProps {
    mission: MissionConfig;
    wizardConfig: WizardConfig;
    onSubmit: (activate: boolean) => void;
    isSubmitting: boolean;
    isEditing: boolean;
}

export function Step6Review({
    mission,
    wizardConfig,
    onSubmit,
    isSubmitting,
    isEditing
}: Step6ReviewProps) {
    const t = useTranslations('automations.wizard.step6');

    // Count active filters
    const activeFiltersCount = [
        mission.minPrice,
        mission.maxPrice,
        mission.minDiscount,
        mission.minRating,
        mission.minReviews,
        mission.maxSalesRank,
        mission.amazonOnly,
        mission.fbaOnly,
        mission.hasCoupon,
        mission.primeOnly,
        mission.brandInclude.length > 0,
        mission.brandExclude.length > 0,
        mission.listedAfter,
    ].filter(Boolean).length;

    // Get category names
    const selectedCategories = wizardConfig.categories
        .filter(c => mission.categories.includes(c.id))
        .map(c => c.name);

    // Warnings
    const warnings: string[] = [];
    if (!mission.channelId) {
        warnings.push(t('warnings.noChannel'));
    }
    if (mission.minScore >= 85) {
        warnings.push(t('warnings.highScore'));
    }
    if (activeFiltersCount >= 5) {
        warnings.push(t('warnings.manyFilters'));
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('title')}</h3>
                    <p className="text-sm text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
                {/* Mission Name */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-afflyt-cyan-500/20 rounded-lg flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-afflyt-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">{t('summary.name')}</p>
                            <p className="text-lg font-semibold text-white">{mission.name}</p>
                            {mission.description && (
                                <p className="text-sm text-gray-400 mt-1">{mission.description}</p>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Categories */}
                <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">{t('summary.categories')}</p>
                            <p className="text-sm font-medium text-white mb-2">
                                {t('summary.categoriesCount', { count: mission.categories.length })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedCategories.map((name) => (
                                    <span
                                        key={name}
                                        className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300"
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Filters */}
                <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Filter className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">{t('summary.filters')}</p>
                            <p className="text-sm font-medium text-white">
                                {activeFiltersCount > 0
                                    ? t('summary.filtersCount', { count: activeFiltersCount })
                                    : t('summary.noFilters')
                                }
                            </p>
                            {activeFiltersCount > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {mission.minPrice && (
                                        <span className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300">
                                            Min: €{mission.minPrice}
                                        </span>
                                    )}
                                    {mission.maxPrice && (
                                        <span className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300">
                                            Max: €{mission.maxPrice}
                                        </span>
                                    )}
                                    {mission.minDiscount && (
                                        <span className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300">
                                            -{mission.minDiscount}%+
                                        </span>
                                    )}
                                    {mission.minRating && (
                                        <span className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300">
                                            {mission.minRating / 100}+ ★
                                        </span>
                                    )}
                                    {mission.minReviews && (
                                        <span className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300">
                                            {mission.minReviews}+ reviews
                                        </span>
                                    )}
                                    {mission.maxSalesRank && (
                                        <span className="px-2 py-1 bg-afflyt-dark-100 rounded text-xs text-gray-300">
                                            Rank ≤ {mission.maxSalesRank}
                                        </span>
                                    )}
                                    {mission.amazonOnly && (
                                        <span className="px-2 py-1 bg-orange-500/20 rounded text-xs text-orange-300">
                                            Amazon Only
                                        </span>
                                    )}
                                    {mission.fbaOnly && (
                                        <span className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
                                            FBA Only
                                        </span>
                                    )}
                                    {mission.hasCoupon && (
                                        <span className="px-2 py-1 bg-emerald-500/20 rounded text-xs text-emerald-300">
                                            With Coupon
                                        </span>
                                    )}
                                    {mission.primeOnly && (
                                        <span className="px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-300">
                                            Prime Only
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Quality Score */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Gauge className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">{t('summary.minScore')}</p>
                            <p className="text-lg font-semibold text-white">{mission.minScore}/100</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Destination */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <Send className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">{t('summary.destination')}</p>
                            <p className="text-sm font-medium text-white">
                                {mission.channelId
                                    ? wizardConfig.categories.find(c => c.id === mission.channelId)?.name || 'Selected Channel'
                                    : t('summary.testingMode')
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">{t('summary.frequency')}</p>
                            <p className="text-sm font-medium text-afflyt-cyan-400">
                                {wizardConfig.planLimits.frequencyLabel}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <GlassCard className="p-4 bg-yellow-500/5 border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-300 mb-2">Attenzione</p>
                            <ul className="space-y-1">
                                {warnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-gray-400">
                                        • {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <CyberButton
                    variant="secondary"
                    onClick={() => onSubmit(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    {isEditing ? t('actions.updateKeepState') : t('actions.createInactive')}
                </CyberButton>
                <CyberButton
                    variant="primary"
                    onClick={() => onSubmit(true)}
                    disabled={isSubmitting}
                    className="flex-1"
                >
                    {isSubmitting ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                        <Play className="w-4 h-4 mr-2" />
                    )}
                    {isEditing ? t('actions.updateActive') : t('actions.createActive')}
                </CyberButton>
            </div>
        </div>
    );
}
