'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Check,
    ChevronRight,
    ChevronLeft,
    Copy,
    ExternalLink,
    AlertCircle,
    Loader2,
    CheckCircle,
    XCircle,
    Info,
    Sparkles,
    MessageCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useAnalytics } from '@/hooks/useAnalytics';

interface TelegramSetupProps {
    onComplete: (data: TelegramSetupData) => void;
    onSkip?: () => void;
}

interface TelegramSetupData {
    botToken: string;
    botInfo: {
        id: number;
        username: string;
        firstName: string;
    };
    channelId: string;
    channelName: string; // Friendly name for the channel
    channelUsername?: string;
    testMessageSent: boolean;
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export const TelegramSetup = ({ onComplete, onSkip }: TelegramSetupProps) => {
    const [step, setStep] = useState(0);
    const [botToken, setBotToken] = useState('');
    const [channelId, setChannelId] = useState('');
    const [channelName, setChannelName] = useState(''); // Friendly name
    const [botValidation, setBotValidation] = useState<ValidationStatus>('idle');
    const [channelValidation, setChannelValidation] = useState<ValidationStatus>('idle');
    const [testMessageStatus, setTestMessageStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

    const [botInfo, setBotInfo] = useState<{ id: number; username: string; firstName: string } | null>(null);
    const [channelInfo, setChannelInfo] = useState<{ canPost: boolean } | null>(null);
    const [validationError, setValidationError] = useState<string>('');

    const { trackOnboardingStep, track } = useAnalytics();

    const validateBotToken = async (token: string) => {
        if (!token || token.length < 30) {
            setBotValidation('invalid');
            setValidationError('Il token deve essere di almeno 30 caratteri');
            return;
        }

        setBotValidation('validating');
        setValidationError('');

        try {
            const response = await fetch('http://localhost:3001/validate/telegram-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (data.valid && data.botInfo) {
                setBotValidation('valid');
                setBotInfo(data.botInfo);
                track('telegram_token_validated', 'onboarding', { botUsername: data.botInfo.username });
            } else {
                setBotValidation('invalid');
                setValidationError(data.error || 'Token non valido');
            }
        } catch (error) {
            setBotValidation('invalid');
            setValidationError('Errore di connessione al server');
        }
    };

    const validateChannelConnection = async (token: string, channelId: string) => {
        if (!channelId) {
            setChannelValidation('invalid');
            setValidationError('Inserisci un Channel ID o username');
            return;
        }

        setChannelValidation('validating');
        setValidationError('');

        try {
            const response = await fetch('http://localhost:3001/validate/telegram-channel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, channelId })
            });

            const data = await response.json();

            if (data.valid && data.canPost) {
                setChannelValidation('valid');
                setChannelInfo({ canPost: data.canPost });
                track('telegram_channel_validated', 'onboarding', { channelId });
            } else {
                setChannelValidation('invalid');
                setValidationError(data.error || 'Il bot non può postare in questo canale');
            }
        } catch (error) {
            setChannelValidation('invalid');
            setValidationError('Errore di connessione al server');
        }
    };

    const sendTestMessage = async () => {
        if (!botToken || !channelId) return;

        setTestMessageStatus('sending');

        try {
            const token = localStorage.getItem('token'); // Get auth token
            const response = await fetch('http://localhost:3001/validate/telegram-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ token: botToken, channelId })
            });

            const data = await response.json();

            if (data.success) {
                setTestMessageStatus('sent');
                track('telegram_test_message_sent', 'onboarding', { channelId });
            } else {
                setTestMessageStatus('failed');
                setValidationError(data.error || 'Invio messaggio fallito');
            }
        } catch (error) {
            setTestMessageStatus('failed');
            setValidationError('Errore di connessione al server');
        }
    };

