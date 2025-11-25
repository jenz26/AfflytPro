'use client';

import { useState, useEffect } from 'react';
import {
    Send,
    Plus,
    Bot,
    MessageSquare,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Settings,
    Trash2,
    ExternalLink,
    Copy,
    ChevronRight,
    Info,
    Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { API_BASE } from '@/lib/api/config';

interface Channel {
    id: string;
    name: string;
    platform: 'TELEGRAM' | 'DISCORD';
    status: 'CONNECTED' | 'PENDING' | 'ERROR';
    channelId: string;
    credential?: {
        id: string;
        label: string;
    };
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isAddingChannel, setIsAddingChannel] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
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
            if (!token) return;
            const res = await fetch('${API_BASE}/user/channels', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChannels(data.channels || []);
            }
        } catch (error) {
            console.error('Failed to fetch channels', error);
        }
    };

    const handleStep1_SaveToken = async () => {
        if (!newChannel.botToken) return alert('Inserisci il token');
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Call TSK-066 API to save credential
            const res = await fetch('${API_BASE}/user/credentials', {
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
                setSetupStep(2);
            } else {
                alert('Errore nel salvataggio del token');
            }
        } catch (error) {
            console.error(error);
            alert('Errore di connessione');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep3_CreateChannel = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('${API_BASE}/user/channels', {
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
                setIsAddingChannel(false);
                setSetupStep(1);
                setNewChannel({ platform: 'TELEGRAM', name: '', channelId: '', botToken: '', credentialId: '' });
                fetchChannels();
            } else {
                alert('Errore nella creazione del canale');
            }
        } catch (error) {
            console.error(error);
            alert('Errore di connessione');
        } finally {
            setIsLoading(false);
        }
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

    return (
        <div className="min-h-screen bg-afflyt-dark-100 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Send className="w-6 h-6 text-afflyt-cyan-400" />
                                Canali di Pubblicazione
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                Gestisci i canali Telegram e Discord dove pubblicare le offerte
                            </p>
                        </div>
                    </div>

                    <CyberButton onClick={() => setIsAddingChannel(true)} variant="primary">
                        <Plus className="w-4 h-4" />
                        Aggiungi Canale
                    </CyberButton>
                </div>
            </div>

            {/* Wizard */}
            {isAddingChannel && (
                <GlassCard className="mb-8 p-6 border-afflyt-cyan-500/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Nuova Connessione Telegram</h3>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map(step => (
                                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${setupStep === step
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
                                <h4 className="text-sm font-medium text-white mb-3">Istruzioni:</h4>
                                <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
                                    <li>Cerca @BotFather su Telegram</li>
                                    <li>Invia /newbot</li>
                                    <li>Copia il token ricevuto</li>
                                </ol>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Bot Token</label>
                                <input
                                    type="password"
                                    value={newChannel.botToken}
                                    onChange={(e) => setNewChannel({ ...newChannel, botToken: e.target.value })}
                                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm focus:border-afflyt-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <CyberButton variant="ghost" onClick={() => setIsAddingChannel(false)}>Annulla</CyberButton>
                                <CyberButton variant="primary" onClick={handleStep1_SaveToken} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salva e Continua'}
                                </CyberButton>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Channel Details */}
                    {setupStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nome Canale</label>
                                <input
                                    type="text"
                                    value={newChannel.name}
                                    onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                    placeholder="es. Offerte Tech"
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Channel ID / Username</label>
                                <input
                                    type="text"
                                    value={newChannel.channelId}
                                    onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                                    placeholder="@offertetech o -100..."
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm focus:border-afflyt-cyan-500 focus:outline-none"
                                />
                                <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Ricorda di aggiungere il bot come amministratore del canale!
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <CyberButton variant="ghost" onClick={() => setSetupStep(1)}>Indietro</CyberButton>
                                <CyberButton variant="primary" onClick={() => setSetupStep(3)}>Continua</CyberButton>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Verify */}
                    {setupStep === 3 && (
                        <div className="space-y-6 text-center">
                            <div className="p-6 bg-afflyt-cyan-500/10 rounded-lg border border-afflyt-cyan-500/30">
                                <h4 className="text-lg font-medium text-white mb-2">Pronto per la connessione</h4>
                                <p className="text-gray-400 text-sm mb-4">
                                    Stiamo per collegare il bot <strong>{newChannel.name}</strong> al canale <strong>{newChannel.channelId}</strong>.
                                </p>
                                <div className="flex flex-col gap-2 text-left max-w-xs mx-auto text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Piattaforma:</span>
                                        <span className="text-white">Telegram</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Credenziale:</span>
                                        <span className="text-afflyt-cyan-400">Salvata nel Vault</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <CyberButton variant="ghost" onClick={() => setSetupStep(2)}>Indietro</CyberButton>
                                <CyberButton variant="primary" onClick={handleStep3_CreateChannel} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conferma e Collega'}
                                </CyberButton>
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Channel List */}
            <div className="grid gap-4">
                {channels.map(channel => (
                    <GlassCard key={channel.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${channel.platform === 'TELEGRAM' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                }`}>
                                {channel.platform === 'TELEGRAM' ? <Send className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{channel.name}</h3>
                                <p className="text-sm text-gray-400 font-mono">{channel.channelId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${channel.status === 'CONNECTED'
                                ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400'
                                : 'bg-yellow-400/20 text-yellow-400'
                                }`}>
                                {channel.status}
                            </span>
                            <button
                                onClick={() => handleDeleteClick(channel)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {!isAddingChannel && channels.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Nessun canale configurato. Aggiungine uno per iniziare a pubblicare.
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={channelToDelete !== null}
                onClose={() => setChannelToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Eliminare il canale?"
                message={
                    channelToDelete ? (
                        <div className="space-y-2">
                            <p>Stai per eliminare:</p>
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <p className="font-semibold text-white">{channelToDelete.name}</p>
                                <p className="text-xs text-gray-400">{channelToDelete.platform} • {channelToDelete.channelId}</p>
                            </div>
                            <p className="text-sm text-red-300">
                                Questa azione non può essere annullata. Tutte le automazioni associate a questo canale verranno disattivate.
                            </p>
                        </div>
                    ) : ''
                }
                confirmText="Sì, elimina"
                cancelText="Annulla"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
