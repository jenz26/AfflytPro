'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface TrackingResponse {
    redirectUrl: string;
    trackingId: string;
    message: string;
}

export default function RedirectPage() {
    const params = useParams();
    const code = params.code as string;

    const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
    const [countdown, setCountdown] = useState(3);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;

        // Track the click and get redirect URL
        const trackClick = async () => {
            try {
                const response = await fetch(`${API_BASE}/track/r/${code}/clickout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Link non trovato o scaduto');
                    } else {
                        setError('Errore durante il caricamento');
                    }
                    setStatus('error');
                    return;
                }

                const data: TrackingResponse = await response.json();
                setRedirectUrl(data.redirectUrl);
                setStatus('redirecting');
            } catch (err) {
                console.error('Tracking error:', err);
                setError('Errore di connessione');
                setStatus('error');
            }
        };

        trackClick();
    }, [code]);

    // Countdown and redirect
    useEffect(() => {
        if (status !== 'redirecting' || !redirectUrl) return;

        if (countdown <= 0) {
            window.location.href = redirectUrl;
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [status, countdown, redirectUrl]);

    // Manual redirect
    const handleManualRedirect = () => {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Image
                        src="/images/logo.webp"
                        alt="Afflyt"
                        width={150}
                        height={50}
                        className="mx-auto"
                        priority
                    />
                </div>

                {/* Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 text-center">
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
                            </div>
                            <h1 className="text-xl font-semibold text-white mb-2">
                                Caricamento...
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Preparazione del link
                            </p>
                        </>
                    )}

                    {status === 'redirecting' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
                                <span className="text-3xl font-bold text-cyan-400">
                                    {countdown}
                                </span>
                            </div>
                            <h1 className="text-xl font-semibold text-white mb-2">
                                Reindirizzamento ad Amazon
                            </h1>
                            <p className="text-gray-400 text-sm mb-6">
                                Verrai reindirizzato automaticamente tra {countdown} second{countdown !== 1 ? 'i' : 'o'}
                            </p>
                            <button
                                onClick={handleManualRedirect}
                                className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105"
                            >
                                Vai subito su Amazon
                            </button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-semibold text-white mb-2">
                                {error || 'Errore'}
                            </h1>
                            <p className="text-gray-400 text-sm mb-6">
                                Il link potrebbe essere scaduto o non valido.
                            </p>
                            <a
                                href="https://afflyt.io"
                                className="inline-block py-3 px-6 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
                            >
                                Torna alla homepage
                            </a>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Questo link contiene un tag affiliato. Acquistando tramite questo link supporti Afflyt senza costi aggiuntivi.
                    </p>
                </div>
            </div>
        </div>
    );
}
