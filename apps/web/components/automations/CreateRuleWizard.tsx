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
    Info,
    Clock,
    Lock,
    Tag,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    BarChart3
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
        categories: string[];  // API returns array
        minScore: number;
        maxPrice?: number;
        channelId?: string;
        isActive: boolean;
        // Scheduling
        schedulePreset?: string;
        // Deal publish options
        dealPublishMode?: 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH';
        showKeepaButton?: boolean;
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
        categories: editingRule?.categories || [] as string[], // Already an array from API
        minScore: editingRule?.minScore || 35,
        maxPrice: editingRule?.maxPrice || undefined as number | undefined,
        channelId: editingRule?.channelId || '',
        // Scheduling
        schedulePreset: editingRule?.schedulePreset || 'relaxed' as string,
        // Deal publish mode
        dealPublishMode: editingRule?.dealPublishMode || 'DISCOUNTED_ONLY' as 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH',
        showKeepaButton: editingRule?.showKeepaButton ?? false
    });

    // Schedule presets data
    const schedulePresets = [
        {
            id: 'relaxed',
            label: 'Rilassato',
            emoji: '🐢',
            intervalMinutes: 360,
            dealsPerRun: 3,
            estimatedPerDay: 12,
            description: '3 offerte ogni 6 ore',
        },
        {
            id: 'active',
            label: 'Attivo',
            emoji: '⚡',
            intervalMinutes: 120,
            dealsPerRun: 3,
            estimatedPerDay: 36,
            description: '3 offerte ogni 2 ore',
        },
        {
            id: 'intensive',
            label: 'Intensivo',
            emoji: '🔥',
            intervalMinutes: 60,
            dealsPerRun: 5,
            estimatedPerDay: 120,
            description: '5 offerte ogni ora',
            isPro: true,
        },
    ];

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/user/channels`, {
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

    // Funzione per stimare il numero di deal basato sui filtri
    const estimateDeals = () => {
        const catCount = rule.categories.length;
        const score = rule.minScore;
        const maxPrice = rule.maxPrice;

        // Base: 30 deal per categoria
        let estimate = catCount * 30;

        // Riduzione per score alto
        if (score >= 85) estimate *= 0.3;
        else if (score >= 70) estimate *= 0.5;
        else if (score >= 50) estimate *= 0.75;

        // Riduzione per prezzo basso
        if (maxPrice) {
            if (maxPrice <= 30) estimate *= 0.4;
            else if (maxPrice <= 50) estimate *= 0.6;
            else if (maxPrice <= 100) estimate *= 0.8;
        }

        return Math.round(estimate);
    };

    const getEstimateStatus = () => {
        const estimate = estimateDeals();
        if (estimate < 5) return { status: 'low', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: TrendingDown };
        if (estimate < 15) return { status: 'moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertTriangle };
        return { status: 'good', color: 'text-afflyt-profit-400', bg: 'bg-afflyt-profit-400/10 border-afflyt-profit-400/30', icon: TrendingUp };
    };

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
                                        {rule.minScore < 30 && t('step3.hints.low')}
                                        {rule.minScore >= 30 && rule.minScore < 45 && t('step3.hints.moderate')}
                                        {rule.minScore >= 45 && rule.minScore < 60 && t('step3.hints.good')}
                                        {rule.minScore >= 60 && rule.minScore < 75 && t('step3.hints.excellent')}
                                        {rule.minScore >= 75 && t('step3.hints.hot')}
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

                        {/* Live Preview Panel */}
                        {rule.categories.length > 0 && (
                            <div className={`p-4 rounded-lg border ${getEstimateStatus().bg}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {(() => {
                                        const StatusIcon = getEstimateStatus().icon;
                                        return <StatusIcon className={`w-5 h-5 ${getEstimateStatus().color}`} />;
                                    })()}
                                    <span className="text-sm font-medium text-white">Stima Deal Giornalieri</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-bold font-mono ${getEstimateStatus().color}`}>
                                        ~{estimateDeals()}
                                    </span>
                                    <span className="text-sm text-gray-400">deal/giorno</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    {getEstimateStatus().status === 'low' && '⚠️ Filtri molto restrittivi. Considera di abbassare il minScore o aumentare il maxPrice.'}
                                    {getEstimateStatus().status === 'moderate' && '💡 Buon equilibrio tra qualità e quantità.'}
                                    {getEstimateStatus().status === 'good' && '✅ Ottima configurazione! Troverai molti deal.'}
                                </p>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* SCHEDULING SECTION (NEW) */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div className="border-t border-afflyt-glass-border my-6 pt-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-white">Frequenza Pubblicazione</h4>
                                    <p className="text-xs text-gray-400">Quanto spesso pubblicare offerte?</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {schedulePresets.map((preset) => {
                                    const isActive = rule.schedulePreset === preset.id;
                                    const isPro = (preset as any).isPro;

                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => !isPro && setRule({ ...rule, schedulePreset: preset.id })}
                                            disabled={isPro}
                                            className={`relative p-4 rounded-lg border text-left transition-all ${
                                                isActive
                                                    ? 'bg-purple-500/20 border-purple-500'
                                                    : isPro
                                                        ? 'bg-afflyt-dark-100/50 border-afflyt-glass-border opacity-60 cursor-not-allowed'
                                                        : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/50'
                                            }`}
                                        >
                                            {isPro && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-xs text-gray-400 rounded-full">
                                                    <Lock className="w-3 h-3" />
                                                    PRO
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">{preset.emoji}</span>
                                                <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                                    {preset.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">{preset.description}</p>
                                            <p className={`text-xs mt-2 ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                                                ~{preset.estimatedPerDay} offerte/giorno
                                            </p>
                                        </button>
                                    );
                                })}
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

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* DEAL PUBLISH MODE SECTION */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div className="border-t border-afflyt-glass-border my-6 pt-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <Tag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-white">Tipo di Offerte</h4>
                                    <p className="text-xs text-gray-400">Quali offerte vuoi pubblicare?</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {/* Discounted Only */}
                                <button
                                    onClick={() => setRule({ ...rule, dealPublishMode: 'DISCOUNTED_ONLY' })}
                                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                                        rule.dealPublishMode === 'DISCOUNTED_ONLY'
                                            ? 'bg-green-500/10 border-green-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-green-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Tag className={`w-5 h-5 ${rule.dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-green-400' : 'text-gray-500'}`} />
                                        <div className="flex-1">
                                            <p className={`font-medium ${rule.dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-white' : 'text-gray-300'}`}>
                                                Solo Sconti Visibili
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Solo offerte con prezzo barrato su Amazon (es. €29.99 → €19.99)
                                            </p>
                                        </div>
                                        {rule.dealPublishMode === 'DISCOUNTED_ONLY' && (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Lowest Price */}
                                <button
                                    onClick={() => setRule({ ...rule, dealPublishMode: 'LOWEST_PRICE' })}
                                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                                        rule.dealPublishMode === 'LOWEST_PRICE'
                                            ? 'bg-blue-500/10 border-blue-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-blue-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <TrendingDown className={`w-5 h-5 ${rule.dealPublishMode === 'LOWEST_PRICE' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <div className="flex-1">
                                            <p className={`font-medium ${rule.dealPublishMode === 'LOWEST_PRICE' ? 'text-white' : 'text-gray-300'}`}>
                                                Solo Minimi Storici
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Quando il prezzo è al minimo (anche senza sconto visibile)
                                            </p>
                                        </div>
                                        {rule.dealPublishMode === 'LOWEST_PRICE' && (
                                            <CheckCircle className="w-5 h-5 text-blue-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Both */}
                                <button
                                    onClick={() => setRule({ ...rule, dealPublishMode: 'BOTH' })}
                                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                                        rule.dealPublishMode === 'BOTH'
                                            ? 'bg-purple-500/10 border-purple-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Zap className={`w-5 h-5 ${rule.dealPublishMode === 'BOTH' ? 'text-purple-400' : 'text-gray-500'}`} />
                                        <div className="flex-1">
                                            <p className={`font-medium ${rule.dealPublishMode === 'BOTH' ? 'text-white' : 'text-gray-300'}`}>
                                                Entrambi
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Pubblica sia sconti visibili che minimi storici
                                            </p>
                                        </div>
                                        {rule.dealPublishMode === 'BOTH' && (
                                            <CheckCircle className="w-5 h-5 text-purple-400" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* KEEPA CHART TOGGLE */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div className="p-4 bg-afflyt-glass-white rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">Grafico Storico Prezzi</p>
                                    <p className="text-xs text-gray-400">
                                        Includi il grafico Keepa per mostrare l'andamento
                                    </p>
                                </div>
                                <button
                                    onClick={() => setRule({ ...rule, showKeepaButton: !rule.showKeepaButton })}
                                    className={`w-12 h-6 rounded-full transition-all ${
                                        rule.showKeepaButton ? 'bg-orange-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-all transform ${
                                        rule.showKeepaButton ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                                </button>
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
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Frequenza</span>
                                <span className="text-purple-400">
                                    {schedulePresets.find(p => p.id === rule.schedulePreset)?.emoji}{' '}
                                    {schedulePresets.find(p => p.id === rule.schedulePreset)?.label}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Tipo Offerte</span>
                                <span className={
                                    rule.dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-green-400' :
                                    rule.dealPublishMode === 'LOWEST_PRICE' ? 'text-blue-400' : 'text-purple-400'
                                }>
                                    {rule.dealPublishMode === 'DISCOUNTED_ONLY' && '🏷️ Solo Sconti'}
                                    {rule.dealPublishMode === 'LOWEST_PRICE' && '📉 Solo Minimi'}
                                    {rule.dealPublishMode === 'BOTH' && '⚡ Entrambi'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Grafico Keepa</span>
                                <span className={rule.showKeepaButton ? 'text-orange-400' : 'text-gray-500'}>
                                    {rule.showKeepaButton ? '📊 Incluso' : 'Non incluso'}
                                </span>
                            </div>
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
