'use client';

import { useState, useEffect } from 'react';
import {
    Zap,
    ChevronRight,
    ChevronLeft,
    Package,
    Target,
    Send,
    Sparkles,
    CheckCircle,
    X,
    Info
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

interface WizardProps {
    onComplete: (rule: any) => void;
    onCancel: () => void;
    editingRule?: {
        id: string;
        name: string;
        description?: string;
        categories: string;
        minScore: number;
        maxPrice?: number;
        channelId?: string;
        isActive: boolean;
    } | null;
}

interface Channel {
    id: string;
    name: string;
    platform: string;
    status: string;
}

export const CreateRuleWizard = ({ onComplete, onCancel, editingRule }: WizardProps) => {
    const t = useTranslations('automations.wizard');
    const [currentStep, setCurrentStep] = useState(1);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);

    const [rule, setRule] = useState({
        name: editingRule?.name || '',
        description: editingRule?.description || '',
        categories: editingRule ? JSON.parse(editingRule.categories) : [] as string[],
        minScore: editingRule?.minScore || 70,
        maxPrice: editingRule?.maxPrice || undefined as number | undefined,
        channelId: editingRule?.channelId || ''
    });

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('${API_BASE}/user/channels', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setChannels(data.channels || []);
                }
            } catch (error) {
                console.error('Failed to fetch channels:', error);
            } finally {
                setLoadingChannels(false);
            }
        };

        fetchChannels();
    }, []);

    const steps = [
        { id: 1, title: t('steps.mission.title'), description: t('steps.mission.description') },
        { id: 2, title: t('steps.target.title'), description: t('steps.target.description') },
        { id: 3, title: t('steps.parameters.title'), description: t('steps.parameters.description') },
        { id: 4, title: t('steps.destination.title'), description: t('steps.destination.description') },
        { id: 5, title: t('steps.review.title'), description: t('steps.review.description') }
    ];

    const categories = [
        { id: 'Electronics', label: t('categories.Electronics') },
        { id: 'Computers', label: t('categories.Computers') },
        { id: 'Home', label: t('categories.Home') },
        { id: 'Beauty', label: t('categories.Beauty') },
        { id: 'Gaming', label: t('categories.Gaming') },
        { id: 'Books', label: t('categories.Books') },
        { id: 'Fashion', label: t('categories.Fashion') },
        { id: 'Music', label: t('categories.Music') }
    ];

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('step1.nameLabel')}
                            </label>
                            <input
                                type="text"
                                value={rule.name}
                                onChange={(e) => setRule({ ...rule, name: e.target.value })}
                                placeholder={t('step1.namePlaceholder')}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('step1.descriptionLabel')}
                            </label>
                            <textarea
                                value={rule.description}
                                onChange={(e) => setRule({ ...rule, description: e.target.value })}
                                placeholder={t('step1.descriptionPlaceholder')}
                                rows={3}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 resize-none transition-colors"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-3">
                                {t('step2.categoriesLabel')}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            const cats = rule.categories.includes(cat.id)
                                                ? rule.categories.filter((c: string) => c !== cat.id)
                                                : [...rule.categories, cat.id];
                                            setRule({ ...rule, categories: cats });
                                        }}
                                        className={`p-4 rounded-lg border transition-all ${rule.categories.includes(cat.id)
                                                ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Package className={`w-5 h-5 ${rule.categories.includes(cat.id) ? 'text-afflyt-cyan-400' : 'text-gray-400'
                                                }`} />
                                            <span className={`text-sm ${rule.categories.includes(cat.id) ? 'text-white' : 'text-gray-300'
                                                }`}>
                                                {cat.label}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {rule.categories.length > 0 && (
                                <div className="mt-3 p-3 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg">
                                    <p className="text-sm text-afflyt-cyan-300">
                                        {t('step2.selectedCount', { count: rule.categories.length })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                {t('step3.minScoreLabel')} <span className="text-afflyt-cyan-400 font-mono">{rule.minScore}/100</span>
                            </label>

                            <div className="relative mb-6">
                                <div className="h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg opacity-20" />

                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={rule.minScore}
                                    onChange={(e) => setRule({ ...rule, minScore: Number(e.target.value) })}
                                    className="absolute inset-0 w-full h-12 opacity-0 cursor-pointer"
                                />

                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full shadow-lg pointer-events-none"
                                    style={{ left: `${rule.minScore}%` }}
                                />

                                <div
                                    className="absolute -top-8 px-2 py-1 bg-afflyt-cyan-500 text-afflyt-dark-100 text-xs font-mono rounded"
                                    style={{ left: `${rule.minScore}%`, transform: 'translateX(-50%)' }}
                                >
                                    {rule.minScore}
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-afflyt-glass-white rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <Info className="w-4 h-4 text-afflyt-cyan-400" />
                                    <span className="text-gray-300">
                                        {rule.minScore < 50 && t('step3.hints.low')}
                                        {rule.minScore >= 50 && rule.minScore < 70 && t('step3.hints.moderate')}
                                        {rule.minScore >= 70 && rule.minScore < 85 && t('step3.hints.good')}
                                        {rule.minScore >= 85 && t('step3.hints.excellent')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('step3.priceLabel')}
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">€</span>
                                <input
                                    type="number"
                                    value={rule.maxPrice || ''}
                                    onChange={(e) => setRule({ ...rule, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder={t('step3.pricePlaceholder')}
                                    className="flex-1 px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">
                            {t('step4.channelLabel')}
                        </h3>

                        {loadingChannels ? (
                            <div className="text-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-afflyt-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
                                <p className="text-sm text-gray-400">{t('step4.loadingChannels')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {channels.filter(ch => ch.status === 'CONNECTED').map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setRule({ ...rule, channelId: channel.id })}
                                        className={`w-full p-4 rounded-lg border transition-all text-left ${rule.channelId === channel.id
                                                ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Send className={`w-5 h-5 ${rule.channelId === channel.id ? 'text-afflyt-cyan-400' : 'text-gray-400'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium text-white">{channel.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{channel.platform} • {t('step4.channelActive')}</p>
                                                </div>
                                            </div>
                                            {rule.channelId === channel.id && (
                                                <CheckCircle className="w-5 h-5 text-afflyt-cyan-400" />
                                            )}
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={() => setRule({ ...rule, channelId: '' })}
                                    className={`w-full p-4 rounded-lg border transition-all text-left ${!rule.channelId
                                            ? 'bg-yellow-500/10 border-yellow-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-yellow-500/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Target className={`w-5 h-5 ${!rule.channelId ? 'text-yellow-400' : 'text-gray-400'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium text-white">{t('step4.testingOnly')}</p>
                                            <p className="text-xs text-gray-500">{t('step4.testingOnlyDesc')}</p>
                                        </div>
                                    </div>
                                </button>

                                {channels.length === 0 && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-sm text-yellow-300">
                                            {t('step4.noChannelsWarning')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-3 bg-afflyt-glass-white rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <Info className="w-4 h-4 text-afflyt-cyan-400" />
                                <span className="text-gray-300">
                                    {t('step4.hint')}
                                </span>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-afflyt-dark-100" />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('step5.ready')}</h3>
                            <p className="text-sm text-gray-400 mt-2">
                                {t('step5.reviewMessage', { action: editingRule ? t('step5.updating') : t('step5.activating') })}
                            </p>
                        </div>

                        <GlassCard className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">{t('step5.name')}</span>
                                <span className="text-white font-medium">{rule.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">{t('step5.categories')}</span>
                                <span className="text-white">{t('step5.categoriesSelected', { count: rule.categories.length })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">{t('step5.minScore')}</span>
                                <span className="text-afflyt-cyan-400 font-mono">{rule.minScore}</span>
                            </div>
                            {rule.maxPrice && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{t('step5.maxPrice')}</span>
                                    <span className="text-white">€{rule.maxPrice}</span>
                                </div>
                            )}
                            {rule.channelId && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{t('step5.channel')}</span>
                                    <span className="text-white">{channels.find(ch => ch.id === rule.channelId)?.name || t('step5.selected')}</span>
                                </div>
                            )}
                        </GlassCard>

                        <div className="space-y-3">
                            <CyberButton
                                variant="primary"
                                className="w-full justify-center"
                                onClick={() => onComplete({ ...rule, isActive: true })}
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                {editingRule ? t('step5.updateAndActivate') : t('step5.createAndActivate')}
                            </CyberButton>

                            <CyberButton
                                variant="secondary"
                                className="w-full justify-center"
                                onClick={() => onComplete({ ...rule, isActive: editingRule ? editingRule.isActive : false })}
                            >
                                {editingRule ? t('step5.updateKeepState') : t('step5.createInactive')}
                            </CyberButton>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

            <div className="relative w-full max-w-2xl bg-afflyt-dark-50 border border-afflyt-glass-border rounded-xl shadow-2xl">
                <div className="relative h-1 bg-afflyt-dark-100">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600 transition-all duration-500"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6 border-b border-afflyt-glass-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-afflyt-dark-100" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {editingRule ? t('titleEdit') : t('title')}
                                </h2>
                                <p className="text-sm text-gray-400">{t('subtitle')}</p>
                            </div>
                        </div>
                        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-afflyt-cyan-400' : 'text-gray-600'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono ${currentStep > step.id
                                            ? 'border-afflyt-cyan-400 bg-afflyt-cyan-500/20'
                                            : currentStep === step.id
                                                ? 'border-afflyt-cyan-400 bg-afflyt-cyan-500/10'
                                                : 'border-gray-600'
                                        }`}>
                                        {currentStep > step.id ? '✓' : step.id}
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-xs font-medium">{step.title}</p>
                                        <p className="text-[10px] text-gray-500">{step.description}</p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-afflyt-cyan-400' : 'bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6" style={{ minHeight: '400px' }}>
                    {renderStep()}
                </div>

                <div className="p-6 border-t border-afflyt-glass-border flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {t('cancel')}
                    </button>

                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <CyberButton
                                variant="ghost"
                                onClick={() => setCurrentStep(currentStep - 1)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                {t('navigation.back')}
                            </CyberButton>
                        )}

                        {currentStep < steps.length && (
                            <CyberButton
                                variant="primary"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={
                                    (currentStep === 1 && !rule.name) ||
                                    (currentStep === 2 && rule.categories.length === 0)
                                }
                            >
                                {t('navigation.continue')}
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </CyberButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
