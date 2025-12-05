'use client';

import { useTranslations } from 'next-intl';
import { FileText, Sparkles, Bot, Wand2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

type CopyMode = 'TEMPLATE' | 'LLM';
type LLMModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';

interface Step6CopyProps {
    copyMode: CopyMode;
    llmModel: LLMModel;
    customStylePrompt: string;
    userPlan: string;
    onChange: (updates: {
        copyMode?: CopyMode;
        llmModel?: LLMModel;
        customStylePrompt?: string;
    }) => void;
}

const LLM_MODELS = [
    { id: 'gpt-4o-mini' as LLMModel, name: 'GPT-4o Mini', cost: '💰', quality: '⭐⭐⭐' },
    { id: 'gpt-4o' as LLMModel, name: 'GPT-4o', cost: '💰💰', quality: '⭐⭐⭐⭐' },
    { id: 'gpt-4-turbo' as LLMModel, name: 'GPT-4 Turbo', cost: '💰💰💰', quality: '⭐⭐⭐⭐⭐' },
];

export function Step6Copy({
    copyMode,
    llmModel,
    customStylePrompt,
    userPlan,
    onChange,
}: Step6CopyProps) {
    const t = useTranslations('automations.wizard.step6');
    const isLLMAvailable = userPlan !== 'FREE';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('title')}</h3>
                    <p className="text-sm text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Copy Mode Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    {t('mode.title')}
                </label>
                <div className="space-y-2">
                    {/* Template Mode */}
                    <button
                        type="button"
                        onClick={() => onChange({ copyMode: 'TEMPLATE' })}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            copyMode === 'TEMPLATE'
                                ? 'bg-cyan-500/10 border-cyan-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-cyan-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                copyMode === 'TEMPLATE' ? 'bg-cyan-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <FileText className={`w-5 h-5 ${copyMode === 'TEMPLATE' ? 'text-cyan-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${copyMode === 'TEMPLATE' ? 'text-white' : 'text-gray-300'}`}>
                                    {t('mode.template.label')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('mode.template.desc')}
                                </p>
                            </div>
                            {copyMode === 'TEMPLATE' && (
                                <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* LLM Mode */}
                    <button
                        type="button"
                        onClick={() => isLLMAvailable && onChange({ copyMode: 'LLM' })}
                        disabled={!isLLMAvailable}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            copyMode === 'LLM'
                                ? 'bg-purple-500/10 border-purple-500/40'
                                : !isLLMAvailable
                                    ? 'bg-afflyt-dark-100/50 border-afflyt-glass-border opacity-60 cursor-not-allowed'
                                    : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                copyMode === 'LLM' ? 'bg-purple-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Sparkles className={`w-5 h-5 ${copyMode === 'LLM' ? 'text-purple-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={`font-medium ${copyMode === 'LLM' ? 'text-white' : 'text-gray-300'}`}>
                                        {t('mode.llm.label')}
                                    </p>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/30 text-purple-300 rounded-full">
                                        BETA
                                    </span>
                                    {!isLLMAvailable && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-afflyt-cyan-500/20 text-afflyt-cyan-400 rounded">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {t('mode.llm.desc')}
                                </p>
                            </div>
                            {copyMode === 'LLM' && (
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Template Preview */}
            {copyMode === 'TEMPLATE' && (
                <GlassCard className="p-4 bg-afflyt-dark-100/50">
                    <p className="text-xs text-gray-500 mb-2">{t('preview.title')}</p>
                    <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-sm">
                        <p className="text-white">🔥 <span className="text-gray-400">{'{title}'}</span></p>
                        <p className="text-white mt-2">
                            💰 <span className="text-emerald-400">{'{price}'}</span>
                            <span className="text-gray-500 line-through ml-2">{'{originalPrice}'}</span>
                        </p>
                        <p className="text-white">
                            📉 <span className="text-orange-400">-{'{discount}'}%</span>
                            <span className="text-gray-500"> · </span>
                            ⭐ <span className="text-yellow-400">{'{rating}'}</span>
                            <span className="text-gray-500"> ({'{reviewCount}'} recensioni)</span>
                        </p>
                    </div>
                </GlassCard>
            )}

            {/* LLM Options */}
            {copyMode === 'LLM' && (
                <div className="space-y-4">
                    {/* Model Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            {t('llm.model.title')}
                        </label>
                        <div className="space-y-2">
                            {LLM_MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => onChange({ llmModel: model.id })}
                                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                                        llmModel === model.id
                                            ? 'bg-purple-500/10 border-purple-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-medium text-sm ${llmModel === model.id ? 'text-white' : 'text-gray-300'}`}>
                                                {model.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-gray-500">{model.cost}</span>
                                            <span className="text-yellow-400">{model.quality}</span>
                                            {llmModel === model.id && (
                                                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <span className="text-[10px] text-afflyt-dark-100 font-bold">✓</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Style Prompt */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-300">
                                {t('llm.style.title')}
                            </label>
                            <span className={`text-xs ${(customStylePrompt?.length || 0) > 280 ? 'text-orange-400' : 'text-gray-500'}`}>
                                {customStylePrompt?.length || 0}/300
                            </span>
                        </div>
                        <textarea
                            value={customStylePrompt}
                            onChange={(e) => {
                                if (e.target.value.length <= 300) {
                                    onChange({ customStylePrompt: e.target.value });
                                }
                            }}
                            placeholder={t('llm.style.placeholder')}
                            rows={3}
                            maxLength={300}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none transition-colors resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            {t('llm.style.hint')}
                        </p>
                    </div>

                    {/* AI Info */}
                    <GlassCard className="p-3 bg-purple-500/5 border-purple-500/20">
                        <div className="flex items-start gap-2">
                            <Bot className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-purple-300">
                                {t('llm.info')}
                            </p>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
