'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Sparkles,
    CheckCircle,
    XCircle,
    AlertCircle,
    Copy,
    Gift,
    Crown,
    Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

interface BetaStatus {
    isBetaTester: boolean;
    plan: string;
    betaCode: string | null;
    redeemedAt: string | null;
}

export default function TesterPage() {
    const t = useTranslations('settings.tester');
    const tCommon = useTranslations('common');

    const [betaStatus, setBetaStatus] = useState<BetaStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchBetaStatus();
    }, []);

    const fetchBetaStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_BASE}/beta/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setBetaStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch beta status', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeemCode = async () => {
        if (!code.trim()) {
            setError(t('errors.emptyCode'));
            return;
        }

        // Format validation
        const formattedCode = code.toUpperCase().trim();
        if (!/^AFFLYT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(formattedCode)) {
            setError(t('errors.invalidFormat'));
            return;
        }

        setIsRedeeming(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/beta/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: formattedCode })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(t('success.redeemed'));
                setCode('');
                fetchBetaStatus();
            } else {
                // Map error codes to user-friendly messages
                switch (data.error) {
                    case 'already_beta_tester':
                        setError(t('errors.alreadyBeta'));
                        break;
                    case 'invalid_code':
                        setError(t('errors.invalidCode'));
                        break;
                    case 'code_inactive':
                        setError(t('errors.codeInactive'));
                        break;
                    case 'code_expired':
                        setError(t('errors.codeExpired'));
                        break;
                    case 'code_used':
                        setError(t('errors.codeUsed'));
                        break;
                    case 'code_wrong_email':
                        setError(t('errors.wrongEmail'));
                        break;
                    default:
                        setError(data.message || t('errors.generic'));
                }
            }
        } catch (err) {
            console.error(err);
            setError(t('errors.connection'));
        } finally {
            setIsRedeeming(false);
        }
    };

    const formatCodeInput = (value: string) => {
        // Remove non-alphanumeric characters except dashes
        let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

        // Auto-format: AFFLYT-XXXX-XXXX
        if (cleaned.startsWith('AFFLYT')) {
            // Already has prefix, just handle dashes
            const parts = cleaned.split('-').filter(Boolean);
            if (parts.length === 1 && parts[0].length > 6) {
                // AFFLYTXXXX -> AFFLYT-XXXX
                cleaned = parts[0].slice(0, 6) + '-' + parts[0].slice(6);
            }
            if (parts.length === 2 && parts[1].length > 4) {
                // AFFLYT-XXXXXXXX -> AFFLYT-XXXX-XXXX
                cleaned = parts[0] + '-' + parts[1].slice(0, 4) + '-' + parts[1].slice(4, 8);
            }
        }

        return cleaned.slice(0, 16); // Max length: AFFLYT-XXXX-XXXX
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-afflyt-cyan-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Beta Status Card */}
            <GlassCard className={`p-6 ${betaStatus?.isBetaTester ? 'border-afflyt-profit-400/40 bg-afflyt-profit-400/5' : 'border-afflyt-cyan-500/40'}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            betaStatus?.isBetaTester
                                ? 'bg-afflyt-profit-400/20'
                                : 'bg-afflyt-cyan-500/20'
                        }`}>
                            {betaStatus?.isBetaTester ? (
                                <Crown className="w-7 h-7 text-afflyt-profit-400" />
                            ) : (
                                <Sparkles className="w-7 h-7 text-afflyt-cyan-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">
                                {betaStatus?.isBetaTester ? t('status.active') : t('status.inactive')}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {betaStatus?.isBetaTester ? t('status.activeDesc') : t('status.inactiveDesc')}
                            </p>
                            {betaStatus?.isBetaTester && betaStatus.redeemedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {t('status.since', { date: new Date(betaStatus.redeemedAt).toLocaleDateString() })}
                                </p>
                            )}
                        </div>
                    </div>
                    {betaStatus?.isBetaTester && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-afflyt-profit-400/20 rounded-full">
                            <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                            <span className="text-sm font-medium text-afflyt-profit-400">BETA TESTER</span>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Redeem Code Section - Only show if not already a beta tester */}
            {!betaStatus?.isBetaTester && (
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Gift className="w-5 h-5 text-afflyt-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">{t('redeem.title')}</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        {t('redeem.description')}
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('redeem.codeLabel')}
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(formatCodeInput(e.target.value))}
                                    placeholder="AFFLYT-XXXX-XXXX"
                                    className="flex-1 px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-center text-lg tracking-wider placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50"
                                    maxLength={16}
                                />
                                <CyberButton
                                    variant="primary"
                                    onClick={handleRedeemCode}
                                    disabled={isRedeeming || !code.trim()}
                                >
                                    {isRedeeming ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        t('redeem.button')
                                    )}
                                </CyberButton>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-sm text-red-300">{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-afflyt-profit-400 flex-shrink-0" />
                                <span className="text-sm text-afflyt-profit-300">{success}</span>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* Beta Benefits */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('benefits.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-afflyt-dark-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-afflyt-profit-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-white">{t('benefits.fullAccess')}</h4>
                            <p className="text-sm text-gray-400">{t('benefits.fullAccessDesc')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-afflyt-dark-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-afflyt-profit-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-white">{t('benefits.prioritySupport')}</h4>
                            <p className="text-sm text-gray-400">{t('benefits.prioritySupportDesc')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-afflyt-dark-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-afflyt-profit-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-white">{t('benefits.earlyFeatures')}</h4>
                            <p className="text-sm text-gray-400">{t('benefits.earlyFeaturesDesc')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-afflyt-dark-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-afflyt-profit-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-white">{t('benefits.feedback')}</h4>
                            <p className="text-sm text-gray-400">{t('benefits.feedbackDesc')}</p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Beta Code Display - Only show if beta tester */}
            {betaStatus?.isBetaTester && betaStatus.betaCode && (
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('yourCode.title')}</h3>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 px-4 py-3 bg-afflyt-dark-50 rounded-lg text-afflyt-cyan-400 font-mono text-lg text-center tracking-wider">
                            {betaStatus.betaCode}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(betaStatus.betaCode!);
                            }}
                            className="p-3 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                            title={tCommon('copy')}
                        >
                            <Copy className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('yourCode.note')}</p>
                </GlassCard>
            )}

            {/* Info Banner */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-300">{t('info.title')}</h4>
                        <p className="text-sm text-blue-200/70 mt-1">{t('info.description')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
