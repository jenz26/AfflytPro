'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Mail, Lock, Sparkles, Globe, ArrowRight, User, AlertCircle, CheckCircle2, Eye, EyeOff, ExternalLink, AlertTriangle, FlaskConical, Ticket } from 'lucide-react';
import Image from 'next/image';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE } from '@/lib/api/config';
import { detectEmailProvider, getWebmailUrl, type EmailProviderInfo } from '@/lib/email-provider-detection';
import { Analytics } from '@/components/analytics/PostHogProvider';
import { setMonitoringUser } from '@/lib/monitoring';
import { setAuthToken } from '@/lib/auth';

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
    const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<AlertState | null>(null);
    const [emailSent, setEmailSent] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [sentEmail, setSentEmail] = useState('');
    const [emailProvider, setEmailProvider] = useState<EmailProviderInfo | null>(null);
    const [betaTestingMode, setBetaTestingMode] = useState(false);
    const [betaCode, setBetaCode] = useState('');

    const t = useTranslations('auth');
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

    // Fetch auth config (beta mode status)
    useEffect(() => {
        const fetchAuthConfig = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/config`);
                if (res.ok) {
                    const config = await res.json();
                    setBetaTestingMode(config.betaTestingMode || false);
                }
            } catch (error) {
                console.error('Failed to fetch auth config:', error);
            }
        };
        fetchAuthConfig();
    }, []);

    // Track page view on mount
    useEffect(() => {
        Analytics.trackLoginPageView();
    }, []);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setInterval(() => {
            setResendCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCountdown]);

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
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                setAuthToken(data.token);
                // Track login success and set user context across all services
                Analytics.trackLoginSuccess('password');
                if (data.user?.id) {
                    setMonitoringUser({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.name,
                        plan: data.user.plan,
                    });
                }
                showAlert('success', t('messages.loginSuccess'));
                setTimeout(() => {
                    window.location.href = `/${locale}/dashboard`;
                }, 1000);
            } else if (res.status === 403 && data.requiresVerification) {
                showAlert('info', data.message);
            } else if (res.status === 423) {
                showAlert('error', data.message);
            } else {
                showAlert('error', data.message || t('messages.invalidCredentials'));
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('error', t('messages.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        if (password !== confirmPassword) {
            showAlert('error', t('messages.passwordsMismatch'));
            setIsLoading(false);
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            showAlert('error', t('messages.passwordRequirements'));
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: name || undefined, locale })
            });

            const data = await res.json();

            if (res.ok || res.status === 200) {
                setEmailSent(true);
                showAlert('success', data.message);
            } else if (data.errors) {
                const errorMessages = data.errors.map((e: any) => e.message).join('. ');
                showAlert('error', errorMessages);
            } else {
                showAlert('error', data.message || t('messages.registrationError'));
            }
        } catch (error) {
            console.error('Register error:', error);
            showAlert('error', t('messages.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        try {
            const payload: { email: string; locale: string; betaCode?: string } = { email, locale };
            if (betaTestingMode && betaCode) {
                payload.betaCode = betaCode;
            }

            const res = await fetch(`${API_BASE}/auth/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            const provider = detectEmailProvider(email);
            setSentEmail(email);
            setEmailProvider(provider);
            setEmailSent(true);
            setResendCountdown(60); // 60 seconds before can resend
            // Track magic link requested
            Analytics.trackMagicLinkRequested(provider.type, data.isNewUser || false);
            showAlert('success', data.message);
        } catch (error) {
            console.error('Magic link error:', error);
            Analytics.trackLoginError('magic_link_send_failed');
            showAlert('error', t('messages.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendMagicLink = async () => {
        if (resendCountdown > 0) return;
        setIsLoading(true);
        setAlert(null);

        try {
            const res = await fetch(`${API_BASE}/auth/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sentEmail, locale })
            });

            const data = await res.json();
            setResendCountdown(60);
            showAlert('success', t('messages.magicLinkResent'));
        } catch (error) {
            console.error('Resend magic link error:', error);
            showAlert('error', t('messages.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAlert(null);

        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, locale })
            });

            const data = await res.json();
            setEmailSent(true);
            showAlert('success', data.message);
        } catch (error) {
            console.error('Forgot password error:', error);
            showAlert('error', t('messages.connectionError'));
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
        setResendCountdown(0);
        setSentEmail('');
        setEmailProvider(null);
    };

    const switchMode = (mode: AuthMode) => {
        resetForm();
        setAuthMode(mode);
    };

    const getTitle = () => {
        switch (authMode) {
            case 'login':
                return t('titles.login');
            case 'register':
                return t('titles.register');
            case 'magic-link':
                return t('titles.magicLink');
            case 'forgot-password':
                return t('titles.forgotPassword');
        }
    };

    const getSubtitle = () => {
        switch (authMode) {
            case 'login':
                return t('subtitles.login');
            case 'register':
                return t('subtitles.register');
            case 'magic-link':
                return t('subtitles.magicLink');
            case 'forgot-password':
                return t('subtitles.forgotPassword');
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
                    <div className="flex items-center gap-4">
                        <Image
                            src="/images/logo.webp"
                            alt="Afflyt Pro"
                            width={180}
                            height={50}
                            className="h-12 w-auto"
                            priority
                        />
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
                                {/* Beta Testing Banner */}
                                {betaTestingMode && (
                                    <div className="mb-6 p-4 bg-afflyt-plasma-500/10 border border-afflyt-plasma-500/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FlaskConical className="w-5 h-5 text-afflyt-plasma-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-afflyt-plasma-300">
                                                    {t('beta.title')}
                                                </p>
                                                <p className="text-xs text-afflyt-plasma-300/70 mt-0.5">
                                                    {t('beta.description')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <h2 className="text-3xl font-bold text-white mb-2">{getTitle()}</h2>
                                <p className="text-gray-400 mb-8">{getSubtitle()}</p>

                                {/* Auth Mode Toggle - Magic Link (primary) | Password (secondary) - Hidden in beta mode */}
                                {!betaTestingMode && (authMode === 'login' || authMode === 'magic-link') && (
                                    <div className="flex p-1 bg-afflyt-dark-50 rounded-lg mb-6 border border-afflyt-glass-border">
                                        <button
                                            onClick={() => switchMode('magic-link')}
                                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${authMode === 'magic-link'
                                                ? 'bg-gradient-to-r from-afflyt-cyan-500/20 to-blue-500/20 text-afflyt-cyan-400 shadow-sm border border-afflyt-cyan-500/30'
                                                : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                        >
                                            {t('tabs.magicLink')}
                                        </button>
                                        <button
                                            onClick={() => switchMode('login')}
                                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${authMode === 'login'
                                                ? 'bg-afflyt-glass-white text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            {t('tabs.password')}
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name field (only for register) */}
                                    {authMode === 'register' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {t('fields.nameLabel')}
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder={t('fields.namePlaceholder')}
                                                    className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Beta Code field (only in beta mode for magic-link) */}
                                    {betaTestingMode && authMode === 'magic-link' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {t('beta.codeLabel')}
                                            </label>
                                            <div className="relative">
                                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-plasma-400/50" />
                                                <input
                                                    type="text"
                                                    value={betaCode}
                                                    onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                                                    placeholder="AFFLYT-XXXX-XXXX"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-plasma-500/30 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-plasma-500 focus:ring-1 focus:ring-afflyt-plasma-500/50 transition-all font-mono uppercase tracking-wider"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-afflyt-plasma-300/70">
                                                {t('beta.codeHint')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Email field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t('fields.emailLabel')}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t('fields.emailPlaceholder')}
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Password field (login and register) */}
                                    {(authMode === 'login' || authMode === 'register') && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {t('fields.passwordLabel')}
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
                                                    {t('fields.passwordHint')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Confirm Password (register only) */}
                                    {authMode === 'register' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {t('fields.confirmPasswordLabel')}
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
                                                {t('links.forgotPassword')}
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
                                                <span>{t('buttons.processing')}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                <span>
                                                    {authMode === 'login' && t('buttons.login')}
                                                    {authMode === 'register' && t('buttons.register')}
                                                    {authMode === 'magic-link' && t('buttons.sendMagicLink')}
                                                    {authMode === 'forgot-password' && t('buttons.sendEmail')}
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
                                            {t('links.noAccount')}{' '}
                                            <button
                                                onClick={() => switchMode('register')}
                                                className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                                            >
                                                {t('links.register')}
                                            </button>
                                        </p>
                                    )}
                                    {authMode === 'register' && (
                                        <p className="text-gray-400">
                                            {t('links.hasAccount')}{' '}
                                            <button
                                                onClick={() => switchMode('login')}
                                                className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                                            >
                                                {t('links.login')}
                                            </button>
                                        </p>
                                    )}
                                    {authMode === 'forgot-password' && (
                                        <p className="text-gray-400">
                                            <button
                                                onClick={() => switchMode('login')}
                                                className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                                            >
                                                {t('links.backToLogin')}
                                            </button>
                                        </p>
                                    )}
                                </div>

                                {/* Security Badge */}
                                {authMode === 'magic-link' && (
                                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500 animate-in fade-in duration-500">
                                        <span className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                                            {t('badges.noPasswordRequired')}
                                        </span>
                                        <span>•</span>
                                        <span>{t('badges.secureAccess')}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Email Sent Confirmation - Enhanced */
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Mail className="w-8 h-8 text-afflyt-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{t('emailSent.title')}</h3>
                                <p className="text-gray-400 mb-2">
                                    {authMode === 'register' && t('emailSent.verifyAccount')}
                                    {authMode === 'magic-link' && t('emailSent.accessLink')}
                                    {authMode === 'forgot-password' && t('emailSent.resetInstructions')}
                                </p>
                                <p className="text-afflyt-cyan-400 font-mono text-lg">{sentEmail || email}</p>

                                {/* Webmail Quick Open Button */}
                                {authMode === 'magic-link' && emailProvider?.webmailUrl && (
                                    <a
                                        href={emailProvider.webmailUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-afflyt-cyan-500 to-blue-500 hover:from-afflyt-cyan-400 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-afflyt-cyan-500/20 hover:shadow-afflyt-cyan-500/30"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {t('emailSent.openWebmail', { provider: emailProvider.name })}
                                    </a>
                                )}

                                {/* Provider Warning for Outlook/Hotmail */}
                                {authMode === 'magic-link' && emailProvider?.hasDeliveryIssues && (
                                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-amber-300 mb-1">
                                                    {t('emailSent.providerWarning.title', { provider: emailProvider.name })}
                                                </p>
                                                <p className="text-sm text-amber-200/80">
                                                    {emailProvider.type === 'outlook' || emailProvider.type === 'hotmail'
                                                        ? t('emailSent.providerWarning.outlook')
                                                        : emailProvider.type === 'corporate'
                                                        ? t('emailSent.providerWarning.corporate')
                                                        : t('emailSent.tips.checkSpam')
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tips Card - Dynamic based on provider */}
                                {authMode === 'magic-link' && (
                                    <div className="mt-6 p-4 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-left">
                                        <p className="text-sm font-medium text-white mb-3">{t('emailSent.tips.title')}</p>
                                        <ul className="space-y-2 text-sm text-gray-400">
                                            {/* Dynamic tips based on email provider */}
                                            {emailProvider?.tips.includes('checkJunk') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.checkJunk')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('checkFocused') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.checkFocused')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('checkPromotions') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.checkPromotions')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('addToContacts') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.addToContacts')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('corporateWarning') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.corporateWarning')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('checkQuarantine') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.checkQuarantine')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('contactIT') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.contactIT')}</span>
                                                </li>
                                            )}
                                            {emailProvider?.tips.includes('pecWarning') && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-amber-400 mt-0.5">!</span>
                                                    <span className="text-amber-300">{t('emailSent.tips.pecWarning')}</span>
                                                </li>
                                            )}
                                            {/* Default tips if no specific ones */}
                                            {(!emailProvider || emailProvider.tips.includes('checkSpam')) && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                    <span>{t('emailSent.tips.checkSpam')}</span>
                                                </li>
                                            )}
                                            <li className="flex items-start gap-2">
                                                <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                <span>{t('emailSent.tips.searchEmail')}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-afflyt-cyan-400 mt-0.5">•</span>
                                                <span>{t('emailSent.tips.linkExpiry')}</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}

                                {/* Resend Button with Countdown */}
                                {authMode === 'magic-link' && (
                                    <div className="mt-6">
                                        <button
                                            onClick={handleResendMagicLink}
                                            disabled={resendCountdown > 0 || isLoading}
                                            className={`text-sm transition-colors ${
                                                resendCountdown > 0
                                                    ? 'text-gray-600 cursor-not-allowed'
                                                    : 'text-afflyt-cyan-400 hover:text-afflyt-cyan-300'
                                            }`}
                                        >
                                            {resendCountdown > 0
                                                ? t('emailSent.resendIn', { seconds: resendCountdown })
                                                : t('emailSent.resendLink')
                                            }
                                        </button>
                                    </div>
                                )}

                                {/* Back to Login */}
                                <div className="mt-4 pt-4 border-t border-afflyt-glass-border">
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setAuthMode('magic-link');
                                        }}
                                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {t('links.backToLogin')}
                                    </button>
                                </div>

                                {/* Support Link */}
                                <p className="mt-4 text-xs text-gray-600">
                                    {t('emailSent.needHelp')}{' '}
                                    <a
                                        href="mailto:support@afflyt.io"
                                        className="text-afflyt-cyan-400/70 hover:text-afflyt-cyan-400 transition-colors"
                                    >
                                        {t('emailSent.contactSupport')}
                                    </a>
                                </p>
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
