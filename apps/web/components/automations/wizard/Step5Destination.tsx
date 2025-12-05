'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Radio, Plus, AlertCircle, BarChart3 } from 'lucide-react';
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

interface Step5DestinationProps {
    channelId: string;
    showKeepaButton: boolean;
    onChange: (channelId: string) => void;
    onKeepaButtonChange: (show: boolean) => void;
}

export function Step5Destination({
    channelId,
    showKeepaButton,
    onChange,
    onKeepaButtonChange,
}: Step5DestinationProps) {
    const t = useTranslations('automations.wizard.step5');
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            } catch (err) {
                setError('Failed to load channels');
            } finally {
                setIsLoading(false);
            }
        };

        fetchChannels();
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
                            type="button"
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
                                    type="button"
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

            {/* Post Buttons */}
            <div className="space-y-3 pt-4 border-t border-afflyt-glass-border">
                <label className="block text-sm font-medium text-gray-300">
                    {t('buttons.title')}
                </label>

                {/* Buy Button (always enabled) */}
                <GlassCard className="p-4 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-lg">
                            🛒
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">{t('buttons.buy.label')}</p>
                            <p className="text-xs text-gray-500">{t('buttons.buy.desc')}</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/20 rounded text-xs text-emerald-400">
                            {t('buttons.alwaysEnabled')}
                        </span>
                    </div>
                </GlassCard>

                {/* Keepa Button (toggle) */}
                <button
                    type="button"
                    onClick={() => onKeepaButtonChange(!showKeepaButton)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                        showKeepaButton
                            ? 'bg-orange-500/10 border-orange-500/40'
                            : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-orange-500/30'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            showKeepaButton ? 'bg-orange-500/20' : 'bg-afflyt-dark-100'
                        }`}>
                            <BarChart3 className={`w-5 h-5 ${showKeepaButton ? 'text-orange-400' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${showKeepaButton ? 'text-white' : 'text-gray-300'}`}>
                                {t('buttons.keepa.label')}
                            </p>
                            <p className="text-xs text-gray-500">
                                {t('buttons.keepa.desc')}
                            </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all ${
                            showKeepaButton ? 'bg-orange-500' : 'bg-gray-600'
                        }`}>
                            <div className={`w-5 h-5 bg-white rounded-full transition-all transform ${
                                showKeepaButton ? 'translate-x-6' : 'translate-x-0.5'
                            } mt-0.5`} />
                        </div>
                    </div>
                </button>
            </div>

            {/* Preview */}
            {showKeepaButton && (
                <GlassCard className="p-4 bg-afflyt-dark-100/50">
                    <p className="text-xs text-gray-500 mb-2">{t('buttons.preview')}</p>
                    <div className="flex gap-2">
                        <span className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-sm text-emerald-300">
                            🛒 Acquista
                        </span>
                        <span className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/40 rounded-lg text-sm text-orange-300">
                            📊 Storico Prezzi
                        </span>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
