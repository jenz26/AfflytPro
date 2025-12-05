'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Zap, Brain, Timer, Settings } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

type SchedulePreset = 'relaxed' | 'active' | 'intensive' | 'custom';
type PublishingMode = 'smart' | 'immediate';

interface SchedulePresetConfig {
    id: SchedulePreset;
    emoji: string;
    intervalMinutes: number;
    dealsPerRun: number;
    estimatedPerDay: number;
    availableFor: string[];
}

const SCHEDULE_PRESETS: SchedulePresetConfig[] = [
    {
        id: 'relaxed',
        emoji: '😴',
        intervalMinutes: 360,
        dealsPerRun: 3,
        estimatedPerDay: 12,
        availableFor: ['FREE', 'PRO', 'BUSINESS'],
    },
    {
        id: 'active',
        emoji: '⚡',
        intervalMinutes: 120,
        dealsPerRun: 3,
        estimatedPerDay: 36,
        availableFor: ['FREE', 'PRO', 'BUSINESS'],
    },
    {
        id: 'intensive',
        emoji: '🔥',
        intervalMinutes: 60,
        dealsPerRun: 5,
        estimatedPerDay: 120,
        availableFor: ['PRO', 'BUSINESS'],
    },
    {
        id: 'custom',
        emoji: '⚙️',
        intervalMinutes: 0,
        dealsPerRun: 0,
        estimatedPerDay: 0,
        availableFor: ['PRO', 'BUSINESS'],
    },
];

interface Step4ScheduleProps {
    schedulePreset: SchedulePreset;
    publishingMode: PublishingMode;
    intervalMinutes?: number;
    dealsPerRun?: number;
    userPlan: string;
    onChange: (updates: {
        schedulePreset?: SchedulePreset;
        publishingMode?: PublishingMode;
        intervalMinutes?: number;
        dealsPerRun?: number;
    }) => void;
}

export function Step4Schedule({
    schedulePreset,
    publishingMode,
    intervalMinutes = 120,
    dealsPerRun = 3,
    userPlan,
    onChange,
}: Step4ScheduleProps) {
    const t = useTranslations('automations.wizard.step4');

    const selectedPreset = SCHEDULE_PRESETS.find(p => p.id === schedulePreset);
    const effectiveInterval = schedulePreset === 'custom' ? intervalMinutes : (selectedPreset?.intervalMinutes || 120);
    const effectiveDeals = schedulePreset === 'custom' ? dealsPerRun : (selectedPreset?.dealsPerRun || 3);
    const estimatedPerDay = Math.round((24 * 60 / effectiveInterval) * effectiveDeals);

    const minInterval = userPlan === 'BUSINESS' ? 30 : userPlan === 'PRO' ? 60 : 120;
    const maxDeals = userPlan === 'BUSINESS' ? 30 : userPlan === 'PRO' ? 10 : 3;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('title')}</h3>
                    <p className="text-sm text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Schedule Presets */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    {t('frequency.title')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {SCHEDULE_PRESETS.map((preset) => {
                        const isSelected = schedulePreset === preset.id;
                        const isAvailable = preset.availableFor.includes(userPlan);
                        const isLocked = !isAvailable;

                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => !isLocked && onChange({ schedulePreset: preset.id })}
                                disabled={isLocked}
                                className={`relative p-4 rounded-lg border transition-all text-left ${
                                    isSelected
                                        ? 'bg-orange-500/10 border-orange-500/40'
                                        : isLocked
                                            ? 'bg-afflyt-dark-100/50 border-afflyt-glass-border opacity-50 cursor-not-allowed'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-orange-500/30'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{preset.emoji}</span>
                                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                        {t(`frequency.presets.${preset.id}.label`)}
                                    </span>
                                    {isLocked && (
                                        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-afflyt-cyan-500/20 text-afflyt-cyan-400 rounded">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                {preset.id !== 'custom' ? (
                                    <p className="text-xs text-gray-500">
                                        {t(`frequency.presets.${preset.id}.desc`, {
                                            interval: preset.intervalMinutes / 60,
                                            deals: preset.dealsPerRun
                                        })}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        {t('frequency.presets.custom.desc')}
                                    </p>
                                )}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom Settings */}
            {schedulePreset === 'custom' && (
                <GlassCard className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Settings className="w-4 h-4" />
                        {t('frequency.custom.title')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                {t('frequency.custom.interval')}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={intervalMinutes}
                                    onChange={(e) => onChange({ intervalMinutes: Math.max(minInterval, parseInt(e.target.value) || minInterval) })}
                                    min={minInterval}
                                    max={1440}
                                    className="w-full px-3 py-2 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white text-sm focus:border-orange-500 focus:outline-none"
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">{t('frequency.custom.minutes')}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">
                                {t('frequency.custom.minInterval', { min: minInterval })}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                {t('frequency.custom.dealsPerRun')}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={dealsPerRun}
                                    onChange={(e) => onChange({ dealsPerRun: Math.min(maxDeals, Math.max(1, parseInt(e.target.value) || 1)) })}
                                    min={1}
                                    max={maxDeals}
                                    className="w-full px-3 py-2 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white text-sm focus:border-orange-500 focus:outline-none"
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">{t('frequency.custom.deals')}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">
                                {t('frequency.custom.maxDeals', { max: maxDeals })}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Publishing Mode */}
            <div className="space-y-3 pt-4 border-t border-afflyt-glass-border">
                <label className="block text-sm font-medium text-gray-300">
                    {t('publishingMode.title')}
                </label>
                <div className="space-y-2">
                    {/* Smart Timing */}
                    <button
                        type="button"
                        onClick={() => onChange({ publishingMode: 'smart' })}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            publishingMode === 'smart'
                                ? 'bg-purple-500/10 border-purple-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                publishingMode === 'smart' ? 'bg-purple-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Brain className={`w-5 h-5 ${publishingMode === 'smart' ? 'text-purple-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${publishingMode === 'smart' ? 'text-white' : 'text-gray-300'}`}>
                                    {t('publishingMode.smart.label')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('publishingMode.smart.desc')}
                                </p>
                            </div>
                            {publishingMode === 'smart' && (
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Immediate */}
                    <button
                        type="button"
                        onClick={() => onChange({ publishingMode: 'immediate' })}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            publishingMode === 'immediate'
                                ? 'bg-yellow-500/10 border-yellow-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-yellow-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                publishingMode === 'immediate' ? 'bg-yellow-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Zap className={`w-5 h-5 ${publishingMode === 'immediate' ? 'text-yellow-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${publishingMode === 'immediate' ? 'text-white' : 'text-gray-300'}`}>
                                    {t('publishingMode.immediate.label')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('publishingMode.immediate.desc')}
                                </p>
                            </div>
                            {publishingMode === 'immediate' && (
                                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Estimation */}
            <GlassCard className="p-4 bg-afflyt-dark-100/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Timer className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">{t('estimate.title')}</p>
                        <p className="text-xs text-gray-400">{t('estimate.desc')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">~{estimatedPerDay}</p>
                        <p className="text-xs text-gray-500">{t('estimate.perDay')}</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
