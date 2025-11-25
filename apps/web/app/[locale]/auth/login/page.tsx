'use client';

import { useState } from 'react';
import { Mail, Lock, Sparkles, Globe, ArrowRight, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type AuthMode = 'login' | 'register' | 'magic-link' | 'forgot-password';
type AlertType = 'error' | 'success' | 'info';

interface AlertState {
    type: AlertType;
    message: string;
}

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<AlertState | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const t = useTranslations('auth.login');
    const tFeatures = useTranslations('auth.features');
    const tStats = useTranslations('stats');
    const tBrand = useTranslations('brand');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = () => {
        const newLocale = locale === 'it' ? 'en' : 'it';
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname);
    };

    const showAlert = (type: AlertType, message: string) => {
        setAlert({ type, message });
        if (type !== 'error') {
            setTimeout(() => setAlert(null), 5000);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                showAlert('success', 'Login effettuato con successo!');
                setTimeout(() => {
                    window.location.href = `/${locale}/dashboard`;
                }, 1000);
            } else if (res.status === 403 && data.requiresVerification) {
                showAlert('info', data.message);
            } else if (res.status === 423) {
                showAlert('error', data.message);
            } else {
                showAlert('error', data.message || 'Credenziali non valide');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('error', 'Errore di connessione al server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        // Validate password match
        if (password !== confirmPassword) {
            showAlert('error', 'Le password non coincidono');
            setIsLoading(false);
            return;
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            showAlert('error', 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: name || undefined })
            });

            const data = await res.json();

            if (res.ok || res.status === 200) {
                setEmailSent(true);
                showAlert('success', data.message);
            } else if (data.errors) {
                const errorMessages = data.errors.map((e: any) => e.message).join('. ');
                showAlert('error', errorMessages);
            } else {
                showAlert('error', data.message || 'Errore durante la registrazione');
            }
        } catch (error) {
            console.error('Register error:', error);
            showAlert('error', 'Errore di connessione al server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        try {
            const res = await fetch(`${API_URL}/auth/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            setEmailSent(true);
            showAlert('success', data.message);
        } catch (error) {
            console.error('Magic link error:', error);
            showAlert('error', 'Errore di connessione al server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            setEmailSent(true);
            showAlert('success', data.message);
        } catch (error) {
            console.error('Forgot password error:', error);
            showAlert('error', 'Errore di connessione al server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        switch (authMode) {
            case 'login':
                return handleLogin(e);
            case 'register':
                return handleRegister(e);
            case 'magic-link':
                return handleMagicLink(e);
            case 'forgot-password':
                return handleForgotPassword(e);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setAlert(null);
        setEmailSent(false);
    };

    const switchMode = (mode: AuthMode) => {
        resetForm();
        setAuthMode(mode);
    };

    const getTitle = () => {
        switch (authMode) {
            case 'login':
                return 'Accedi al Command Center';
            case 'register':
                return 'Crea il tuo Account';
            case 'magic-link':
                return 'Accesso Istantaneo';
            case 'forgot-password':
                return 'Recupera Password';
        }
    };

    const getSubtitle = () => {
        switch (authMode) {
            case 'login':
                return 'Il tuo hub di controllo per l\'affiliate marketing';
            case 'register':
                return 'Inizia a monetizzare in pochi minuti';
            case 'magic-link':
                return 'Ricevi un link sicuro via email';
            case 'forgot-password':
                return 'Ti invieremo le istruzioni via email';
        }
    };

    return (
        <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-20 w-96 h-96 bg-afflyt-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-afflyt-plasma-500/10 rounded-full blur-3xl" />
            </div>

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(#00E5E0 1px, transparent 1px), linear-gradient(90deg, #00E5E0 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel - Auth Form */}
                <div className="space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-xl flex items-center justify-center">
                            <span className="text-afflyt-dark-100 font-bold text-2xl">A</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-2xl tracking-tight">{tBrand('name')}</h1>
                            <p className="text-afflyt-cyan-400 text-sm font-mono uppercase">{tBrand('tagline')}</p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <GlassCard className="p-8">
                        {/* Alert */}
                        {alert && (
                            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                                alert.type === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                                alert.type === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                                'bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30'
                            }`}>
                                {alert.type === 'error' ? (
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                        alert.type === 'success' ? 'text-green-400' : 'text-afflyt-cyan-400'
                                    }`} />
                                )}
                                <p className={`text-sm ${
                                    alert.type === 'error' ? 'text-red-300' :
                                    alert.type === 'success' ? 'text-green-300' :
                                    'text-afflyt-cyan-300'
                                }`}>{alert.message}</p>
                            </div>
                        )}

                        {!emailSent ? (
                            <>
                                <h2 className="text-3xl font-bold text-white mb-2">{getTitle()}</h2>
                                <p className="text-gray-400 mb-8">{getSubtitle()}</p>

                                {/* Auth Mode Toggle for Login */}
                                {(authMode === 'login' || authMode === 'magic-link') && (
                                    <div className="flex p-1 bg-afflyt-dark-50 rounded-lg mb-6 border border-afflyt-glass-border">
                                        <button
                                            onClick={() => switchMode('magic-link')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'magic-link'
                                                ? 'bg-afflyt-glass-white text-afflyt-cyan-400 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                        >
                                            Magic Link
                                        </button>
                                        <button
                                            onClick={() => switchMode('login')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'login'
                                                ? 'bg-afflyt-glass-white text-afflyt-cyan-400 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                        >
                                            Password
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name field (only for register) */}
                                    {authMode === 'register' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Nome (opzionale)
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Il tuo nome"
                                                    className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Email field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="tu@esempio.com"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Password field (login and register) */}
                                    {(authMode === 'login' || authMode === 'register') && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Password
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
                                            {authMode === 'register' && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Min. 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Confirm Password (register only) */}
                                    {authMode === 'register' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
                                    )}

                                    {/* Forgot Password Link */}
                                    {authMode === 'login' && (
                                        <div className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => switchMode('forgot-password')}
                                                className="text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors"
                                            >
                                                Password dimenticata?
                                            </button>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <CyberButton
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full justify-center"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-afflyt-dark-100 border-t-transparent rounded-full animate-spin" />
                                                <span>Elaborazione...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                <span>
                                                    {authMode === 'login' && 'Accedi'}
                                                    {authMode === 'register' && 'Registrati'}
                                                    {authMode === 'magic-link' && 'Invia Magic Link'}
                                                    {authMode === 'forgot-password' && 'Invia Email'}
                                                </span>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </CyberButton>
                                </form>

                                {/* Mode Switch Links */}
                                <div className="mt-6 text-center text-sm">
                                    {(authMode === 'login' || authMode === 'magic-link') && (
                                        <p className="text-gray-400">
                                            Non hai un account?{' '}
                                            <button
                                                onClick={() => switchMode('register')}
                                                className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                                            >
                                                Registrati
                                            </button>
                                        </p>
                                    )}
                                    {authMode === 'register' && (
                                        <p className="text-gray-400">
                                            Hai già un account?{' '}
                                            <button
                                                onClick={() => switchMode('login')}
                                                className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                                            >
                                                Accedi
                                            </button>
                                        </p>
                                    )}
                                    {authMode === 'forgot-password' && (
                                        <p className="text-gray-400">
                                            <button
                                                onClick={() => switchMode('login')}
                                                className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                                            >
                                                Torna al login
                                            </button>
                                        </p>
                                    )}
                                </div>

                                {/* Security Badge */}
                                {authMode === 'magic-link' && (
                                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500 animate-in fade-in duration-500">
                                        <span className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                                            Nessuna password richiesta
                                        </span>
                                        <span>•</span>
                                        <span>Accesso sicuro via email</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Email Sent Confirmation */
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-afflyt-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Controlla la tua email!</h3>
                                <p className="text-gray-400 mb-2">
                                    {authMode === 'register' && 'Ti abbiamo inviato un link per verificare il tuo account.'}
                                    {authMode === 'magic-link' && 'Ti abbiamo inviato un link di accesso.'}
                                    {authMode === 'forgot-password' && 'Ti abbiamo inviato le istruzioni per il reset.'}
                                </p>
                                <p className="text-afflyt-cyan-400 font-mono">{email}</p>

                                <div className="mt-6">
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setAuthMode('login');
                                        }}
                                        className="text-sm text-gray-400 hover:text-afflyt-cyan-400 transition-colors"
                                    >
                                        Torna al login
                                    </button>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* Language Toggle */}
                    <div className="flex justify-center">
                        <button
                            onClick={switchLocale}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-afflyt-cyan-400 transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="font-mono uppercase">{locale === 'it' ? 'EN' : 'IT'}</span>
                        </button>
                    </div>
                </div>

                {/* Right Panel - Features */}
                <div className="hidden lg:flex items-center justify-center">
                    <div className="space-y-6">
                        {(['realTimeDashboard', 'aiAutomations', 'advancedAnalytics'] as const).map((feature, index) => (
                            <GlassCard key={feature} className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center">
                                        <span className="text-afflyt-cyan-400 font-mono text-lg">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{tFeatures(feature)}</h3>
                                </div>
                            </GlassCard>
                        ))}

                        {/* Stats Preview */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <GlassCard className="p-4">
                                <p className="text-xs text-gray-500 uppercase mb-1">{tStats('averageROI')}</p>
                                <p className="text-2xl font-bold text-afflyt-profit-400 font-mono">+247%</p>
                            </GlassCard>
                            <GlassCard className="p-4">
                                <p className="text-xs text-gray-500 uppercase mb-1">{tStats('dealsPerDay')}</p>
                                <p className="text-2xl font-bold text-afflyt-cyan-400 font-mono">1.2K</p>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
