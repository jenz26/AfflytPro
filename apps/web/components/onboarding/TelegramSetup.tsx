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
import { API_BASE } from '@/lib/api/config';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('telegramSetup');
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
            setValidationError(t('errors.tokenTooShort'));
            return;
        }

        setBotValidation('validating');
        setValidationError('');

        try {
            const response = await fetch(`${API_BASE}/validate/telegram-token`, {
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
                // Parse error for better UX
                const errorMsg = data.error || '';
                if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    setValidationError(t('errors.tokenUnauthorized'));
                } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
                    setValidationError(t('errors.tokenNotFound'));
                } else if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
                    setValidationError(t('errors.tokenTimeout'));
                } else {
                    setValidationError(data.error || t('errors.invalidToken'));
                }
            }
        } catch (error) {
            setBotValidation('invalid');
            setValidationError(t('errors.connectionError'));
        }
    };

    const validateChannelConnection = async (token: string, channelId: string) => {
        if (!channelId) {
            setChannelValidation('invalid');
            setValidationError(t('errors.enterChannelId'));
            return;
        }

        setChannelValidation('validating');
        setValidationError('');

        try {
            const response = await fetch(`${API_BASE}/validate/telegram-channel`, {
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
                // Parse error for better UX
                const errorMsg = data.error || '';
                if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    setValidationError(t('errors.channelUnauthorized'));
                } else if (errorMsg.includes('400') || errorMsg.includes('Bad Request')) {
                    setValidationError(t('errors.channelBadRequest'));
                } else if (errorMsg.includes('not found') || errorMsg.includes('chat not found')) {
                    setValidationError(t('errors.channelNotFound'));
                } else if (errorMsg.includes('not enough rights') || errorMsg.includes('administrator')) {
                    setValidationError(t('errors.channelNoRights'));
                } else {
                    setValidationError(data.error || t('errors.cantPost'));
                }
            }
        } catch (error) {
            setChannelValidation('invalid');
            setValidationError(t('errors.connectionError'));
        }
    };

    const sendTestMessage = async () => {
        if (!botToken || !channelId) return;

        setTestMessageStatus('sending');

        try {
            const token = localStorage.getItem('token'); // Get auth token
            const response = await fetch(`${API_BASE}/validate/telegram-test`, {
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
                setValidationError(data.error || t('errors.messageFailed'));
            }
        } catch (error) {
            setTestMessageStatus('failed');
            setValidationError(t('errors.connectionError'));
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
                            {t('title')}
                        </h2>
                        <p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-cyan-400 mb-2">3 min</div>
                                <div className="text-sm text-gray-400">{t('stats.setupTime')}</div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-profit-400 mb-2">{t('stats.free')}</div>
                                <div className="text-sm text-gray-400">{t('stats.freeDesc')}</div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-plasma-400 mb-2">24/7</div>
                                <div className="text-sm text-gray-400">{t('stats.continuous')}</div>
                            </div>
                        </div>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-afflyt-cyan-400" />
                                {t('requirements.title')}
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-afflyt-cyan-400 text-sm font-bold">1</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{t('requirements.bot')}</p>
                                        <p className="text-sm text-gray-400">{t('requirements.botDesc')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-afflyt-cyan-400 text-sm font-bold">2</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{t('requirements.channel')}</p>
                                        <p className="text-sm text-gray-400">{t('requirements.channelDesc')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-afflyt-cyan-400 text-sm font-bold">3</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{t('requirements.admin')}</p>
                                        <p className="text-sm text-gray-400">{t('requirements.adminDesc')}</p>
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
                        <h2 className="text-2xl font-bold text-white mb-2">{t('createBot.title')}</h2>
                        <p className="text-gray-400 mb-6">{t('createBot.subtitle')}</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">{t('createBot.instructions')}</h3>
                            <ol className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-2">{t('createBot.step1')}</p>
                                        <a
                                            href="https://t.me/BotFather"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-afflyt-cyan-500/10 text-afflyt-cyan-400 rounded-lg text-sm hover:bg-afflyt-cyan-500/20 transition"
                                        >
                                            {t('createBot.openBotFather')}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-2">{t('createBot.step2')}</p>
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
                                        <p className="text-white font-medium mb-1">{t('createBot.step3')}</p>
                                        <p className="text-sm text-gray-400">{t('createBot.step3Hint')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">4</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">{t('createBot.step4')}</p>
                                        <p className="text-sm text-gray-400">{t('createBot.step4Hint')}</p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('createBot.botToken')}
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
                                        <p className="text-sm font-medium text-white">{t('createBot.botValidated')}</p>
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
                                    {t('createBot.clickToValidate')}
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
                        <h2 className="text-2xl font-bold text-white mb-2">{t('connectChannel.title')}</h2>
                        <p className="text-gray-400 mb-6">{t('connectChannel.subtitle')}</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">{t('connectChannel.steps')}</h3>
                            <ol className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">{t('connectChannel.step1')}</p>
                                        <p className="text-sm text-gray-400">
                                            {t('connectChannel.step1Hint', { bot: botInfo?.username || 'your_bot' })}
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">{t('connectChannel.step2')}</p>
                                        <p className="text-sm text-gray-400">{t('connectChannel.step2Hint')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-afflyt-cyan-400 font-bold">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">{t('connectChannel.step3')}</p>
                                        <p className="text-sm text-gray-400">
                                            {t('connectChannel.step3HintPublic')}
                                            <br />
                                            {t('connectChannel.step3HintPrivate')}
                                        </p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('connectChannel.channelName')}
                                    <span className="text-red-400 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    placeholder={t('connectChannel.channelNamePlaceholder')}
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border-2 border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-cyan-500 transition"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('connectChannel.channelNameHint')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('connectChannel.channelId')}
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
                                        placeholder={t('connectChannel.channelIdPlaceholder')}
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
                                        <p className="text-sm font-medium text-white">{t('connectChannel.channelConnected')}</p>
                                        <p className="text-xs text-gray-400">{t('connectChannel.botCanPost')}</p>
                                    </div>
                                </div>
                            )}

                            {channelValidation === 'invalid' && validationError && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-red-300 mb-1">{validationError}</p>
                                        <p className="text-xs text-gray-400">
                                            {t('connectChannel.ensureAdmin')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {channelValidation === 'idle' && channelId && (
                                <button
                                    onClick={() => validateChannelConnection(botToken, channelId)}
                                    className="mt-3 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition"
                                >
                                    {t('connectChannel.clickToValidate')}
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
                        <h2 className="text-2xl font-bold text-white mb-2">{t('testConfig.title')}</h2>
                        <p className="text-gray-400 mb-6">{t('testConfig.subtitle')}</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-afflyt-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{t('testConfig.testMessage')}</h3>
                                    <p className="text-sm text-gray-400">{t('testConfig.testMessageDesc')}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                    <span className="text-gray-300">{t('testConfig.bot')}: @{botInfo?.username}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                    <span className="text-gray-300">{t('testConfig.channel')}: {channelId}</span>
                                </div>
                            </div>

                            {testMessageStatus === 'idle' && (
                                <CyberButton
                                    variant="primary"
                                    onClick={sendTestMessage}
                                    className="w-full justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {t('testConfig.sendTestMessage')}
                                </CyberButton>
                            )}

                            {testMessageStatus === 'sending' && (
                                <div className="flex items-center justify-center gap-3 py-3">
                                    <Loader2 className="w-5 h-5 text-afflyt-cyan-400 animate-spin" />
                                    <span className="text-gray-300">{t('testConfig.sending')}</span>
                                </div>
                            )}

                            {testMessageStatus === 'sent' && (
                                <div className="p-4 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-afflyt-profit-400/20 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-afflyt-profit-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{t('testConfig.testCompleted')}</p>
                                            <p className="text-sm text-gray-300">{t('testConfig.checkChannel')}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        {t('testConfig.successHint')}
                                    </p>
                                </div>
                            )}

                            {testMessageStatus === 'failed' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                        <p className="font-semibold text-white">{t('testConfig.failed')}</p>
                                    </div>
                                    <p className="text-sm text-red-300 mb-3">{validationError}</p>
                                    <CyberButton
                                        variant="secondary"
                                        onClick={sendTestMessage}
                                        className="w-full justify-center gap-2"
                                        size="sm"
                                    >
                                        {t('testConfig.retry')}
                                    </CyberButton>
                                </div>
                            )}
                        </div>

                        {testMessageStatus === 'sent' && (
                            <div className="bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border p-4">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-afflyt-cyan-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-300">
                                        {t('testConfig.successMessage')}
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
                    <span className="text-sm text-gray-400">{t('navigation.step', { current: step + 1, total: 4 })}</span>
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
                            {t('navigation.back')}
                        </CyberButton>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {onSkip && step === 0 && (
                        <CyberButton
                            variant="ghost"
                            onClick={onSkip}
                        >
                            {t('navigation.skipForNow')}
                        </CyberButton>
                    )}

                    {step < 3 ? (
                        <CyberButton
                            variant="primary"
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceedStep()}
                            className="gap-2"
                        >
                            {step === 0 ? t('navigation.start') : t('navigation.continue')}
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
                            {t('navigation.complete')}
                        </CyberButton>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};
