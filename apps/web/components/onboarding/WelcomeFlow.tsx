'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    TrendingUp,
    Users,
    DollarSign,
    MessageSquare,
    Mail,
    Send,
    ChevronRight,
    ChevronLeft,
    Check,
    Rocket,
    Info,
    Lightbulb,
    AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useAnalytics } from '@/hooks/useAnalytics';

interface WelcomeFlowProps {
    onComplete: (data: SurveyData) => void;
    onSkip?: () => void;
}

interface SurveyData {
    goal: 'sales' | 'audience' | 'monetize' | null;
    audienceSize: 'starting' | 'small' | 'medium' | 'large' | null;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null;
    channels: string[];
}

const GOALS = [
    {
        id: 'sales' as const,
        icon: TrendingUp,
        title: 'Aumentare le Vendite',
        description: 'Vuoi massimizzare le commissioni di affiliazione pubblicando i deal migliori',
        color: 'from-afflyt-profit-500 to-afflyt-profit-600'
    },
    {
        id: 'audience' as const,
        icon: Users,
        title: 'Costruire un\'Audience',
        description: 'Vuoi crescere la tua community con contenuti di valore costanti',
        color: 'from-afflyt-cyan-500 to-afflyt-cyan-600'
    },
    {
        id: 'monetize' as const,
        icon: DollarSign,
        title: 'Monetizzare Contenuti',
        description: 'Hai già un\'audience e vuoi monetizzarla con automazioni intelligenti',
        color: 'from-afflyt-plasma-500 to-afflyt-plasma-600'
    }
];

const AUDIENCE_SIZES = [
    { id: 'starting' as const, label: 'Sto iniziando', description: '0-100 follower', range: '0-100' },
    { id: 'small' as const, label: 'Piccola audience', description: '100-1K follower', range: '100-1K' },
    { id: 'medium' as const, label: 'Media audience', description: '1K-10K follower', range: '1K-10K' },
    { id: 'large' as const, label: 'Grande audience', description: '10K+ follower', range: '10K+' }
];

const EXPERIENCE_LEVELS = [
    {
        id: 'beginner' as const,
        label: 'Principiante',
        description: 'Nuovo nel mondo dell\'affiliate marketing',
        helpText: 'Ti guideremo passo-passo in ogni configurazione'
    },
    {
        id: 'intermediate' as const,
        label: 'Intermedio',
        description: 'Conosco le basi, voglio automatizzare',
        helpText: 'Configurazione guidata con suggerimenti avanzati'
    },
    {
        id: 'advanced' as const,
        label: 'Esperto',
        description: 'Cerco massima flessibilità e controllo',
        helpText: 'Accesso completo a tutte le funzionalità pro'
    }
];

const CHANNELS = [
    { id: 'telegram', icon: Send, label: 'Telegram', description: 'Canali e gruppi' },
    { id: 'email', icon: Mail, label: 'Email', description: 'Newsletter automatiche' },
    { id: 'discord', icon: MessageSquare, label: 'Discord', description: 'Server e canali' }
];

