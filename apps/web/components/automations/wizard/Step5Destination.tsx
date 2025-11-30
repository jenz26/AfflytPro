'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Radio, Clock, Zap, Plus, AlertCircle, Tag, TrendingDown, BarChart3, Bot, FileText, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';
import Link from 'next/link';

interface Channel {
    id: string;
    name: string;
    platform: 'TELEGRAM' | 'DISCORD';
    channelId: string;
    status: 'CONNECTED' | 'PENDING' | 'ERROR';
    amazonTag?: string | null;
}

interface AffiliateTag {
    id: string;
    tag: string;
    label: string;
    marketplace: string;
    isDefault: boolean;
}

type DealPublishMode = 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH';
type CopyMode = 'TEMPLATE' | 'LLM';

interface Step5DestinationProps {
    channelId: string;
    userPlan: string;
    frequencyLabel: string;
    dealPublishMode?: DealPublishMode;
    includeKeepaChart?: boolean;
    affiliateTagId?: string;
    // LLM Copy props
    copyMode?: CopyMode;
    customStylePrompt?: string;
    onChange: (channelId: string) => void;
    onDealModeChange?: (mode: DealPublishMode) => void;
    onKeepaChartChange?: (include: boolean) => void;
    onAffiliateTagChange?: (tagId: string) => void;
    onCopyModeChange?: (mode: CopyMode) => void;
    onStylePromptChange?: (prompt: string) => void;
}

