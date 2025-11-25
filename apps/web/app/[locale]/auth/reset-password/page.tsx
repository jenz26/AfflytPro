'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Lock, CheckCircle2, XCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Status = 'form' | 'loading' | 'success' | 'error';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<Status>('form');
    const [message, setMessage] = useState('');

    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();
    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Le password non coincidono.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setStatus('error');
            setMessage('La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero.');
            return;
        }

        setStatus('loading');

        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.message || 'Reset fallito.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Errore di connessione al server.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center p-4">
                <GlassCard className="p-8 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Link Non Valido</h2>
                    <p className="text-gray-400 mb-6">Il link di reset password non è valido o è scaduto.</p>
                    <CyberButton onClick={() => router.push(`/${locale}/auth/login`)} variant="secondary" className="w-full justify-center">
                        Torna al Login
                    </CyberButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-20 w-96 h-96 bg-afflyt-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-afflyt-plasma-500/10 rounded-full blur-3xl" />
            </div>

            <GlassCard className="relative z-10 p-8 max-w-md w-full">
                {status === 'form' || status === 'loading' ? (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Nuova Password</h2>
                        <p className="text-gray-400 mb-6 text-center">Scegli una nuova password sicura.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nuova Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full pl-12 pr-12 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Min. 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Conferma Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <CyberButton
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-afflyt-dark-100 border-t-transparent rounded-full animate-spin" />
                                        <span>Reimpostando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Reimposta Password</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </CyberButton>
                        </form>
                    </>
                ) : status === 'success' ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Password Reimpostata!</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <CyberButton onClick={() => router.push(`/${locale}/auth/login`)} variant="primary" className="w-full justify-center">
                            Vai al Login
                        </CyberButton>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Errore</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <CyberButton onClick={() => setStatus('form')} variant="secondary" className="w-full justify-center">
                            Riprova
                        </CyberButton>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
