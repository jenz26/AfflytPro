'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
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

const GOAL_IDS = ['sales', 'audience', 'monetize'] as const;
const GOAL_ICONS = {
    sales: TrendingUp,
    audience: Users,
    monetize: DollarSign
};
const GOAL_COLORS = {
    sales: 'from-afflyt-profit-500 to-afflyt-profit-600',
    audience: 'from-afflyt-cyan-500 to-afflyt-cyan-600',
    monetize: 'from-afflyt-plasma-500 to-afflyt-plasma-600'
};

const AUDIENCE_SIZE_IDS = ['starting', 'small', 'medium', 'large'] as const;
const AUDIENCE_SIZE_RANGES = {
    starting: '0-100',
    small: '100-1K',
    medium: '1K-10K',
    large: '10K+'
};

const EXPERIENCE_IDS = ['beginner', 'intermediate', 'advanced'] as const;

const CHANNEL_IDS = ['telegram', 'email', 'discord'] as const;
const CHANNEL_ICONS = {
    telegram: Send,
    email: Mail,
    discord: MessageSquare
};

export const WelcomeFlow = ({ onComplete, onSkip }: WelcomeFlowProps) => {
    const t = useTranslations('onboarding.welcomeFlow');
    const [step, setStep] = useState(() => {
        // Load saved step from localStorage
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
                            {t('title')}
                        </h1>
                        <p className="text-sm text-gray-300 mb-6 max-w-xl mx-auto">
                            {t('subtitle')}
                        </p>
                        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
                            <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                <div className="text-2xl font-bold text-afflyt-cyan-400 mb-0.5">100%</div>
                                <div className="text-xs text-gray-400">{t('stats.automatic')}</div>
                            </div>
                            <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                <div className="text-2xl font-bold text-afflyt-profit-400 mb-0.5">+247%</div>
                                <div className="text-xs text-gray-400">{t('stats.avgRoi')}</div>
                            </div>
                            <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                                <div className="text-2xl font-bold text-afflyt-plasma-400 mb-0.5">24/7</div>
                                <div className="text-xs text-gray-400">{t('stats.active')}</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            {t('answerQuestions')}
                        </p>
                        <button
                            onClick={useRecommendedSettings}
                            className="mx-auto px-4 py-2 bg-afflyt-dark-50 border border-afflyt-cyan-500/30 rounded-lg text-sm text-afflyt-cyan-400 hover:bg-afflyt-cyan-500/10 hover:border-afflyt-cyan-500/50 transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            {t('useRecommended')}
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
                            <h2 className="text-xl font-bold text-white flex-1">{t('goals.title')}</h2>
                            <div className="group relative">
                                <Info className="w-5 h-5 text-gray-500 cursor-help" />
                                <div className="absolute right-0 top-6 w-64 p-3 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <p className="text-xs text-gray-300">
                                        {t('goals.infoTooltip')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">{t('goals.helpText')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {GOAL_IDS.map((goalId) => {
                                const Icon = GOAL_ICONS[goalId];
                                const color = GOAL_COLORS[goalId];
                                return (
                                <button
                                    key={goalId}
                                    onClick={() => updateData('goal', goalId)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left min-h-[160px] ${surveyData.goal === goalId
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-start gap-3 h-full">
                                        <div className="flex items-center justify-between w-full">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            {surveyData.goal === goalId && (
                                                <div className="w-5 h-5 rounded-full bg-afflyt-cyan-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold text-white mb-1">{t(`goals.${goalId}.title`)}</h3>
                                            <p className="text-xs text-gray-400 leading-relaxed">{t(`goals.${goalId}.description`)}</p>
                                        </div>
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                        {surveyData.goal && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg flex items-start gap-2"
                            >
                                <Lightbulb className="w-4 h-4 text-afflyt-cyan-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-300">
                                    {t(`goals.${surveyData.goal}.feedback`)}
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
                        <h2 className="text-xl font-bold text-white mb-1">{t('audienceSize.title')}</h2>
                        <p className="text-sm text-gray-400 mb-4">{t('audienceSize.helpText')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AUDIENCE_SIZE_IDS.map((sizeId) => (
                                <button
                                    key={sizeId}
                                    onClick={() => updateData('audienceSize', sizeId)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${surveyData.audienceSize === sizeId
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-white mb-1">{t(`audienceSize.${sizeId}.label`)}</h3>
                                            <p className="text-xs text-gray-400">{t(`audienceSize.${sizeId}.description`)}</p>
                                            <p className="text-xs text-afflyt-cyan-400 mt-1.5 font-mono">{AUDIENCE_SIZE_RANGES[sizeId]}</p>
                                        </div>
                                        {surveyData.audienceSize === sizeId && (
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
                        <h2 className="text-xl font-bold text-white mb-1">{t('experience.title')}</h2>
                        <p className="text-sm text-gray-400 mb-4">{t('experience.helpText')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {EXPERIENCE_IDS.map((levelId) => (
                                <button
                                    key={levelId}
                                    onClick={() => updateData('experienceLevel', levelId)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${surveyData.experienceLevel === levelId
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-start min-h-[140px]">
                                        <div className="flex items-center justify-between w-full mb-3">
                                            <h3 className="text-base font-semibold text-white">{t(`experience.${levelId}.label`)}</h3>
                                            {surveyData.experienceLevel === levelId && (
                                                <div className="w-5 h-5 rounded-full bg-afflyt-cyan-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">{t(`experience.${levelId}.description`)}</p>
                                        <p className="text-xs text-afflyt-cyan-400 mt-auto">{t(`experience.${levelId}.helpText`)}</p>
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
                        <h2 className="text-xl font-bold text-white mb-1">{t('channels.title')}</h2>
                        <p className="text-sm text-gray-400 mb-4">{t('channels.helpText')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            {CHANNEL_IDS.map((channelId) => {
                                const Icon = CHANNEL_ICONS[channelId];
                                return (
                                <button
                                    key={channelId}
                                    onClick={() => toggleChannel(channelId)}
                                    className={`p-4 rounded-xl border-2 transition-all ${surveyData.channels.includes(channelId)
                                        ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                                        : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-afflyt-cyan-500/50'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${surveyData.channels.includes(channelId)
                                            ? 'bg-afflyt-cyan-500'
                                            : 'bg-afflyt-dark-100'
                                            }`}>
                                            <Icon className={`w-6 h-6 ${surveyData.channels.includes(channelId)
                                                ? 'text-white'
                                                : 'text-gray-500'
                                                }`} />
                                        </div>
                                        <h3 className="text-base font-semibold text-white mb-0.5">{t(`channels.${channelId}.label`)}</h3>
                                        <p className="text-xs text-gray-400">{t(`channels.${channelId}.description`)}</p>
                                        {surveyData.channels.includes(channelId) && (
                                            <div className="mt-2 flex items-center justify-center gap-1 text-afflyt-cyan-400">
                                                <Check className="w-3 h-3" />
                                                <span className="text-xs font-medium">{t('selected')}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                        <div className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                            <p className="text-xs text-gray-300 mb-1">
                                <strong className="text-white">{t('channels.selectedChannels')}</strong> {surveyData.channels.length === 0 ? t('channels.none') : surveyData.channels.join(', ')}
                            </p>
                            <p className="text-xs text-gray-500">
                                {t('channels.configureNext')}
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
                                    {t('channels.singleChannelNote', { channel: surveyData.channels[0] })}
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
                                    {t('channels.multiChannelNote', { count: surveyData.channels.length })}
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
                    <span className="text-xs text-gray-400">{t('step', { current: step + 1, total: 5 })}</span>
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
                            {t('navigation.back')}
                        </CyberButton>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {onSkip && step === 0 && (
                        <CyberButton
                            variant="ghost"
                            onClick={onSkip}
                        >
                            {t('navigation.skip')}
                        </CyberButton>
                    )}

                    {step < 4 ? (
                        <CyberButton
                            variant="primary"
                            onClick={nextStep}
                            disabled={!isStepComplete()}
                            className="gap-2"
                        >
                            {step === 0 ? t('navigation.start') : t('navigation.continue')}
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
                            {t('navigation.startConfiguration')}
                        </CyberButton>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};
