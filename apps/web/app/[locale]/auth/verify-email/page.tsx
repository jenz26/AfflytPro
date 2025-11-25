'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Token di verifica mancante.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message);
                    // Store token for auto-login
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verifica fallita.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Errore di connessione al server.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    const handleContinue = () => {
        if (status === 'success') {
            router.push(`/${locale}/dashboard`);
        } else {
            router.push(`/${locale}/auth/login`);
        }
    };

    return (
        <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-20 w-96 h-96 bg-afflyt-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-afflyt-plasma-500/10 rounded-full blur-3xl" />
            </div>

            <GlassCard className="relative z-10 p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-afflyt-cyan-400 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verificando...</h2>
                        <p className="text-gray-400">Stiamo verificando la tua email.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Email Verificata!</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <CyberButton onClick={handleContinue} variant="primary" className="w-full justify-center">
                            Vai alla Dashboard
                        </CyberButton>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verifica Fallita</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <CyberButton onClick={handleContinue} variant="secondary" className="w-full justify-center">
                            Torna al Login
                        </CyberButton>
                    </>
                )}
            </GlassCard>
        </div>
    );
}