export function Step5Destination({
    channelId,
    userPlan,
    frequencyLabel,
    dealPublishMode = 'DISCOUNTED_ONLY',
    includeKeepaChart = false,
    affiliateTagId = '',
    copyMode = 'TEMPLATE',
    customStylePrompt = '',
    onChange,
    onDealModeChange,
    onKeepaChartChange,
    onAffiliateTagChange,
    onCopyModeChange,
    onStylePromptChange
}: Step5DestinationProps) {
    const t = useTranslations('automations.wizard.step5');
    const [channels, setChannels] = useState<Channel[]>([]);
    const [affiliateTags, setAffiliateTags] = useState<AffiliateTag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch channels and affiliate tags in parallel
                const [channelsRes, tagsRes] = await Promise.all([
                    fetch(`${API_BASE}/user/channels`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE}/user/affiliate-tags`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (channelsRes.ok) {
                    const data = await channelsRes.json();
                    setChannels(data.channels || []);
                }

                if (tagsRes.ok) {
                    const data = await tagsRes.json();
                    setAffiliateTags(data.tags || []);

                    // Auto-select default tag if none selected
                    if (!affiliateTagId && onAffiliateTagChange) {
                        const defaultTag = (data.tags || []).find((t: AffiliateTag) => t.isDefault);
                        if (defaultTag) {
                            onAffiliateTagChange(defaultTag.id);
                        }
                    }
                }
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const connectedChannels = channels.filter(c => c.status === 'CONNECTED');
    const isTestingMode = !channelId || channelId === '';
    const selectedChannel = channels.find(c => c.id === channelId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('title')}</h3>
                    <p className="text-sm text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Channel Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    {t('channelLabel')}
                </label>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-afflyt-cyan-500 border-t-transparent rounded-full" />
                        <span className="ml-3 text-gray-400">{t('loadingChannels')}</span>
                    </div>
                ) : connectedChannels.length === 0 ? (
                    <GlassCard className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                        <p className="text-white font-medium mb-2">{t('noChannels')}</p>
                        <p className="text-sm text-gray-400 mb-4">{t('noChannelsHint')}</p>
                        <Link href="/settings/channels">
                            <CyberButton variant="secondary">
                                <Plus className="w-4 h-4 mr-2" />
                                {t('connectChannel')}
                            </CyberButton>
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="space-y-3">
                        {/* Testing Mode Option */}
                        <button
                            onClick={() => onChange('')}
                            className={`w-full p-4 rounded-lg border transition-all text-left ${
                                isTestingMode
                                    ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                                    : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isTestingMode ? 'bg-afflyt-cyan-500/20' : 'bg-afflyt-dark-100'
                                }`}>
                                    <Radio className={`w-5 h-5 ${isTestingMode ? 'text-afflyt-cyan-400' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <p className={`font-medium ${isTestingMode ? 'text-white' : 'text-gray-300'}`}>
                                        {t('testingMode.label')}
                                    </p>
                                    <p className="text-xs text-gray-500">{t('testingMode.description')}</p>
                                </div>
                                {isTestingMode && (
                                    <div className="ml-auto w-5 h-5 bg-afflyt-cyan-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                    </div>
                                )}
                            </div>
                        </button>

                        {/* Channel Options */}
                        {connectedChannels.map((channel) => {
                            const isSelected = channelId === channel.id;
                            const platformIcon = channel.platform === 'TELEGRAM' ? '📱' : '🎮';

                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => onChange(channel.id)}
                                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                                        isSelected
                                            ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                                            isSelected ? 'bg-afflyt-cyan-500/20' : 'bg-afflyt-dark-100'
                                        }`}>
                                            {platformIcon}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {channel.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {channel.platform} • {channel.channelId}
                                            </p>
                                            {channel.amazonTag && (
                                                <p className="text-xs text-afflyt-cyan-400 mt-1">
                                                    🏷️ Tag: {channel.amazonTag}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 bg-afflyt-cyan-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Affiliate Tag Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    {t('affiliateTag.label')}
                </label>
                {affiliateTags.length === 0 ? (
                    <GlassCard className="p-4 border-orange-500/30 bg-orange-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <Tag className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">{t('affiliateTag.noTags')}</p>
                                <p className="text-xs text-gray-400">{t('affiliateTag.noTagsHint')}</p>
                            </div>
                            <Link href="/settings/affiliate-tags">
                                <CyberButton variant="secondary" className="text-xs">
                                    <Plus className="w-3 h-3 mr-1" />
                                    {t('affiliateTag.addTag')}
                                </CyberButton>
                            </Link>
                        </div>
                    </GlassCard>
                ) : (
                    <div className="space-y-2">
                        {affiliateTags.map((tag) => {
                            const isSelected = affiliateTagId === tag.id;
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => onAffiliateTagChange?.(tag.id)}
                                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                                        isSelected
                                            ? 'bg-orange-500/10 border-orange-500/40'
                                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-orange-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            isSelected ? 'bg-orange-500/20' : 'bg-afflyt-dark-100'
                                        }`}>
                                            <Tag className={`w-5 h-5 ${isSelected ? 'text-orange-400' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                    {tag.label}
                                                </p>
                                                {tag.isDefault && (
                                                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-medium rounded">
                                                        DEFAULT
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono">{tag.tag}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                        <Link href="/settings/affiliate-tags" className="block mt-2">
                            <button className="w-full p-3 rounded-lg border border-dashed border-afflyt-glass-border hover:border-orange-500/30 transition-colors text-gray-400 hover:text-orange-400 text-sm flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" />
                                {t('affiliateTag.manageTagsHint')}
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Frequency Info */}
            <GlassCard className="p-4 bg-afflyt-dark-100/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">{t('frequency.title')}</p>
                        <p className="text-xs text-gray-400">
                            {t('frequency.current', { plan: userPlan })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-afflyt-cyan-400">{frequencyLabel}</p>
                        {userPlan === 'FREE' && (
                            <Link href="/settings/billing" className="text-xs text-gray-500 hover:text-afflyt-cyan-400">
                                {t('frequency.upgradeHint')}
                            </Link>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Max Results Info */}
            <GlassCard className="p-4 bg-afflyt-dark-100/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">{t('maxResults.title')}</p>
                        <p className="text-xs text-gray-400">{t('maxResults.description')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">
                            {userPlan === 'BUSINESS' ? '30' : userPlan === 'PRO' ? '15' : '5'}
                        </p>
                        <p className="text-xs text-gray-500">{t('maxResults.perRun')}</p>
                    </div>
                </div>
            </GlassCard>

            {/* Deal Publish Mode */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    Tipo di offerte da pubblicare
                </label>
                <div className="space-y-2">
                    {/* Discounted Only */}
                    <button
                        onClick={() => onDealModeChange?.('DISCOUNTED_ONLY')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            dealPublishMode === 'DISCOUNTED_ONLY'
                                ? 'bg-green-500/10 border-green-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-green-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dealPublishMode === 'DISCOUNTED_ONLY' ? 'bg-green-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Tag className={`w-5 h-5 ${dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-green-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-white' : 'text-gray-300'}`}>
                                    Solo Sconti Visibili
                                </p>
                                <p className="text-xs text-gray-500">
                                    Pubblica solo offerte con prezzo barrato su Amazon (es. €29.99 → €19.99)
                                </p>
                            </div>
                            {dealPublishMode === 'DISCOUNTED_ONLY' && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Lowest Price */}
                    <button
                        onClick={() => onDealModeChange?.('LOWEST_PRICE')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            dealPublishMode === 'LOWEST_PRICE'
                                ? 'bg-blue-500/10 border-blue-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-blue-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dealPublishMode === 'LOWEST_PRICE' ? 'bg-blue-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <TrendingDown className={`w-5 h-5 ${dealPublishMode === 'LOWEST_PRICE' ? 'text-blue-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${dealPublishMode === 'LOWEST_PRICE' ? 'text-white' : 'text-gray-300'}`}>
                                    Solo Minimi Storici
                                </p>
                                <p className="text-xs text-gray-500">
                                    Pubblica solo quando il prezzo è al minimo storico (anche senza sconto visibile)
                                </p>
                            </div>
                            {dealPublishMode === 'LOWEST_PRICE' && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Both */}
                    <button
                        onClick={() => onDealModeChange?.('BOTH')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            dealPublishMode === 'BOTH'
                                ? 'bg-purple-500/10 border-purple-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dealPublishMode === 'BOTH' ? 'bg-purple-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Zap className={`w-5 h-5 ${dealPublishMode === 'BOTH' ? 'text-purple-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${dealPublishMode === 'BOTH' ? 'text-white' : 'text-gray-300'}`}>
                                    Entrambi
                                </p>
                                <p className="text-xs text-gray-500">
                                    Pubblica sia sconti visibili che minimi storici
                                </p>
                            </div>
                            {dealPublishMode === 'BOTH' && (
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Keepa Chart Toggle */}
            <GlassCard className="p-4 bg-afflyt-dark-100/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">Grafico Storico Prezzi</p>
                        <p className="text-xs text-gray-400">
                            Includi il grafico Keepa per mostrare l'andamento dei prezzi
                        </p>
                    </div>
                    <button
                        onClick={() => onKeepaChartChange?.(!includeKeepaChart)}
                        className={`w-12 h-6 rounded-full transition-all ${
                            includeKeepaChart ? 'bg-orange-500' : 'bg-gray-600'
                        }`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full transition-all transform ${
                            includeKeepaChart ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                    </button>
                </div>
            </GlassCard>

            {/* Copy Mode Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    Generazione Testo Messaggi
                </label>
                <div className="space-y-2">
                    {/* Template Mode */}
                    <button
                        onClick={() => onCopyModeChange?.('TEMPLATE')}
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
                                    Template Standard
                                </p>
                                <p className="text-xs text-gray-500">
                                    Usa il formato predefinito con prezzo, sconto e rating
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
                        onClick={() => onCopyModeChange?.('LLM')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            copyMode === 'LLM'
                                ? 'bg-purple-500/10 border-purple-500/40'
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
                                        AI Copywriter
                                    </p>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/30 text-purple-300 rounded-full">
                                        BETA
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Genera testi unici e coinvolgenti con GPT-4o-mini
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

            {/* Custom Style Prompt (only for LLM mode) */}
            {copyMode === 'LLM' && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-300">
                            Stile del tuo canale (opzionale)
                        </label>
                        <span className={`text-xs ${(customStylePrompt?.length || 0) > 280 ? 'text-orange-400' : 'text-gray-500'}`}>
                            {customStylePrompt?.length || 0}/300
                        </span>
                    </div>
                    <textarea
                        value={customStylePrompt}
                        onChange={(e) => {
                            if (e.target.value.length <= 300) {
                                onStylePromptChange?.(e.target.value);
                            }
                        }}
                        placeholder="Es: Tono amichevole, usa emoji con moderazione, spiega il valore pratico del prodotto, rivolgiti al lettore con il 'tu'"
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500">
                        Descrivi brevemente il tono e lo stile che vuoi per i messaggi. L'AI seguirà queste indicazioni.
                    </p>
                    <GlassCard className="p-3 bg-purple-500/5 border-purple-500/20">
                        <div className="flex items-start gap-2">
                            <Bot className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-purple-300">
                                L'AI genera testi compliance-safe per Amazon, senza inventare prezzi o claim falsi.
                                Costo stimato: ~€0.001 per messaggio.
                            </p>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