export const WelcomeFlow = ({ onComplete, onSkip }: WelcomeFlowProps) => {
    const [step, setStep] = useState(() => {
        // Carica lo step salvato da localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('onboarding_progress');
            if (saved) {
                try {
                    const { step: savedStep } = JSON.parse(saved);
                    return savedStep || 0;
                } catch (e) {
                    return 0;
                }
            }
        }
        return 0;
    });

    const [surveyData, setSurveyData] = useState<SurveyData>(() => {
        // Carica i dati salvati da localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('onboarding_progress');
            if (saved) {
                try {
                    const { data } = JSON.parse(saved);
                    return data || {
                        goal: null,
                        audienceSize: null,
                        experienceLevel: null,
                        channels: []
                    };
                } catch (e) {
                    return {
                        goal: null,
                        audienceSize: null,
                        experienceLevel: null,
                        channels: []
                    };
                }
            }
        }
        return {
            goal: null,
            audienceSize: null,
            experienceLevel: null,
            channels: []
        };
    });

    const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { trackOnboardingStep } = useAnalytics();

    // Auto-save del progresso ogni volta che cambiano step o dati
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const progressData = {
                step,
                data: surveyData,
                timestamp: Date.now()
            };
            localStorage.setItem('onboarding_progress', JSON.stringify(progressData));
        }
    }, [step, surveyData]);

    // Smart Defaults - impostazioni raccomandate per iniziare velocemente
    const useRecommendedSettings = () => {
        setSurveyData({
            goal: 'sales', // Obiettivo più comune
            audienceSize: 'starting', // La maggior parte inizia da zero
            experienceLevel: 'beginner', // Setup semplificato
            channels: ['telegram'] // Canale più popolare e facile da configurare
        });
        trackOnboardingStep('welcome_quick_start', 'completed', { method: 'recommended_settings' });
        // Salta direttamente al recap finale
        setStep(4);
    };

    // Auto-advance dopo 800ms quando si seleziona un'opzione (solo per step 1, 2, 3)
    useEffect(() => {
        // Clear any existing timer
        if (autoAdvanceTimerRef.current) {
            clearTimeout(autoAdvanceTimerRef.current);
        }

        // Check if we should auto-advance
        const shouldAutoAdvance = () => {
            if (step === 1 && surveyData.goal) return true;
            if (step === 2 && surveyData.audienceSize) return true;
            if (step === 3 && surveyData.experienceLevel) return true;
            return false;
        };

        if (shouldAutoAdvance()) {
            autoAdvanceTimerRef.current = setTimeout(() => {
                nextStep();
            }, 800);
        }

        // Cleanup on unmount
        return () => {
            if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
            }
        };
    }, [surveyData.goal, surveyData.audienceSize, surveyData.experienceLevel, step]);

    const updateData = (field: keyof SurveyData, value: any) => {
        setSurveyData(prev => ({ ...prev, [field]: value }));
    };

    const toggleChannel = (channelId: string) => {
        setSurveyData(prev => ({
            ...prev,
            channels: prev.channels.includes(channelId)
                ? prev.channels.filter(c => c !== channelId)
                : [...prev.channels, channelId]
        }));
    };

    const nextStep = () => {
        if (step < 4) {
            trackOnboardingStep(`welcome_step_${step + 1}`, 'completed', {
                ...surveyData,
                stepName: getStepName(step)
            });
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleComplete = () => {
        trackOnboardingStep('welcome_survey', 'completed', surveyData);
        // Pulisci il localStorage quando completi l'onboarding
        if (typeof window !== 'undefined') {
            localStorage.removeItem('onboarding_progress');
        }
        onComplete(surveyData);
    };

    const getStepName = (stepIndex: number) => {
        const names = ['welcome', 'goal', 'audience', 'experience', 'channels'];
        return names[stepIndex];
    };

    const isStepComplete = () => {
        switch (step) {
            case 0: return true; // Welcome screen
            case 1: return surveyData.goal !== null;
            case 2: return surveyData.audienceSize !== null;
            case 3: return surveyData.experienceLevel !== null;
            case 4: return surveyData.channels.length > 0;
            default: return false;
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="text-center py-4"
                    >
                        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-afflyt-dark-100" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Benvenuto in Afflyt Pro
                        </h1>
                        <p className="text-sm text-gray-300 mb-6 max-w-xl mx-auto">
                            L'automazione intelligente per l'affiliate marketing che lavora per te 24/7
                        </p>
                        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
                            <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                <div className="text-2xl font-bold text-afflyt-cyan-400 mb-0.5">100%</div>
                                <div className="text-xs text-gray-400">Automatico</div>
                            </div>
                            <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                <div className="text-2xl font-bold text-afflyt-profit-400 mb-0.5">+247%</div>
                                <div className="text-xs text-gray-400">ROI Medio</div>
                            </div>
                            <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                <div className="text-2xl font-bold text-afflyt-plasma-400 mb-0.5">24/7</div>
                                <div className="text-xs text-gray-400">Attivo</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Rispondi a 4 domande per personalizzare la tua esperienza
                        </p>
                        <button
                            onClick={useRecommendedSettings}
                            className="mx-auto px-4 py-2 bg-afflyt-dark-50 border border-afflyt-cyan-500/30 rounded-lg text-sm text-afflyt-cyan-400 hover:bg-afflyt-cyan-500/10 hover:border-afflyt-cyan-500/50 transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Usa impostazioni raccomandate (più veloce)
                        </button>
                    </motion.div>
                );

            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className="flex items-start gap-2 mb-3">
                            <h2 className="text-xl font-bold text-white flex-1">Qual è il tuo obiettivo principale?</h2>
                            <div className="group relative">
                                <Info className="w-5 h-5 text-gray-500 cursor-help" />
                                <div className="absolute right-0 top-6 w-64 p-3 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <p className="text-xs text-gray-300">
                                        Useremo questa info per suggerirti template di automazione ottimizzati per il tuo caso d'uso
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Questo ci aiuterà a personalizzare i suggerimenti per te</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {GOALS.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => updateData('goal', goal.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left min-h-[160px] ${surveyData.goal === goal.id
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-start gap-3 h-full">
                                        <div className="flex items-center justify-between w-full">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goal.color} flex items-center justify-center shrink-0`}>
                                                <goal.icon className="w-5 h-5 text-white" />
                                            </div>
                                            {surveyData.goal === goal.id && (
                                                <div className="w-5 h-5 rounded-full bg-afflyt-cyan-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold text-white mb-1">{goal.title}</h3>
                                            <p className="text-xs text-gray-400 leading-relaxed">{goal.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {surveyData.goal && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg flex items-start gap-2"
                            >
                                <Lightbulb className="w-4 h-4 text-afflyt-cyan-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-300">
                                    {surveyData.goal === 'sales' && 'Perfetto! Ti suggeriremo automazioni focalizzate su deal ad alto tasso di conversione.'}
                                    {surveyData.goal === 'audience' && 'Ottimo! Ti suggeriremo template per crescita audience con contenuti di valore.'}
                                    {surveyData.goal === 'monetize' && 'Fantastico! Ti proporremo strategie di monetizzazione avanzate per la tua audience esistente.'}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <h2 className="text-xl font-bold text-white mb-1">Dimensione della tua audience</h2>
                        <p className="text-sm text-gray-400 mb-4">Ottimizzeremo le strategie in base alla tua audience attuale</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AUDIENCE_SIZES.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() => updateData('audienceSize', size.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${surveyData.audienceSize === size.id
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-white mb-1">{size.label}</h3>
                                            <p className="text-xs text-gray-400">{size.description}</p>
                                            <p className="text-xs text-afflyt-cyan-400 mt-1.5 font-mono">{size.range}</p>
                                        </div>
                                        {surveyData.audienceSize === size.id && (
                                            <div className="w-5 h-5 rounded-full bg-afflyt-cyan-500 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <h2 className="text-xl font-bold text-white mb-1">Livello di esperienza</h2>
                        <p className="text-sm text-gray-400 mb-4">Adatteremo il livello di guida e assistenza</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {EXPERIENCE_LEVELS.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => updateData('experienceLevel', level.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${surveyData.experienceLevel === level.id
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-start min-h-[140px]">
                                        <div className="flex items-center justify-between w-full mb-3">
                                            <h3 className="text-base font-semibold text-white">{level.label}</h3>
                                            {surveyData.experienceLevel === level.id && (
                                                <div className="w-5 h-5 rounded-full bg-afflyt-cyan-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">{level.description}</p>
                                        <p className="text-xs text-afflyt-cyan-400 mt-auto">{level.helpText}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                );

            case 4:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <h2 className="text-xl font-bold text-white mb-1">Seleziona i canali da configurare</h2>
                        <p className="text-sm text-gray-400 mb-4">Puoi sempre aggiungerne altri in seguito (scegli almeno uno)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            {CHANNELS.map((channel) => (
                                <button
                                    key={channel.id}
                                    onClick={() => toggleChannel(channel.id)}
                                    className={`p-4 rounded-xl border-2 transition-all ${surveyData.channels.includes(channel.id)
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${surveyData.channels.includes(channel.id)
                                            ? 'bg-afflyt-cyan-500'
                                            : 'bg-afflyt-dark-100'
                                            }`}>
                                            <channel.icon className={`w-6 h-6 ${surveyData.channels.includes(channel.id)
                                                ? 'text-white'
                                                : 'text-gray-500'
                                                }`} />
                                        </div>
                                        <h3 className="text-base font-semibold text-white mb-0.5">{channel.label}</h3>
                                        <p className="text-xs text-gray-400">{channel.description}</p>
                                        {surveyData.channels.includes(channel.id) && (
                                            <div className="mt-2 flex items-center justify-center gap-1 text-afflyt-cyan-400">
                                                <Check className="w-3 h-3" />
                                                <span className="text-xs font-medium">Selezionato</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                            <p className="text-xs text-gray-300 mb-1">
                                <strong className="text-white">Canali selezionati:</strong> {surveyData.channels.length === 0 ? 'Nessuno' : surveyData.channels.join(', ')}
                            </p>
                            <p className="text-xs text-gray-500">
                                Configureremo questi canali nei prossimi passaggi
                            </p>
                        </div>
                        {surveyData.channels.length === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg flex items-start gap-2"
                            >
                                <Lightbulb className="w-4 h-4 text-afflyt-cyan-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-300">
                                    Hai selezionato solo {surveyData.channels[0]}. Salteremo automaticamente la configurazione degli altri canali.
                                </p>
                            </motion.div>
                        )}
                        {surveyData.channels.length > 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-start gap-2"
                            >
                                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-300">
                                    Configureremo tutti i {surveyData.channels.length} canali selezionati. Puoi sempre skippare i canali che non vuoi configurare ora.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <GlassCard className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Progress Indicator */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Passo {step + 1} di 5</span>
                    <span className="text-xs font-mono text-afflyt-cyan-400">
                        {Math.round(((step + 1) / 5) * 100)}%
                    </span>
                </div>
                <div className="h-1.5 bg-afflyt-dark-50 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((step + 1) / 5) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Step Content with Swipe Support */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => {
                        // Swipe left = next step (if available)
                        if (info.offset.x < -100 && step < 4 && isStepComplete()) {
                            nextStep();
                        }
                        // Swipe right = previous step
                        else if (info.offset.x > 100 && step > 0) {
                            prevStep();
                        }
                    }}
                    className="touch-pan-y"
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-afflyt-glass-border">
                <div>
                    {step > 0 && (
                        <CyberButton
                            variant="ghost"
                            onClick={prevStep}
                            className="gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Indietro
                        </CyberButton>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {onSkip && step === 0 && (
                        <CyberButton
                            variant="ghost"
                            onClick={onSkip}
                        >
                            Salta
                        </CyberButton>
                    )}

                    {step < 4 ? (
                        <CyberButton
                            variant="primary"
                            onClick={nextStep}
                            disabled={!isStepComplete()}
                            className="gap-2"
                        >
                            {step === 0 ? 'Inizia' : 'Continua'}
                            <ChevronRight className="w-4 h-4" />
                        </CyberButton>
                    ) : (
                        <CyberButton
                            variant="primary"
                            onClick={handleComplete}
                            disabled={!isStepComplete()}
                            className="gap-2"
                        >
                            <Rocket className="w-4 h-4" />
                            Inizia la configurazione
                        </CyberButton>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};
