'use client';

import { useTranslations } from 'next-intl';
import { Gauge, Zap, TrendingUp, Star, Percent, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface ScorePreset {
    value: number;
    label: string;
    labelIT: string;
    recommended?: boolean;
}

interface Step4QualityProps {
    minScore: number;
    presets: ScorePreset[];
    onChange: (minScore: number) => void;
}

function getScoreColor(score: number): string {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-afflyt-cyan-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-gray-400';
}

function getScoreGradient(score: number): string {
    if (score >= 85) return 'from-emerald-500 to-emerald-600';
    if (score >= 70) return 'from-afflyt-cyan-400 to-afflyt-cyan-600';
    if (score >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
}

export function Step4Quality({ minScore, presets, onChange }: Step4QualityProps) {
    const t = useTranslations('automations.wizard.step4');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('title')}</h3>
                    <p className="text-sm text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Score Display */}
            <div className="text-center py-8">
                <div className={`text-7xl font-bold ${getScoreColor(minScore)} mb-2`}>
                    {minScore}
                </div>
                <p className="text-gray-400">{t('scoreLabel')}</p>
            </div>

            {/* Slider */}
            <div className="px-4">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-3 bg-afflyt-dark-100 rounded-lg appearance-none cursor-pointer accent-afflyt-cyan-500"
                    style={{
                        background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${minScore}%, #1a1a2e ${minScore}%, #1a1a2e 100%)`
                    }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presets.map((preset) => {
                    const isActive = minScore === preset.value;
                    return (
                        <button
                            key={preset.value}
                            onClick={() => onChange(preset.value)}
                            className={`relative p-4 rounded-lg border transition-all ${
                                isActive
                                    ? `bg-gradient-to-br ${getScoreGradient(preset.value)} border-transparent`
                                    : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/30'
                            }`}
                        >
                            {preset.recommended && (
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-afflyt-cyan-500 text-xs font-medium text-afflyt-dark-100 rounded-full">
                                    {t('recommended')}
                                </div>
                            )}
                            <div className={`text-2xl font-bold mb-1 ${isActive ? 'text-white' : getScoreColor(preset.value)}`}>
                                {preset.value}+
                            </div>
                            <div className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-400'}`}>
                                {preset.labelIT}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Explanation Card */}
            <GlassCard className="p-5 bg-afflyt-dark-100/50">
                <div className="flex items-start gap-3 mb-4">
                    <Info className="w-5 h-5 text-afflyt-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-white mb-1">{t('explanation.title')}</h4>
                        <p className="text-sm text-gray-400">{t('explanation.description')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-afflyt-dark-50 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Percent className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">40%</p>
                            <p className="text-xs text-gray-500">{t('explanation.factors.discount')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-afflyt-dark-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">25%</p>
                            <p className="text-xs text-gray-500">{t('explanation.factors.popularity')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-afflyt-dark-50 rounded-lg">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">20%</p>
                            <p className="text-xs text-gray-500">{t('explanation.factors.rating')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-afflyt-dark-50 rounded-lg">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">15%</p>
                            <p className="text-xs text-gray-500">{t('explanation.factors.trend')}</p>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
