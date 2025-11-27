'use client';

import { useState } from 'react';
import {
    Zap,
    Play,
    Settings,
    Trash2,
    Clock,
    Send,
    Package,
    Copy,
    Target,
    Activity,
    ChevronDown,
    ChevronUp,
    Save,
    X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface RuleCardProps {
    rule: {
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        categories: string;
        minScore: number;
        maxPrice?: number;
        channelId?: string;
        channel?: {
            name: string;
        };
        totalRuns: number;
        lastRunAt?: string;
        stats?: {
            dealsFound: number;
            dealsPublished: number;
            conversionRate: number;
            revenue: number;
        };
        status?: 'idle' | 'running' | 'error';
    };
    onToggle: (id: string) => void;
    onTest: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onQuickEdit?: (id: string, updates: { minScore?: number; maxPrice?: number }) => void;
}

export const RuleCard = ({ rule, onToggle, onTest, onEdit, onDelete, onDuplicate, onQuickEdit }: RuleCardProps) => {
    const t = useTranslations('automations.card');
    const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
    const [quickEditValues, setQuickEditValues] = useState({
        minScore: rule.minScore,
        maxPrice: rule.maxPrice
    });

    const categories = JSON.parse(rule.categories);
    const stats = rule.stats || {
        dealsFound: 0,
        dealsPublished: 0,
        conversionRate: 0,
        revenue: 0
    };

    const getStatusColor = () => {
        if (!rule.isActive) return 'bg-gray-500';
        if (rule.status === 'running') return 'bg-afflyt-cyan-400 animate-pulse';
        if (rule.status === 'error') return 'bg-red-400';
        return 'bg-afflyt-profit-400';
    };

    const getPerformanceBadge = () => {
        const rate = stats.conversionRate;
        if (rate > 5) return { label: t('performance.topPerformer'), color: 'text-amber-400 bg-amber-500/20 border border-amber-500/30', icon: '🏆' };
        if (rate > 3) return { label: t('performance.highPerformance'), color: 'text-afflyt-cyan-400 bg-afflyt-cyan-500/20 border border-afflyt-cyan-500/30', icon: '🥈' };
        if (rate > 1) return { label: t('performance.moderate'), color: 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30', icon: '📈' };
        return { label: t('performance.optimizing'), color: 'text-gray-400 bg-gray-500/20 border border-gray-500/30', icon: '🔧' };
    };

    const getRunningStatus = () => {
        if (rule.status === 'running') return { label: 'In esecuzione', color: 'text-afflyt-cyan-400 animate-pulse' };
        if (rule.status === 'error') return { label: 'Errore', color: 'text-red-400' };
        if (!rule.isActive) return { label: 'In pausa', color: 'text-gray-400' };
        return { label: 'Attiva', color: 'text-afflyt-profit-400' };
    };

    const perfBadge = getPerformanceBadge();

    const formatRelativeTime = (dateString?: string) => {
        if (!dateString) return t('time.never');
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}${t('time.days')} ${t('time.ago')}`;
        if (hours > 0) return `${hours}${t('time.hours')} ${t('time.ago')}`;
        if (minutes > 0) return `${minutes}${t('time.minutes')} ${t('time.ago')}`;
        return t('time.now');
    };

    return (
        <GlassCard
            className={`relative overflow-hidden transition-all duration-500 ${rule.isActive
                    ? 'border-afflyt-cyan-500/30 hover:border-afflyt-cyan-500/50'
                    : 'border-afflyt-glass-border hover:border-gray-600'
                }`}
        >
            {/* Status LED Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor()}`} />

            {/* Performance Glow Effect */}
            {rule.isActive && stats.conversionRate > 3 && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-afflyt-cyan-500/10 rounded-full blur-3xl" />
            )}

            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {/* Status Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.isActive ? 'bg-afflyt-cyan-500/10' : 'bg-gray-500/10'
                                }`}>
                                {rule.status === 'running' ? (
                                    <Activity className="w-5 h-5 text-afflyt-cyan-400 animate-pulse" />
                                ) : (
                                    <Zap className={`w-5 h-5 ${rule.isActive ? 'text-afflyt-cyan-400' : 'text-gray-500'
                                        }`} />
                                )}
                            </div>

                            {/* Title & Badge */}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    {rule.name}
                                    {stats.conversionRate > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${perfBadge.color}`}>
                                            <span>{perfBadge.icon}</span>
                                            {perfBadge.label}
                                        </span>
                                    )}
                                </h3>
                                {rule.description && (
                                    <p className="text-sm text-gray-400 mt-0.5">{rule.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Power Toggle */}
                    <button
                        onClick={() => onToggle(rule.id)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${rule.isActive
                                ? 'bg-afflyt-cyan-500/20 border border-afflyt-cyan-500/40'
                                : 'bg-gray-700 border border-gray-600'
                            }`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full transition-transform duration-300 ${rule.isActive
                                ? 'translate-x-7 bg-afflyt-cyan-400 shadow-[0_0_10px_rgba(0,229,224,0.5)]'
                                : 'translate-x-1 bg-gray-400'
                            }`} />
                    </button>
                </div>

                {/* Target Configuration */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        {/* Categories */}
                        <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-gray-500" />
                            <div className="flex gap-1 flex-wrap">
                                {categories.slice(0, 2).map((cat: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-afflyt-dark-50 rounded text-xs text-gray-300">
                                        {cat}
                                    </span>
                                ))}
                                {categories.length > 2 && (
                                    <span className="text-xs text-gray-500">+{categories.length - 2}</span>
                                )}
                            </div>
                        </div>

                        {/* Min Score */}
                        <div className="flex items-center gap-2 text-sm">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400">Min Score:</span>
                            <span className="font-mono text-afflyt-cyan-400">{rule.minScore}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {/* Channel */}
                        {rule.channel && (
                            <div className="flex items-center gap-2 text-sm">
                                <Send className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-300 truncate">{rule.channel.name}</span>
                            </div>
                        )}

                        {/* Max Price */}
                        {rule.maxPrice && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Max:</span>
                                <span className="font-mono text-gray-300">€{rule.maxPrice}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-3 p-3 bg-afflyt-dark-50 rounded-lg mb-4">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">{t('metrics.runs')}</p>
                        <p className="text-lg font-mono text-white">{rule.totalRuns}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">{t('metrics.found')}</p>
                        <p className="text-lg font-mono text-afflyt-cyan-400">{stats.dealsFound}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">{t('metrics.published')}</p>
                        <p className="text-lg font-mono text-afflyt-profit-400">{stats.dealsPublished}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">{t('metrics.conv')}</p>
                        <p className="text-lg font-mono text-orange-400">{stats.conversionRate}%</p>
                    </div>
                </div>

                {/* Timing Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('actions.lastRun')}: {formatRelativeTime(rule.lastRunAt)}
                    </span>

                    {/* Revenue if available */}
                    {stats.revenue > 0 && (
                        <span className="text-afflyt-profit-400 font-mono">
                            €{stats.revenue.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Quick Edit Panel */}
                {isQuickEditOpen && onQuickEdit && (
                    <div className="p-4 bg-afflyt-dark-100 rounded-lg mb-4 border border-afflyt-cyan-500/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-white">Modifica Rapida</span>
                            <button
                                onClick={() => setIsQuickEditOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Min Score */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-gray-400">Min Score</label>
                                    <span className="text-sm font-mono text-afflyt-cyan-400">{quickEditValues.minScore}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={quickEditValues.minScore}
                                    onChange={(e) => setQuickEditValues({ ...quickEditValues, minScore: Number(e.target.value) })}
                                    className="w-full h-2 bg-afflyt-dark-50 rounded-lg appearance-none cursor-pointer accent-afflyt-cyan-400"
                                />
                            </div>

                            {/* Max Price */}
                            <div>
                                <label className="text-xs text-gray-400 block mb-2">Max Prezzo (€)</label>
                                <input
                                    type="number"
                                    value={quickEditValues.maxPrice || ''}
                                    onChange={(e) => setQuickEditValues({ ...quickEditValues, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="Nessun limite"
                                    className="w-full px-3 py-2 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <CyberButton
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQuickEditValues({ minScore: rule.minScore, maxPrice: rule.maxPrice });
                                    setIsQuickEditOpen(false);
                                }}
                                className="flex-1"
                            >
                                Annulla
                            </CyberButton>
                            <CyberButton
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    onQuickEdit(rule.id, quickEditValues);
                                    setIsQuickEditOpen(false);
                                }}
                                className="flex-1"
                            >
                                <Save className="w-3 h-3 mr-1" />
                                Salva
                            </CyberButton>
                        </div>
                    </div>
                )}

                {/* Action Bar - Always Visible */}
                <div className="pt-4 border-t border-afflyt-glass-border">
                    <div className="flex items-center gap-2">
                        <CyberButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onTest(rule.id)}
                            className="flex-1"
                        >
                            <Play className="w-3 h-3 mr-1" />
                            {t('actions.test')}
                        </CyberButton>

                        {/* Quick Edit Toggle */}
                        {onQuickEdit && (
                            <button
                                onClick={() => setIsQuickEditOpen(!isQuickEditOpen)}
                                className={`p-2 border rounded-lg transition-colors ${isQuickEditOpen
                                    ? 'bg-afflyt-cyan-500/20 border-afflyt-cyan-500/40 text-afflyt-cyan-400'
                                    : 'hover:bg-afflyt-cyan-500/10 border-afflyt-glass-border hover:border-afflyt-cyan-500/40 text-gray-400 hover:text-afflyt-cyan-400'
                                    }`}
                                title="Modifica rapida"
                            >
                                {isQuickEditOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        )}

                        <button
                            onClick={() => onEdit(rule.id)}
                            className="p-2 hover:bg-afflyt-cyan-500/10 border border-afflyt-glass-border hover:border-afflyt-cyan-500/40 rounded-lg transition-colors"
                            title={t('actions.edit')}
                        >
                            <Settings className="w-4 h-4 text-gray-400 hover:text-afflyt-cyan-400" />
                        </button>
                        <button
                            onClick={() => onDuplicate(rule.id)}
                            className="p-2 hover:bg-afflyt-cyan-500/10 border border-afflyt-glass-border hover:border-afflyt-cyan-500/40 rounded-lg transition-colors"
                            title={t('actions.duplicate')}
                        >
                            <Copy className="w-4 h-4 text-gray-400 hover:text-afflyt-cyan-400" />
                        </button>
                        <button
                            onClick={() => onDelete(rule.id)}
                            className="p-2 hover:bg-red-500/10 border border-afflyt-glass-border hover:border-red-500/40 rounded-lg transition-colors"
                            title={t('actions.delete')}
                        >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
