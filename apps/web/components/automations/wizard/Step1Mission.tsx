'use client';

import { useTranslations } from 'next-intl';
import { Rocket, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Step1MissionProps {
    name: string;
    description: string;
    onChange: (updates: { name?: string; description?: string }) => void;
}

export function Step1Mission({ name, description, onChange }: Step1MissionProps) {
    const t = useTranslations('automations.wizard.step1');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('nameLabel')}</h3>
                    <p className="text-sm text-gray-400">{t('nameHint')}</p>
                </div>
            </div>

            {/* Name Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('nameLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder={t('namePlaceholder')}
                    maxLength={200}
                    className="w-full px-4 py-3 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
                />
                <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{t('nameHint')}</p>
                    <p className={`text-xs ${name.length > 180 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {name.length}/200
                    </p>
                </div>
            </div>

            {/* Description Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('descriptionLabel')}
                </label>
                <textarea
                    value={description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 resize-none transition-colors"
                />
                <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{t('descriptionHint')}</p>
                    <p className={`text-xs ${description.length > 450 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {description.length}/500
                    </p>
                </div>
            </div>

            {/* Tips Card */}
            <GlassCard className="p-4 bg-afflyt-cyan-500/5 border-afflyt-cyan-500/20">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-afflyt-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                        <p className="font-medium text-white mb-1">Suggerimenti per il nome:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                            <li>Usa un nome descrittivo che ricorderai</li>
                            <li>Includi la categoria o il tipo di offerte</li>
                            <li>Esempio: "Offerte Tech sotto 50"</li>
                        </ul>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
