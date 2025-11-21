'use client';

import { useState } from 'react';
import { Mail, Sparkles, Globe, ArrowRight } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState<'it' | 'en'>('it');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const translations = {
        it: {
            title: 'Accedi al Command Center',
            subtitle: 'Il tuo hub di controllo per l\'affiliate marketing intelligente',
            emailLabel: 'Email Aziendale',
            emailPlaceholder: 'tu@azienda.com',
            continueButton: 'Accedi con Magic Link',
            noPassword: 'Nessuna password richiesta',
            secure: 'Accesso sicuro e immediato',
            emailSentTitle: 'Controlla la tua email!',
            emailSentDesc: 'Ti abbiamo inviato un link sicuro per accedere.',
            features: [
                'Dashboard Real-Time',
                'Automazioni AI-Powered',
                'Analytics Avanzate'
            ]
        },
        en: {
            title: 'Access Command Center',
            subtitle: 'Your control hub for intelligent affiliate marketing',
            emailLabel: 'Business Email',
            emailPlaceholder: 'you@company.com',
            continueButton: 'Login with Magic Link',
            noPassword: 'No password required',
            secure: 'Secure and instant access',
            emailSentTitle: 'Check your email!',
            emailSentDesc: 'We\'ve sent you a secure link to login.',
            features: [
                'Real-Time Dashboard',
                'AI-Powered Automations',
                'Advanced Analytics'
            ]
        }
    };

    const t = translations[language];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setEmailSent(true);
            setIsLoading(false);
        }, 2000);
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
                {/* Left Panel - Login Form */}
                <div className="space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-xl flex items-center justify-center">
                            <span className="text-afflyt-dark-100 font-bold text-2xl">A</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-2xl tracking-tight">AFFLYT PRO</h1>
                            <p className="text-afflyt-cyan-400 text-sm font-mono uppercase">Command Center</p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <GlassCard className="p-8">
                        {!emailSent ? (
                            <>
                                <h2 className="text-3xl font-bold text-white mb-2">{t.title}</h2>
                                <p className="text-gray-400 mb-8">{t.subtitle}</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t.emailLabel}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t.emailPlaceholder}
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <CyberButton
                                        variant="primary"
                                        size="lg"
                                        className="w-full justify-center"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-afflyt-dark-100 border-t-transparent rounded-full animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                <span>{t.continueButton}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </CyberButton>
                                </form>

                                {/* Security Badge */}
                                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                                        {t.noPassword}
                                    </span>
                                    <span>•</span>
                                    <span>{t.secure}</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-afflyt-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{t.emailSentTitle}</h3>
                                <p className="text-gray-400">{t.emailSentDesc}</p>
                                <p className="text-afflyt-cyan-400 font-mono mt-4">{email}</p>
                            </div>
                        )}
                    </GlassCard>

                    {/* Language Toggle */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setLanguage(language === 'it' ? 'en' : 'it')}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-afflyt-cyan-400 transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="font-mono uppercase">{language === 'it' ? 'EN' : 'IT'}</span>
                        </button>
                    </div>
                </div>

                {/* Right Panel - Features */}
                <div className="hidden lg:flex items-center justify-center">
                    <div className="space-y-6">
                        {t.features.map((feature, index) => (
                            <GlassCard key={index} className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center">
                                        <span className="text-afflyt-cyan-400 font-mono text-lg">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{feature}</h3>
                                </div>
                            </GlassCard>
                        ))}

                        {/* Stats Preview */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <GlassCard className="p-4">
                                <p className="text-xs text-gray-500 uppercase mb-1">ROI Medio</p>
                                <p className="text-2xl font-bold text-afflyt-profit-400 font-mono">+247%</p>
                            </GlassCard>
                            <GlassCard className="p-4">
                                <p className="text-xs text-gray-500 uppercase mb-1">Deal/Giorno</p>
                                <p className="text-2xl font-bold text-afflyt-cyan-400 font-mono">1.2K</p>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
