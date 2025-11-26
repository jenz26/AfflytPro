'use client';

import { useTranslations } from 'next-intl';
import {
    Euro, Percent, Star, MessageSquare, TrendingUp,
    Package, Truck, Tag, Crown, Building2, Calendar,
    Info
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MissionConfig } from '../CreateMissionWizard';
import { LockedFilterBadge } from '../LockedFilterBadge';

interface Step3FiltersProps {
    mission: MissionConfig;
    userPlan: string;
    filterTiers: {
        FREE: string[];
        PRO: string[];
        BUSINESS: string[];
    };
    onChange: (updates: Partial<MissionConfig>) => void;
}

export function Step3Filters({ mission, userPlan, filterTiers, onChange }: Step3FiltersProps) {
    const t = useTranslations('automations.wizard.step3');

    const isPro = userPlan === 'PRO' || userPlan === 'BUSINESS';
    const isBusiness = userPlan === 'BUSINESS';

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <GlassCard className="p-4 bg-afflyt-cyan-500/5 border-afflyt-cyan-500/20">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-afflyt-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">
                        {t('info')}
                    </p>
                </div>
            </GlassCard>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* PRO FILTERS */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{t('proFilters.title')}</h3>
                    {!isPro && <LockedFilterBadge requiredPlan="PRO" />}
                </div>

                <div className={`grid md:grid-cols-2 gap-4 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Price Range */}
                    <GlassCard className="p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Euro className="w-4 h-4 text-afflyt-cyan-400" />
                            {t('proFilters.priceRange.label')}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder={t('proFilters.priceRange.minPlaceholder')}
                                value={mission.minPrice || ''}
                                onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                                disabled={!isPro}
                                className="flex-1 px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                placeholder={t('proFilters.priceRange.maxPlaceholder')}
                                value={mission.maxPrice || ''}
                                onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                                disabled={!isPro}
                                className="flex-1 px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                            />
                        </div>
                    </GlassCard>

                    {/* Minimum Discount */}
                    <GlassCard className="p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Percent className="w-4 h-4 text-emerald-400" />
                            {t('proFilters.minDiscount.label')}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="20"
                                value={mission.minDiscount || ''}
                                onChange={(e) => onChange({ minDiscount: e.target.value ? Number(e.target.value) : undefined })}
                                disabled={!isPro}
                                className="flex-1 px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                            />
                            <span className="text-gray-400">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('proFilters.minDiscount.hint')}</p>
                    </GlassCard>

                    {/* Minimum Rating */}
                    <GlassCard className="p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Star className="w-4 h-4 text-yellow-400" />
                            {t('proFilters.minRating.label')}
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => onChange({ minRating: star * 100 })}
                                    disabled={!isPro}
                                    className={`p-1 transition-colors ${
                                        mission.minRating && mission.minRating >= star * 100
                                            ? 'text-yellow-400'
                                            : 'text-gray-600 hover:text-yellow-400/50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Star className="w-6 h-6 fill-current" />
                                </button>
                            ))}
                            {mission.minRating && (
                                <button
                                    onClick={() => onChange({ minRating: undefined })}
                                    className="ml-2 text-xs text-gray-500 hover:text-gray-400"
                                >
                                    {t('clear')}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {mission.minRating
                                ? t('proFilters.minRating.selected', { stars: mission.minRating / 100 })
                                : t('proFilters.minRating.hint')
                            }
                        </p>
                    </GlassCard>

                    {/* Minimum Reviews */}
                    <GlassCard className="p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                            {t('proFilters.minReviews.label')}
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="50"
                            value={mission.minReviews || ''}
                            onChange={(e) => onChange({ minReviews: e.target.value ? Number(e.target.value) : undefined })}
                            disabled={!isPro}
                            className="w-full px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                        />
                        <p className="text-xs text-gray-500 mt-2">{t('proFilters.minReviews.hint')}</p>
                    </GlassCard>

                    {/* Max Sales Rank */}
                    <GlassCard className="p-4 md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            {t('proFilters.maxSalesRank.label')}
                        </label>
                        <input
                            type="number"
                            min="1"
                            placeholder="10000"
                            value={mission.maxSalesRank || ''}
                            onChange={(e) => onChange({ maxSalesRank: e.target.value ? Number(e.target.value) : undefined })}
                            disabled={!isPro}
                            className="w-full px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                        />
                        <p className="text-xs text-gray-500 mt-2">{t('proFilters.maxSalesRank.hint')}</p>
                    </GlassCard>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* BUSINESS FILTERS */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <div className="space-y-4 pt-4 border-t border-afflyt-glass-border">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{t('businessFilters.title')}</h3>
                    {!isBusiness && <LockedFilterBadge requiredPlan="BUSINESS" />}
                </div>

                <div className={`space-y-4 ${!isBusiness ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Toggle Filters */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Amazon Only */}
                        <GlassCard className="p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-orange-400" />
                                    <span className="text-sm font-medium text-gray-300">
                                        {t('businessFilters.amazonOnly.label')}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={mission.amazonOnly}
                                        onChange={(e) => onChange({ amazonOnly: e.target.checked })}
                                        disabled={!isBusiness}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-afflyt-dark-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-afflyt-cyan-500"></div>
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">{t('businessFilters.amazonOnly.hint')}</p>
                        </GlassCard>

                        {/* FBA Only */}
                        <GlassCard className="p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-medium text-gray-300">
                                        {t('businessFilters.fbaOnly.label')}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={mission.fbaOnly}
                                        onChange={(e) => onChange({ fbaOnly: e.target.checked })}
                                        disabled={!isBusiness}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-afflyt-dark-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-afflyt-cyan-500"></div>
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">{t('businessFilters.fbaOnly.hint')}</p>
                        </GlassCard>

                        {/* Has Coupon */}
                        <GlassCard className="p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-medium text-gray-300">
                                        {t('businessFilters.hasCoupon.label')}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={mission.hasCoupon}
                                        onChange={(e) => onChange({ hasCoupon: e.target.checked })}
                                        disabled={!isBusiness}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-afflyt-dark-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-afflyt-cyan-500"></div>
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">{t('businessFilters.hasCoupon.hint')}</p>
                        </GlassCard>

                        {/* Prime Only */}
                        <GlassCard className="p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm font-medium text-gray-300">
                                        {t('businessFilters.primeOnly.label')}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={mission.primeOnly}
                                        onChange={(e) => onChange({ primeOnly: e.target.checked })}
                                        disabled={!isBusiness}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-afflyt-dark-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-afflyt-cyan-500"></div>
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">{t('businessFilters.primeOnly.hint')}</p>
                        </GlassCard>
                    </div>

                    {/* Brand Filter */}
                    <GlassCard className="p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Building2 className="w-4 h-4 text-purple-400" />
                            {t('businessFilters.brand.label')}
                        </label>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">{t('businessFilters.brand.includeLabel')}</p>
                                <input
                                    type="text"
                                    placeholder={t('businessFilters.brand.includePlaceholder')}
                                    value={mission.brandInclude.join(', ')}
                                    onChange={(e) => onChange({
                                        brandInclude: e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                                    })}
                                    disabled={!isBusiness}
                                    className="w-full px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">{t('businessFilters.brand.excludeLabel')}</p>
                                <input
                                    type="text"
                                    placeholder={t('businessFilters.brand.excludePlaceholder')}
                                    value={mission.brandExclude.join(', ')}
                                    onChange={(e) => onChange({
                                        brandExclude: e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                                    })}
                                    disabled={!isBusiness}
                                    className="w-full px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Listed After */}
                    <GlassCard className="p-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            {t('businessFilters.listedAfter.label')}
                        </label>
                        <input
                            type="date"
                            value={mission.listedAfter || ''}
                            onChange={(e) => onChange({ listedAfter: e.target.value || undefined })}
                            disabled={!isBusiness}
                            className="w-full px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white focus:outline-none focus:border-afflyt-cyan-500 disabled:opacity-50"
                        />
                        <p className="text-xs text-gray-500 mt-2">{t('businessFilters.listedAfter.hint')}</p>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