    const handleComplete = () => {
        if (!botInfo || !botToken || !channelId || !channelName) return;

        trackOnboardingStep('telegram_setup', 'completed', {
            botUsername: botInfo.username,
            channelId,
            channelName
        });

        onComplete({
            botToken,
            botInfo,
            channelId,
            channelName,
            testMessageSent: testMessageStatus === 'sent'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const canProceedStep = () => {
        switch (step) {
            case 0: return true; // Intro
            case 1: return botValidation === 'valid';
            case 2: return channelValidation === 'valid' && channelName.trim().length > 0;
            case 3: return testMessageStatus === 'sent';
            default: return false;
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="py-6"
                    >
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-xl flex items-center justify-center">
                            <Send className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 text-center">
                            Configurazione Telegram
                        </h2>
                        <p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
                            Collega il tuo canale o gruppo Telegram per pubblicare deal automaticamente
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-cyan-400 mb-2">3 min</div>
                                <div className="text-sm text-gray-400">Tempo configurazione</div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-profit-400 mb-2">Gratis</div>
                                <div className="text-sm text-gray-400">100% gratuito</div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-plasma-400 mb-2">24/7</div>
                                <div className="text-sm text-gray-400">Pubblicazione continua</div>
                            </div>
                        </div>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-afflyt-cyan-400" />
                                Cosa serve:
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-afflyt-cyan-400 text-sm font-bold">1</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Un bot Telegram</p>
                                        <p className="text-sm text-gray-400">Lo creeremo insieme tramite @BotFather</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-afflyt-cyan-400 text-sm font-bold">2</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Un canale o gruppo Telegram</p>
                                        <p className="text-sm text-gray-400">Dove vuoi pubblicare i deal (anche privato)</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-afflyt-cyan-400 text-sm font-bold">3</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Diritti di amministratore</p>
                                        <p className="text-sm text-gray-400">Per permettere al bot di pubblicare messaggi</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                );

            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Crea il Bot Telegram</h2>
                        <p className="text-gray-400 mb-6">Segui questi passaggi per ottenere il token del bot</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Istruzioni:</h3>
                            <ol className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-2">Apri Telegram e cerca @BotFather</p>
                                        <a
                                            href="https://t.me/BotFather"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-afflyt-cyan-500/10 text-afflyt-cyan-400 rounded-lg text-sm hover:bg-afflyt-cyan-500/20 transition"
                                        >
                                            Apri @BotFather
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-2">Invia il comando /newbot</p>
                                        <button
                                            onClick={() => copyToClipboard('/newbot')}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-afflyt-dark-100 text-gray-300 rounded-lg text-sm hover:bg-afflyt-dark-200 transition"
                                        >
                                            <code>/newbot</code>
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">Scegli un nome e uno username per il bot</p>
                                        <p className="text-sm text-gray-400">Lo username deve finire con "bot" (es: MioAffiliateBot)</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">4</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">Copia il token API che ricevi</p>
                                        <p className="text-sm text-gray-400">Sarà simile a: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz</p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Bot Token
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={botToken}
                                    onChange={(e) => {
                                        setBotToken(e.target.value);
                                        setBotValidation('idle');
                                    }}
                                    onBlur={() => botToken && validateBotToken(botToken)}
                                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                    className={`w-full px-4 py-3 bg-afflyt-dark-50 border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition ${
                                        botValidation === 'valid'
                                            ? 'border-afflyt-profit-400 focus:border-afflyt-profit-400'
                                            : botValidation === 'invalid'
                                            ? 'border-red-500 focus:border-red-500'
                                            : 'border-afflyt-glass-border focus:border-afflyt-cyan-500'
                                    }`}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {botValidation === 'validating' && (
                                        <Loader2 className="w-5 h-5 text-afflyt-cyan-400 animate-spin" />
                                    )}
                                    {botValidation === 'valid' && (
                                        <CheckCircle className="w-5 h-5 text-afflyt-profit-400" />
                                    )}
                                    {botValidation === 'invalid' && (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </div>

                            {botValidation === 'valid' && botInfo && (
                                <div className="mt-3 p-3 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-afflyt-profit-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-white">Bot validato con successo!</p>
                                        <p className="text-xs text-gray-400">@{botInfo.username} - {botInfo.firstName}</p>
                                    </div>
                                </div>
                            )}

                            {botValidation === 'invalid' && validationError && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-300">{validationError}</p>
                                </div>
                            )}

                            {botValidation === 'idle' && botToken && (
                                <button
                                    onClick={() => validateBotToken(botToken)}
                                    className="mt-3 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition"
                                >
                                    Clicca per validare
                                </button>
                            )}
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Collega il Canale/Gruppo</h2>
                        <p className="text-gray-400 mb-6">Configura dove il bot pubblicherà i deal</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Passaggi:</h3>
                            <ol className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">Aggiungi il bot al tuo canale/gruppo</p>
                                        <p className="text-sm text-gray-400">
                                            Vai nelle impostazioni del canale → Amministratori → Aggiungi amministratore → Cerca @{botInfo?.username || 'tuo_bot'}
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">Assegna i permessi di pubblicazione</p>
                                        <p className="text-sm text-gray-400">Abilita "Pubblicare messaggi" nelle impostazioni amministratore</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">Ottieni il Channel ID</p>
                                        <p className="text-sm text-gray-400">
                                            Per canali pubblici: usa @username (es: @mio_canale_deal)
                                            <br />
                                            Per canali privati: usa il numeric ID (es: -1001234567890)
                                        </p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome del Canale
                                    <span className="text-red-400 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    placeholder="es. Canale Tech Deals"
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border-2 border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-cyan-500 transition"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Un nome descrittivo per riconoscere facilmente il canale
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Channel ID o Username
                                    <span className="text-red-400 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={channelId}
                                        onChange={(e) => {
                                            setChannelId(e.target.value);
                                            setChannelValidation('idle');
                                        }}
                                        onBlur={() => channelId && validateChannelConnection(botToken, channelId)}
                                        placeholder="@mio_canale o -1001234567890"
                                        className={`w-full px-4 py-3 bg-afflyt-dark-50 border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition ${
                                            channelValidation === 'valid'
                                                ? 'border-afflyt-profit-400 focus:border-afflyt-profit-400'
                                                : channelValidation === 'invalid'
                                                ? 'border-red-500 focus:border-red-500'
                                                : 'border-afflyt-glass-border focus:border-afflyt-cyan-500'
                                        }`}
                                    />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {channelValidation === 'validating' && (
                                        <Loader2 className="w-5 h-5 text-afflyt-cyan-400 animate-spin" />
                                    )}
                                    {channelValidation === 'valid' && (
                                        <CheckCircle className="w-5 h-5 text-afflyt-profit-400" />
                                    )}
                                    {channelValidation === 'invalid' && (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </div>

                            {channelValidation === 'valid' && (
                                <div className="mt-3 p-3 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-afflyt-profit-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-white">Canale connesso con successo!</p>
                                        <p className="text-xs text-gray-400">Il bot può pubblicare messaggi</p>
                                    </div>
                                </div>
                            )}

                            {channelValidation === 'invalid' && validationError && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-red-300 mb-1">{validationError}</p>
                                        <p className="text-xs text-gray-400">
                                            Assicurati che il bot sia amministratore con permessi di pubblicazione
                                        </p>
                                    </div>
                                </div>
                            )}

                            {channelValidation === 'idle' && channelId && (
                                <button
                                    onClick={() => validateChannelConnection(botToken, channelId)}
                                    className="mt-3 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition"
                                >
                                    Clicca per validare connessione
                                </button>
                            )}
                        </div>
                    </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Test della Configurazione</h2>
                        <p className="text-gray-400 mb-6">Verifichiamo che tutto funzioni correttamente</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-afflyt-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Messaggio di Test</h3>
                                    <p className="text-sm text-gray-400">Invieremo un messaggio di prova al tuo canale</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                    <span className="text-gray-300">Bot: @{botInfo?.username}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                    <span className="text-gray-300">Canale: {channelId}</span>
                                </div>
                            </div>

                            {testMessageStatus === 'idle' && (
                                <CyberButton
                                    variant="primary"
                                    onClick={sendTestMessage}
                                    className="w-full justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Invia Messaggio di Test
                                </CyberButton>
                            )}

                            {testMessageStatus === 'sending' && (
                                <div className="flex items-center justify-center gap-3 py-3">
                                    <Loader2 className="w-5 h-5 text-afflyt-cyan-400 animate-spin" />
                                    <span className="text-gray-300">Invio in corso...</span>
                                </div>
                            )}

                            {testMessageStatus === 'sent' && (
                                <div className="p-4 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-afflyt-profit-400/20 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-afflyt-profit-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">Test completato!</p>
                                            <p className="text-sm text-gray-300">Controlla il tuo canale Telegram</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        Se hai ricevuto il messaggio, la configurazione è corretta. Puoi procedere!
                                    </p>
                                </div>
                            )}

                            {testMessageStatus === 'failed' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                        <p className="font-semibold text-white">Invio fallito</p>
                                    </div>
                                    <p className="text-sm text-red-300 mb-3">{validationError}</p>
                                    <CyberButton
                                        variant="secondary"
                                        onClick={sendTestMessage}
                                        className="w-full justify-center gap-2"
                                        size="sm"
                                    >
                                        Riprova
                                    </CyberButton>
                                </div>
                            )}
                        </div>

                        {testMessageStatus === 'sent' && (
                            <div className="bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border p-4">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-afflyt-cyan-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-300">
                                        D'ora in poi, Afflyt pubblicherà automaticamente i deal migliori nel tuo canale Telegram secondo le regole che configurerai.
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <GlassCard className="max-w-3xl mx-auto p-8">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Passo {step + 1} di 4</span>
                    <span className="text-sm font-mono text-afflyt-cyan-400">
                        {Math.round(((step + 1) / 4) * 100)}%
                    </span>
                </div>
                <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((step + 1) / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <div key={step}>
                    {renderStep()}
                </div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-afflyt-glass-border">
                <div>
                    {step > 0 && (
                        <CyberButton
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            className="gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Indietro
                        </CyberButton>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {onSkip && step === 0 && (
                        <CyberButton
                            variant="ghost"
                            onClick={onSkip}
                        >
                            Salta per ora
                        </CyberButton>
                    )}

                    {step < 3 ? (
                        <CyberButton
                            variant="primary"
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceedStep()}
                            className="gap-2"
                        >
                            {step === 0 ? 'Inizia' : 'Continua'}
                            <ChevronRight className="w-4 h-4" />
                        </CyberButton>
                    ) : (
                        <CyberButton
                            variant="primary"
                            onClick={handleComplete}
                            disabled={testMessageStatus !== 'sent'}
                            className="gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Completa Configurazione
                        </CyberButton>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};
