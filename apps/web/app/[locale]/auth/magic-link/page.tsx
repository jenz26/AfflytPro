'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Status = 'loading' | 'success' | 'error';

export default function MagicLinkPage() {
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Link magico non valido o mancante.');
            return;
        }

        const verifyMagicLink = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/magic-link/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Accesso effettuato con successo!');
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
                    setMessage(data.message || 'Link magico non valido o scaduto.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Errore di connessione al server.');
            }
        };

        verifyMagicLink();
    }, [searchParams, locale, router]);

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
                        <h2 className="text-2xl font-bold text-white mb-2">Magic Link</h2>
                        <p className="text-gray-400">Stiamo verificando il tuo accesso...</p>
                        <Loader2 className="w-6 h-6 text-afflyt-cyan-400 animate-spin mx-auto mt-4" />
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Benvenuto!</h2>
                        <p className="text-gray-400 mb-4">{message}</p>
                        <p className="text-sm text-afflyt-cyan-400">Reindirizzamento alla dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Link Non Valido</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <div className="space-y-3">
                            <CyberButton
                                onClick={() => router.push(`/${locale}/auth/login`)}
                                variant="primary"
                                className="w-full justify-center"
                            >
                                Richiedi Nuovo Link
                            </CyberButton>
                            <p className="text-xs text-gray-500">
                                I magic link scadono dopo 15 minuti per sicurezza.
                            </p>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    );
}
