'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
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
    Send
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { API_BASE } from '@/lib/api/config';
import { useTranslations } from 'next-intl';

interface EmailSetupProps {
    onComplete: (data: EmailSetupData) => void;
    onSkip?: () => void;
}

interface EmailSetupData {
    provider: 'sendgrid' | 'resend';
    apiKey: string;
    senderEmail: string;
    senderName: string;
    testEmailSent: boolean;
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export const EmailSetup = ({ onComplete, onSkip }: EmailSetupProps) => {
    const t = useTranslations('emailSetup');
    const [step, setStep] = useState(0);
    const [provider, setProvider] = useState<'sendgrid' | 'resend' | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [senderName, setSenderName] = useState('');
    const [testRecipient, setTestRecipient] = useState('');

    const [apiKeyValidation, setApiKeyValidation] = useState<ValidationStatus>('idle');
    const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
    const [validationError, setValidationError] = useState<string>('');

    const { trackOnboardingStep, track } = useAnalytics();

    const EMAIL_PROVIDERS = [
        {
            id: 'sendgrid' as const,
            name: 'SendGrid',
            logo: '📧',
            description: t('providers.sendgrid.description'),
            pricing: t('providers.sendgrid.pricing'),
            features: [t('providers.sendgrid.features.templates'), t('providers.sendgrid.features.analytics'), t('providers.sendgrid.features.deliverability')],
            signupUrl: 'https://signup.sendgrid.com/',
            docsUrl: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started'
        },
        {
            id: 'resend' as const,
            name: 'Resend',
            logo: '✉️',
            description: t('providers.resend.description'),
            pricing: t('providers.resend.pricing'),
            features: [t('providers.resend.features.quickSetup'), t('providers.resend.features.reactEmail'), t('providers.resend.features.modernDashboard')],
            signupUrl: 'https://resend.com/signup',
            docsUrl: 'https://resend.com/docs/introduction'
        }
    ];

    const validateApiKey = async (key: string, prov: 'sendgrid' | 'resend') => {
        if (!key || key.length < 10) {
            setApiKeyValidation('invalid');
            setValidationError(t('errors.apiKeyTooShort'));
            return;
        }

        setApiKeyValidation('validating');
        setValidationError('');

        try {
            const response = await fetch(`${API_BASE}/validate/email-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: key, provider: prov })
            });

            const data = await response.json();

            if (data.valid) {
                setApiKeyValidation('valid');
                track('email_api_key_validated', 'onboarding', { provider: prov });
            } else {
                setApiKeyValidation('invalid');
                // Parse error for better UX
                const errorMsg = data.error || '';
                if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                    setValidationError(t('errors.apiKeyUnauthorized'));
                } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
                    setValidationError(t('errors.apiKeyForbidden'));
                } else if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
                    setValidationError(t('errors.apiKeyInvalidFormat'));
                } else if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
                    setValidationError(t('errors.apiKeyTimeout'));
                } else {
                    setValidationError(data.error || t('errors.invalidApiKey'));
                }
            }
        } catch (error) {
            setApiKeyValidation('invalid');
            setValidationError(t('errors.connectionError'));
        }
    };

    const sendTestEmail = async () => {
        if (!apiKey || !senderEmail || !testRecipient || !provider) return;

        setTestEmailStatus('sending');

        try {
            // Mock test email send - in production this would call backend
            await new Promise(resolve => setTimeout(resolve, 2000));

            setTestEmailStatus('sent');
            track('email_test_sent', 'onboarding', {
                provider,
                senderEmail,
                recipientEmail: testRecipient
            });
        } catch (error) {
            setTestEmailStatus('failed');
            setValidationError(t('errors.emailSendFailed'));
        }
    };

    const handleComplete = () => {
        if (!provider || !apiKey || !senderEmail || !senderName) return;

        trackOnboardingStep('email_setup', 'completed', {
            provider,
            senderEmail
        });

        onComplete({
            provider,
            apiKey,
            senderEmail,
            senderName,
            testEmailSent: testEmailStatus === 'sent'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const canProceedStep = () => {
        switch (step) {
            case 0: return true; // Intro
            case 1: return provider !== null;
            case 2: return apiKeyValidation === 'valid' && senderEmail && senderName;
            case 3: return testEmailStatus === 'sent';
            default: return false;
        }
    };

    const selectedProvider = provider ? EMAIL_PROVIDERS.find(p => p.id === provider) : null;

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
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-xl flex items-center justify-center">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 text-center">
                            {t('title')}
                        </h2>
                        <p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-plasma-400 mb-2">5 min</div>
                                <div className="text-sm text-gray-400">{t('stats.quickSetup')}</div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-profit-400 mb-2">100/{t('stats.perDay')}</div>
                                <div className="text-sm text-gray-400">{t('stats.freeEmails')}</div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border text-center">
                                <div className="text-2xl font-bold text-afflyt-cyan-400 mb-2">98%</div>
                                <div className="text-sm text-gray-400">{t('stats.deliverability')}</div>
                            </div>
                        </div>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-afflyt-plasma-400" />
                                {t('whyEmail.title')}
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-afflyt-profit-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">{t('whyEmail.directReach')}</p>
                                        <p className="text-sm text-gray-400">{t('whyEmail.directReachDesc')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-afflyt-profit-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">{t('whyEmail.highConversion')}</p>
                                        <p className="text-sm text-gray-400">{t('whyEmail.highConversionDesc')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-afflyt-profit-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">{t('whyEmail.fullAutomation')}</p>
                                        <p className="text-sm text-gray-400">{t('whyEmail.fullAutomationDesc')}</p>
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
                        <h2 className="text-2xl font-bold text-white mb-2">{t('chooseProvider.title')}</h2>
                        <p className="text-gray-400 mb-6">{t('chooseProvider.subtitle')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {EMAIL_PROVIDERS.map((prov) => (
                                <button
                                    key={prov.id}
                                    onClick={() => setProvider(prov.id)}
                                    className={`p-6 rounded-xl border-2 transition-all text-left ${provider === prov.id
                                        ? 'border-afflyt-plasma-500 bg-afflyt-plasma-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-plasma-500/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-4xl">{prov.logo}</div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{prov.name}</h3>
                                                <p className="text-sm text-gray-400">{prov.description}</p>
                                            </div>
                                        </div>
                                        {provider === prov.id && (
                                            <div className="w-6 h-6 rounded-full bg-afflyt-plasma-500 flex items-center justify-center shrink-0">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="inline-block px-3 py-1 bg-afflyt-dark-100 rounded-full text-xs text-afflyt-profit-400 font-medium">
                                            {prov.pricing}
                                        </div>
                                    </div>

                                    <ul className="space-y-2 mb-4">
                                        {prov.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                                <Check className="w-3 h-3 text-afflyt-plasma-400" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {provider === prov.id && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-afflyt-glass-border">
                                            <a
                                                href={prov.signupUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-afflyt-plasma-500/10 text-afflyt-plasma-400 rounded-lg text-sm hover:bg-afflyt-plasma-500/20 transition"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {t('chooseProvider.signup')}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <a
                                                href={prov.docsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-afflyt-dark-100 text-gray-300 rounded-lg text-sm hover:bg-afflyt-dark-200 transition"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {t('chooseProvider.docs')}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                </button>
                            ))}
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
                        <h2 className="text-2xl font-bold text-white mb-2">{t('configure.title', { provider: selectedProvider?.name || '' })}</h2>
                        <p className="text-gray-400 mb-6">{t('configure.subtitle')}</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">{t('configure.howToGetKey')}</h3>
                            {provider === 'sendgrid' && (
                                <ol className="space-y-3 text-sm text-gray-300">
                                    <li>1. {t('configure.sendgrid.step1')} <a href="https://app.sendgrid.com/" target="_blank" className="text-afflyt-plasma-400 hover:underline">SendGrid Dashboard</a></li>
                                    <li>2. {t('configure.sendgrid.step2')}</li>
                                    <li>3. {t('configure.sendgrid.step3')}</li>
                                    <li>4. {t('configure.sendgrid.step4')}</li>
                                    <li>5. {t('configure.sendgrid.step5')}</li>
                                </ol>
                            )}
                            {provider === 'resend' && (
                                <ol className="space-y-3 text-sm text-gray-300">
                                    <li>1. {t('configure.resend.step1')} <a href="https://resend.com/api-keys" target="_blank" className="text-afflyt-plasma-400 hover:underline">Resend Dashboard</a></li>
                                    <li>2. {t('configure.resend.step2')}</li>
                                    <li>3. {t('configure.resend.step3')}</li>
                                    <li>4. {t('configure.resend.step4')}</li>
                                    <li>5. {t('configure.resend.step5')}</li>
                                </ol>
                            )}
                        </div>

                        <div className="space-y-5">
                            {/* API Key */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('configure.apiKeyLabel', { provider: selectedProvider?.name || '' })}
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => {
                                            setApiKey(e.target.value);
                                            setApiKeyValidation('idle');
                                        }}
                                        onBlur={() => apiKey && provider && validateApiKey(apiKey, provider)}
                                        placeholder={provider === 'sendgrid' ? 'SG.xxxxxxxxxxxxxxxxxxxxxxxx' : 're_xxxxxxxxxxxxxxxxxxxxxxxx'}
                                        className={`w-full px-4 py-3 bg-afflyt-dark-50 border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition ${apiKeyValidation === 'valid'
                                            ? 'border-afflyt-profit-400'
                                            : apiKeyValidation === 'invalid'
                                                ? 'border-red-500'
                                                : 'border-afflyt-glass-border focus:border-afflyt-plasma-500'
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {apiKeyValidation === 'validating' && (
                                            <Loader2 className="w-5 h-5 text-afflyt-plasma-400 animate-spin" />
                                        )}
                                        {apiKeyValidation === 'valid' && (
                                            <CheckCircle className="w-5 h-5 text-afflyt-profit-400" />
                                        )}
                                        {apiKeyValidation === 'invalid' && (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                {apiKeyValidation === 'valid' && (
                                    <p className="mt-2 text-sm text-afflyt-profit-400 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        {t('configure.apiKeyValidated')}
                                    </p>
                                )}
                                {apiKeyValidation === 'invalid' && validationError && (
                                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationError}
                                    </p>
                                )}
                            </div>

                            {/* Sender Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('configure.senderEmail')}
                                </label>
                                <input
                                    type="email"
                                    value={senderEmail}
                                    onChange={(e) => setSenderEmail(e.target.value)}
                                    placeholder={t('configure.senderEmailPlaceholder')}
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border-2 border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-plasma-500 transition"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    {t('configure.senderEmailHint', { provider: selectedProvider?.name || '' })}
                                </p>
                            </div>

                            {/* Sender Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('configure.senderName')}
                                </label>
                                <input
                                    type="text"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    placeholder={t('configure.senderNamePlaceholder')}
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border-2 border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-plasma-500 transition"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    {t('configure.senderNameHint')}
                                </p>
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
                        <h2 className="text-2xl font-bold text-white mb-2">{t('testEmail.title')}</h2>
                        <p className="text-gray-400 mb-6">{t('testEmail.subtitle')}</p>

                        <div className="bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-afflyt-plasma-500/20 flex items-center justify-center">
                                    <Send className="w-6 h-6 text-afflyt-plasma-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{t('testEmail.testEmailTitle')}</h3>
                                    <p className="text-sm text-gray-400">{t('testEmail.testEmailDesc')}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                    <span className="text-gray-300">{t('testEmail.provider')}: {selectedProvider?.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                    <span className="text-gray-300">{t('testEmail.from')}: {senderName} &lt;{senderEmail}&gt;</span>
                                </div>
                            </div>

                            {testEmailStatus === 'idle' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('testEmail.sendTo')}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={testRecipient}
                                            onChange={(e) => setTestRecipient(e.target.value)}
                                            placeholder={t('testEmail.emailPlaceholder')}
                                            className="flex-1 px-4 py-3 bg-afflyt-dark-100 border-2 border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-plasma-500 transition"
                                        />
                                        <CyberButton
                                            variant="primary"
                                            onClick={sendTestEmail}
                                            disabled={!testRecipient}
                                            className="gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            {t('testEmail.send')}
                                        </CyberButton>
                                    </div>
                                </div>
                            )}

                            {testEmailStatus === 'sending' && (
                                <div className="flex items-center justify-center gap-3 py-3">
                                    <Loader2 className="w-5 h-5 text-afflyt-plasma-400 animate-spin" />
                                    <span className="text-gray-300">{t('testEmail.sending')}</span>
                                </div>
                            )}

                            {testEmailStatus === 'sent' && (
                                <div className="p-4 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-afflyt-profit-400/20 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-afflyt-profit-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{t('testEmail.sent')}</p>
                                            <p className="text-sm text-gray-300">{t('testEmail.checkInbox')}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        {t('testEmail.sentTo')}: {testRecipient}
                                    </p>
                                </div>
                            )}

                            {testEmailStatus === 'failed' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                        <p className="font-semibold text-white">{t('testEmail.failed')}</p>
                                    </div>
                                    <p className="text-sm text-red-300 mb-3">{validationError}</p>
                                    <CyberButton
                                        variant="secondary"
                                        onClick={sendTestEmail}
                                        className="w-full justify-center gap-2"
                                        size="sm"
                                    >
                                        {t('testEmail.retry')}
                                    </CyberButton>
                                </div>
                            )}
                        </div>

                        {testEmailStatus === 'sent' && (
                            <div className="bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border p-4">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-afflyt-plasma-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-300">
                                        {t('testEmail.successMessage')}
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
                    <span className="text-sm font-mono text-afflyt-plasma-400">
                        {Math.round(((step + 1) / 4) * 100)}%
                    </span>
                </div>
                <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-afflyt-plasma-500 to-afflyt-plasma-400"
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
                            disabled={testEmailStatus !== 'sent'}
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
