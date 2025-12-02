'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Send,
    Plus,
    CheckCircle,
    AlertCircle,
    Loader2,
    Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ChannelsEmptyState } from '@/components/channels/ChannelsEmptyState';
import { ChannelCard, Channel } from '@/components/channels/ChannelCard';
import { API_BASE } from '@/lib/api/config';
import { CommandBar } from '@/components/navigation/CommandBar';
import { Analytics } from '@/components/analytics/PostHogProvider';

export default function ChannelsPage() {
    const t = useTranslations('channels');
    const tCommon = useTranslations('common');

    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingChannel, setIsAddingChannel] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [setupStep, setSetupStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newChannel, setNewChannel] = useState({
        platform: 'TELEGRAM',
        name: '',
        channelId: '',
        botToken: '',
        credentialId: ''
    });

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }
            const res = await fetch(`${API_BASE}/user/channels`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChannels(data.channels || []);
            }
        } catch (error) {
            console.error('Failed to fetch channels', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlatform = (platform: string) => {
        setSelectedPlatform(platform);
        setNewChannel(prev => ({ ...prev, platform: platform.toUpperCase() }));
        setIsAddingChannel(true);
        setSetupStep(1);
        // Track wizard opened
        Analytics.track('channel_wizard_opened', {
            platform: platform.toLowerCase(),
        });
    };

    const handleStep1_SaveToken = async () => {
        if (!newChannel.botToken) return alert(t('wizard.botTokenRequired'));
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider: 'TELEGRAM_BOT',
                    key: newChannel.botToken,
                    label: `Bot for ${newChannel.name || 'New Channel'}`
                })
            });

            if (res.ok) {
                const cred = await res.json();
                setNewChannel(prev => ({ ...prev, credentialId: cred.id }));
                // Track step 1 completed
                Analytics.track('channel_wizard_step_completed', {
                    step: 1,
                    step_name: 'Bot Token',
                    platform: newChannel.platform.toLowerCase(),
                });
                setSetupStep(2);
            } else {
                alert(t('wizard.tokenSaveError'));
            }
        } catch (error) {
            console.error(error);
            alert(t('wizard.connectionError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleStep2_Continue = () => {
        // Track step 2 completed
        Analytics.track('channel_wizard_step_completed', {
            step: 2,
            step_name: 'Channel Details',
            platform: newChannel.platform.toLowerCase(),
        });
        setSetupStep(3);
    };

    const handleStep3_CreateChannel = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/channels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newChannel.name,
                    platform: newChannel.platform,
                    channelId: newChannel.channelId,
                    credentialId: newChannel.credentialId
                })
            });

            if (res.ok) {
                // Track step 3 completed and wizard completed
                Analytics.track('channel_wizard_step_completed', {
                    step: 3,
                    step_name: 'Verify',
                    platform: newChannel.platform.toLowerCase(),
                });
                Analytics.track('channel_wizard_completed', {
                    platform: newChannel.platform.toLowerCase(),
                });
                // Track channel connected in PostHog
                console.log('[Channels] Tracking channel_connected:', newChannel.platform.toLowerCase());
                Analytics.trackChannelConnected(newChannel.platform.toLowerCase());

                resetWizard();
                fetchChannels();
            } else {
                alert(t('wizard.channelCreateError'));
            }
        } catch (error) {
            console.error(error);
            alert(t('wizard.connectionError'));
        } finally {
            setIsSaving(false);
        }
    };

    const resetWizard = () => {
        setIsAddingChannel(false);
        setSelectedPlatform(null);
        setSetupStep(1);
        setNewChannel({ platform: 'TELEGRAM', name: '', channelId: '', botToken: '', credentialId: '' });
    };

    const handleCancelWizard = () => {
        // Track wizard abandoned
        Analytics.track('channel_wizard_abandoned', {
            step: setupStep,
            step_name: setupStep === 1 ? 'Bot Token' : setupStep === 2 ? 'Channel Details' : 'Verify',
            platform: newChannel.platform.toLowerCase(),
        });
        resetWizard();
    };

    const handleDeleteClick = (channel: Channel) => {
        setChannelToDelete(channel);
    };

    const handleDeleteConfirm = async () => {
        if (!channelToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/user/channels/${channelToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchChannels();
            setChannelToDelete(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const isFirstTime = channels.length === 0 && !isAddingChannel;

    if (isLoading) {
        return (
            <>
                <CommandBar />
                <main className="pt-16 lg:pt-16 min-h-screen bg-afflyt-dark-100">
                    <div className="p-8">
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-400">{tCommon('loading')}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <CommandBar />
            <main className="pt-16 lg:pt-16 min-h-screen bg-afflyt-dark-100">
                <div className="p-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <Send className="w-5 h-5 text-afflyt-dark-100" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                                <p className="text-sm text-gray-400">{t('subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Stats Header (when channels exist) */}
                        {!isFirstTime && !isAddingChannel && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-afflyt-cyan-400 font-mono">
                                            {channels.length}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase">
                                            {t('header.activeChannels')}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-afflyt-profit-400 font-mono">
                                            {channels.reduce((sum, c) => sum + (c.stats?.totalPosts || 0), 0)}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase">
                                            {t('header.postsPublished')}
                                        </div>
                                    </div>
                                </div>
                                <CyberButton onClick={() => setIsAddingChannel(true)} variant="primary">
                                    <Plus className="w-4 h-4" />
                                    {t('addChannel')}
                                </CyberButton>
                            </div>
                        )}

                        {/* Empty State */}
                        {isFirstTime && (
                            <ChannelsEmptyState onSelectPlatform={handleSelectPlatform} />
                        )}

                        {/* Wizard */}
                        {isAddingChannel && (
                            <GlassCard className="p-6 border-afflyt-cyan-500/40">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-afflyt-cyan-500/20 rounded-lg flex items-center justify-center">
                                            <Send className="w-5 h-5 text-afflyt-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{t('wizard.title')}</h3>
                                            <p className="text-sm text-gray-500">{t('wizard.subtitle')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3].map(step => (
                                            <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${setupStep === step
                                                ? 'bg-afflyt-cyan-500 text-black'
                                                : setupStep > step
                                                    ? 'bg-afflyt-profit-400 text-black'
                                                    : 'bg-afflyt-dark-50 text-gray-500'
                                                }`}>
                                                {setupStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 1: Bot Token */}
                                {setupStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-afflyt-cyan-400" />
                                                {t('wizard.instructions')}
                                            </h4>
                                            <ol className="space-y-2">
                                                {[1, 2, 3].map((i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                                        <span className="flex-shrink-0 w-5 h-5 bg-afflyt-cyan-500/20 text-afflyt-cyan-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                            {i}
                                                        </span>
                                                        {t(`wizard.step${i}`)}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('wizard.botToken')}</label>
                                            <input
                                                type="password"
                                                value={newChannel.botToken}
                                                onChange={(e) => setNewChannel({ ...newChannel, botToken: e.target.value })}
                                                placeholder={t('wizard.botTokenPlaceholder')}
                                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">{t('wizard.botTokenHelp')}</p>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <CyberButton variant="ghost" onClick={handleCancelWizard}>{tCommon('cancel')}</CyberButton>
                                            <CyberButton variant="primary" onClick={handleStep1_SaveToken} disabled={isSaving || !newChannel.botToken}>
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('wizard.saveAndContinue')}
                                            </CyberButton>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Channel Details */}
                                {setupStep === 2 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('wizard.channelName')}</label>
                                            <input
                                                type="text"
                                                value={newChannel.name}
                                                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                                placeholder={t('wizard.channelNamePlaceholder')}
                                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('wizard.channelId')}</label>
                                            <input
                                                type="text"
                                                value={newChannel.channelId}
                                                onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                                                placeholder={t('wizard.channelIdPlaceholder')}
                                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                                            />
                                            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {t('wizard.addBotAsAdmin')}
                                            </p>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <CyberButton variant="ghost" onClick={() => setSetupStep(1)}>{tCommon('back')}</CyberButton>
                                            <CyberButton variant="primary" onClick={handleStep2_Continue} disabled={!newChannel.name || !newChannel.channelId}>
                                                {tCommon('next')}
                                            </CyberButton>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Verify */}
                                {setupStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-gradient-to-r from-afflyt-cyan-500/10 to-blue-600/10 rounded-lg border border-afflyt-cyan-500/30">
                                            <div className="text-center mb-4">
                                                <div className="w-16 h-16 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <CheckCircle className="w-8 h-8 text-afflyt-cyan-400" />
                                                </div>
                                                <h4 className="text-lg font-semibold text-white mb-2">{t('wizard.readyToConnect')}</h4>
                                                <p className="text-gray-400 text-sm">
                                                    {t('wizard.summary')}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm max-w-sm mx-auto">
                                                <div className="text-right text-gray-500">{t('wizard.platformLabel')}:</div>
                                                <div className="text-white font-medium">Telegram</div>
                                                <div className="text-right text-gray-500">{t('wizard.nameLabel')}:</div>
                                                <div className="text-white font-medium">{newChannel.name}</div>
                                                <div className="text-right text-gray-500">{t('wizard.channelIdLabel')}:</div>
                                                <div className="text-afflyt-cyan-400 font-mono">{newChannel.channelId}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <CyberButton variant="ghost" onClick={() => setSetupStep(2)}>{tCommon('back')}</CyberButton>
                                            <CyberButton variant="primary" onClick={handleStep3_CreateChannel} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('wizard.confirmAndConnect')}
                                            </CyberButton>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        )}

                        {/* Channel List (Active State) */}
                        {!isFirstTime && !isAddingChannel && (
                            <div className="space-y-6">
                                {/* Add New Card */}
                                <button
                                    onClick={() => setIsAddingChannel(true)}
                                    className="w-full p-6 border-2 border-dashed border-afflyt-glass-border rounded-xl text-gray-400 hover:text-afflyt-cyan-400 hover:border-afflyt-cyan-500/50 transition-all group"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center group-hover:bg-afflyt-cyan-500/20 transition-colors">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-white mb-1">
                                                {t('activeState.addNew.title')}
                                            </div>
                                            <div className="text-sm">
                                                {t('activeState.addNew.description')}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Channels Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {channels.map(channel => (
                                        <ChannelCard
                                            key={channel.id}
                                            channel={channel}
                                            onDelete={() => handleDeleteClick(channel)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm Delete Modal */}
                        <ConfirmModal
                            isOpen={channelToDelete !== null}
                            onClose={() => setChannelToDelete(null)}
                            onConfirm={handleDeleteConfirm}
                            title={t('delete.title')}
                            message={
                                channelToDelete ? (
                                    <div className="space-y-2">
                                        <p>{t('delete.aboutTo')}</p>
                                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                            <p className="font-semibold text-white">{channelToDelete.name}</p>
                                            <p className="text-xs text-gray-400">{channelToDelete.platform} • {channelToDelete.channelId}</p>
                                        </div>
                                        <p className="text-sm text-red-300">
                                            {t('delete.warning')}
                                        </p>
                                    </div>
                                ) : ''
                            }
                            confirmText={t('delete.confirmButton')}
                            cancelText={tCommon('cancel')}
                            variant="danger"
                            isLoading={isDeleting}
                        />
                    </div>
                </div>
            </main>
        </>
    );
}
