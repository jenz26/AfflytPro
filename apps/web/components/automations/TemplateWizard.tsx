'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Send, CheckCircle, Sparkles, Play, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { AutomationTemplate } from './TemplateCard';
import { API_BASE } from '@/lib/api/config';

interface Channel {
    id: string;
    name: string;
    platform: string;
    status: string;
}

interface TemplateWizardProps {
    template: AutomationTemplate;
    onComplete: (ruleData: any) => void;
    onCancel: () => void;
}

export const TemplateWizard = ({ template, onComplete, onCancel }: TemplateWizardProps) => {
    const [step, setStep] = useState(1);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [customName, setCustomName] = useState(template.name);
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState<{ count: number; samples: any[] } | null>(null);

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/user/channels`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    const connectedChannels = (data.channels || []).filter((ch: Channel) => ch.status === 'CONNECTED');
                    setChannels(connectedChannels);
                    if (connectedChannels.length === 1) {
                        setSelectedChannelId(connectedChannels[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch channels:', error);
            } finally {
                setLoadingChannels(false);
            }
        };

        fetchChannels();
    }, []);

    const handleTest = async () => {
        setIsTesting(true);
        // Simula test - in produzione chiamerebbe un endpoint reale
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTestResults({
            count: Math.floor(Math.random() * 15) + 8,
            samples: [
                { name: 'Sony WH-1000XM5', price: 89.99, discount: 45, score: 87 },
                { name: 'Logitech MX Master 3S', price: 69.99, discount: 38, score: 82 },
                { name: 'Samsung Galaxy Buds2 Pro', price: 79.99, discount: 50, score: 85 },
            ]
        });
        setIsTesting(false);
        setStep(3);
    };

    const handleCreate = (activate: boolean) => {
        onComplete({
            name: customName,
            description: template.description,
            categories: template.categories,
            minScore: template.minScore,
            maxPrice: template.maxPrice,
            channelId: selectedChannelId || undefined,
            isActive: activate
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

            <div className="relative w-full max-w-lg bg-afflyt-dark-50 border border-afflyt-glass-border rounded-xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-afflyt-dark-100">
                    <div
                        className="h-full bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600 transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="p-5 border-b border-afflyt-glass-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-afflyt-dark-100" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Setup Rapido</h2>
                                <p className="text-xs text-gray-400">Solo 2 passaggi • {template.name}</p>
                            </div>
                        </div>
                        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5" style={{ minHeight: '320px' }}>
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome Automazione
                                </label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full px-4 py-3 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Pubblica su Canale
                                </label>

                                {loadingChannels ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-afflyt-cyan-500 border-t-transparent rounded-full" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {channels.map((channel) => (
                                            <button
                                                key={channel.id}
                                                onClick={() => setSelectedChannelId(channel.id)}
                                                className={`w-full p-3 rounded-lg border transition-all text-left ${selectedChannelId === channel.id
                                                    ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                                                    : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Send className={`w-4 h-4 ${selectedChannelId === channel.id ? 'text-afflyt-cyan-400' : 'text-gray-400'}`} />
                                                        <span className="text-sm text-white">{channel.name}</span>
                                                    </div>
                                                    {selectedChannelId === channel.id && (
                                                        <CheckCircle className="w-4 h-4 text-afflyt-cyan-400" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}

                                        {channels.length === 0 && (
                                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                <p className="text-sm text-yellow-300">
                                                    Nessun canale connesso. Puoi comunque creare l'automazione e collegarla dopo.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Config Summary */}
                            <GlassCard className="p-3 space-y-2">
                                <p className="text-xs text-gray-500 uppercase font-medium">Configurazione Template</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Categorie:</span>
                                        <span className="text-white">{template.categories.join(', ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Min Score:</span>
                                        <span className="text-afflyt-cyan-400 font-mono">{template.minScore}</span>
                                    </div>
                                    {template.maxPrice && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Max Prezzo:</span>
                                            <span className="text-white">€{template.maxPrice}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Stima:</span>
                                        <span className="text-afflyt-profit-400">{template.expectedDeals}</span>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <div className="w-16 h-16 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mb-6" />
                            <h3 className="text-lg font-semibold text-white mb-2">Testando configurazione...</h3>
                            <p className="text-sm text-gray-400 text-center">
                                Stiamo cercando deal che corrispondono ai tuoi criteri
                            </p>
                        </div>
                    )}

                    {step === 3 && testResults && (
                        <div className="space-y-5">
                            <div className="text-center">
                                <div className="w-14 h-14 bg-afflyt-profit-400/20 border border-afflyt-profit-400/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="w-7 h-7 text-afflyt-profit-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Trovati {testResults.count} deal!</h3>
                                <p className="text-sm text-gray-400">Ecco alcuni esempi che verranno pubblicati</p>
                            </div>

                            <div className="space-y-2">
                                {testResults.samples.map((deal, i) => (
                                    <div key={i} className="p-3 bg-afflyt-dark-100 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white font-medium">{deal.name}</p>
                                            <p className="text-xs text-gray-400">-{deal.discount}% • Score: {deal.score}</p>
                                        </div>
                                        <span className="text-afflyt-profit-400 font-mono font-bold">€{deal.price}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg">
                                <p className="text-sm text-afflyt-cyan-300">
                                    💡 L'automazione girerà ogni 6 ore e pubblicherà automaticamente i deal trovati.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-afflyt-glass-border">
                    {step === 1 && (
                        <div className="flex gap-3">
                            <CyberButton variant="ghost" onClick={onCancel} className="flex-1">
                                Annulla
                            </CyberButton>
                            <CyberButton
                                variant="primary"
                                onClick={() => { setStep(2); handleTest(); }}
                                disabled={!customName.trim()}
                                className="flex-1"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Testa Configurazione
                            </CyberButton>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-2">
                            <CyberButton
                                variant="primary"
                                onClick={() => handleCreate(true)}
                                className="w-full justify-center"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Crea e Attiva Subito
                            </CyberButton>
                            <CyberButton
                                variant="secondary"
                                onClick={() => handleCreate(false)}
                                className="w-full justify-center"
                            >
                                Crea (Non Attiva)
                            </CyberButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
