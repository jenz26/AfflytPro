'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

type Status = 'loading' | 'success' | 'error';

export default function MagicLinkPage() {
    const t = useTranslations('auth.magicLink');
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage(t('invalidOrMissing'));
            return;
        }

        const verifyMagicLink = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/magic-link/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(t('loginSuccess'));
                    // Store token
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                    // Redirect after short delay
                    setTimeout(() => {
                        router.push(`/${locale}/dashboard`);
                    }, 1500);
                } else {
                    setStatus('error');
                    setMessage(data.message || t('invalidOrExpired'));
                }
            } catch (error) {
                setStatus('error');
                setMessage(t('connectionError'));
            }
        };

        verifyMagicLink();
    }, [searchParams, locale, router, t]);

    return (
        <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-20 w-96 h-96 bg-afflyt-plasma-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-afflyt-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <GlassCard className="relative z-10 p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 bg-afflyt-plasma-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-afflyt-plasma-400 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('title')}</h2>
                        <p className="text-gray-400">{t('verifying')}</p>
                        <Loader2 className="w-6 h-6 text-afflyt-cyan-400 animate-spin mx-auto mt-4" />
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('welcomeTitle')}</h2>
                        <p className="text-gray-400 mb-4">{message}</p>
                        <p className="text-sm text-afflyt-cyan-400">{t('redirecting')}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('invalidLinkTitle')}</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <div className="space-y-3">
                            <CyberButton
                                onClick={() => router.push(`/${locale}/auth/login`)}
                                variant="primary"
                                className="w-full justify-center"
                            >
                                {t('requestNewLink')}
                            </CyberButton>
                            <p className="text-xs text-gray-500">
                                {t('expiryNote')}
                            </p>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    );
}
