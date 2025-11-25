'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    Trophy,
    Zap,
    TrendingUp,
    Send,
    Mail,
    MessageSquare,
    Target,
    Star,
    Lock,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface ProgressDashboardProps {
    progress: OnboardingProgress;
    onContinue: (nextStep: string) => void;
    hideStats?: boolean;
}

interface OnboardingProgress {
    welcomeSurveyCompleted: boolean;
    channelsSelected: string[];
    telegramSetupCompleted: boolean;
    emailSetupCompleted: boolean;
    discordSetupCompleted: boolean;
    firstAutomationCreated: boolean;
    goal?: string;
    audienceSize?: string;
    experienceLevel?: string;
    totalTimeSpent: number; // in seconds
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    unlocked: boolean;
    progress?: number;
}

export const ProgressDashboard = ({ progress, onContinue, hideStats = false }: ProgressDashboardProps) => {
    const [timeSpent, setTimeSpent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate completion percentage
    const steps = [
        progress.welcomeSurveyCompleted,
        progress.telegramSetupCompleted || progress.emailSetupCompleted || progress.discordSetupCompleted,
        progress.firstAutomationCreated
    ];
    const completedSteps = steps.filter(Boolean).length;
    const completionPercentage = Math.round((completedSteps / steps.length) * 100);

    // Determine next action
    const getNextAction = () => {
        if (!progress.welcomeSurveyCompleted) {
            return { step: 'welcome', label: 'Completa il benvenuto', icon: Sparkles };
        }

        const needsChannel = !progress.telegramSetupCompleted && !progress.emailSetupCompleted && !progress.discordSetupCompleted;
        if (needsChannel) {
            if (progress.channelsSelected.includes('telegram')) {
                return { step: 'telegram', label: 'Configura Telegram', icon: Send };
            }
            if (progress.channelsSelected.includes('email')) {
                return { step: 'email', label: 'Configura Email', icon: Mail };
            }
            if (progress.channelsSelected.includes('discord')) {
                return { step: 'discord', label: 'Configura Discord', icon: MessageSquare };
            }
        }

        if (!progress.firstAutomationCreated) {
            return { step: 'automation', label: 'Crea prima automazione', icon: Zap };
        }

        return { step: 'dashboard', label: 'Vai alla Dashboard', icon: TrendingUp };
    };

    const nextAction = getNextAction();

    // Achievements
    const achievements: Achievement[] = [
        {
            id: 'welcome',
            title: 'Primo Passo',
            description: 'Completato il questionario iniziale',
            icon: Sparkles,
            unlocked: progress.welcomeSurveyCompleted
        },
        {
            id: 'telegram',
            title: 'Telegram Master',
            description: 'Configurato canale Telegram',
            icon: Send,
            unlocked: progress.telegramSetupCompleted
        },
        {
            id: 'email',
            title: 'Email Pro',
            description: 'Configurato sistema email',
            icon: Mail,
            unlocked: progress.emailSetupCompleted
        },
        {
            id: 'automation',
            title: 'Automation Wizard',
            description: 'Creata la prima automazione',
            icon: Zap,
            unlocked: progress.firstAutomationCreated
        },
        {
            id: 'complete',
            title: 'Setup Completo',
            description: 'Onboarding completato al 100%',
            icon: Trophy,
            unlocked: completionPercentage === 100
        }
    ];

    const unlockedAchievements = achievements.filter(a => a.unlocked).length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Hero Stats */}
            {!hideStats && (
            <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-6 bg-gradient-to-br from-afflyt-cyan-500/10 to-afflyt-cyan-600/5 border-afflyt-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Completamento</span>
                        <TrendingUp className="w-4 h-4 text-afflyt-cyan-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{completionPercentage}%</div>
                    <div className="text-xs text-gray-500">{completedSteps}/{steps.length} passi</div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-afflyt-profit-500/10 to-afflyt-profit-600/5 border-afflyt-profit-500/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Achievement</span>
                        <Trophy className="w-4 h-4 text-afflyt-profit-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{unlockedAchievements}</div>
                    <div className="text-xs text-gray-500">/{achievements.length} sbloccati</div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-afflyt-plasma-500/10 to-afflyt-plasma-600/5 border-afflyt-plasma-500/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Tempo</span>
                        <Clock className="w-4 h-4 text-afflyt-plasma-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{formatTime(progress.totalTimeSpent + timeSpent)}</div>
                    <div className="text-xs text-gray-500">tempo speso</div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-afflyt-cyan-500/10 to-afflyt-plasma-500/5 border-afflyt-glass-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Canali</span>
                        <Target className="w-4 h-4 text-afflyt-cyan-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {[progress.telegramSetupCompleted, progress.emailSetupCompleted, progress.discordSetupCompleted].filter(Boolean).length}
                    </div>
                    <div className="text-xs text-gray-500">configurati</div>
                </GlassCard>
            </div>
            )}

            {/* Progress Bar Section */}
            <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Il Tuo Percorso</h2>
                        <p className="text-gray-400">
                            {completionPercentage === 100
                                ? 'Fantastico! Hai completato l\'onboarding'
                                : `Ancora ${steps.length - completedSteps} ${steps.length - completedSteps === 1 ? 'passo' : 'passi'} al completamento`}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-plasma-400">
                            {completionPercentage}%
                        </div>
                    </div>
                </div>

                <div className="relative h-4 bg-afflyt-dark-50 rounded-full overflow-hidden mb-4">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-afflyt-cyan-500 via-afflyt-profit-400 to-afflyt-plasma-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>

                {completionPercentage < 100 && (
                    <div className="mt-6 p-4 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center">
                                    <nextAction.icon className="w-5 h-5 text-afflyt-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Prossimo passo</p>
                                    <p className="text-xs text-gray-400">{nextAction.label}</p>
                                </div>
                            </div>
                            <CyberButton
                                variant="primary"
                                size="sm"
                                onClick={() => onContinue(nextAction.step)}
                                className="gap-2"
                            >
                                Continua
                                <ArrowRight className="w-4 h-4" />
                            </CyberButton>
                        </div>
                    </div>
                )}

                {completionPercentage === 100 && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-afflyt-profit-500/10 to-afflyt-cyan-500/10 border border-afflyt-profit-500/30 rounded-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-afflyt-profit-400 to-afflyt-cyan-500 flex items-center justify-center">
                                <Trophy className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-1">Onboarding Completato!</h3>
                                <p className="text-gray-300">Sei pronto per iniziare a guadagnare con le automazioni</p>
                            </div>
                        </div>
                        <CyberButton
                            variant="primary"
                            onClick={() => onContinue('dashboard')}
                            className="w-full justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Vai alla Dashboard
                        </CyberButton>
                    </div>
                )}
            </GlassCard>

            {/* Steps Checklist */}
            <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Checklist Setup</h3>
                <div className="space-y-3">
                    <StepItem
                        completed={progress.welcomeSurveyCompleted}
                        title="Benvenuto e Questionario"
                        description="Personalizza la tua esperienza"
                        icon={Sparkles}
                    />
                    <StepItem
                        completed={progress.telegramSetupCompleted}
                        title="Configura Telegram"
                        description="Collega il tuo canale o gruppo"
                        icon={Send}
                        optional={!progress.channelsSelected.includes('telegram')}
                    />
                    <StepItem
                        completed={progress.emailSetupCompleted}
                        title="Configura Email"
                        description="Setup provider e newsletter"
                        icon={Mail}
                        optional={!progress.channelsSelected.includes('email')}
                    />
                    <StepItem
                        completed={progress.discordSetupCompleted}
                        title="Configura Discord"
                        description="Connetti il tuo server"
                        icon={MessageSquare}
                        optional={!progress.channelsSelected.includes('discord')}
                    />
                    <StepItem
                        completed={progress.firstAutomationCreated}
                        title="Crea Prima Automazione"
                        description="Imposta filtri e inizia a pubblicare"
                        icon={Zap}
                    />
                </div>
            </GlassCard>

            {/* Achievements Grid */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Achievement</h3>
                    <span className="text-sm text-gray-400">
                        {unlockedAchievements}/{achievements.length} sbloccati
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {achievements.map((achievement) => (
                        <motion.div
                            key={achievement.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${achievement.unlocked
                                ? 'bg-gradient-to-br from-afflyt-profit-500/10 to-afflyt-cyan-500/10 border-afflyt-profit-500/30'
                                : 'bg-afflyt-dark-50 border-afflyt-glass-border opacity-50'
                                }`}
                        >
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${achievement.unlocked
                                ? 'bg-gradient-to-br from-afflyt-profit-400 to-afflyt-cyan-500'
                                : 'bg-afflyt-dark-100'
                                }`}>
                                {achievement.unlocked ? (
                                    <achievement.icon className="w-6 h-6 text-white" />
                                ) : (
                                    <Lock className="w-6 h-6 text-gray-600" />
                                )}
                            </div>
                            <h4 className={`text-sm font-semibold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-500'
                                }`}>
                                {achievement.title}
                            </h4>
                            <p className="text-xs text-gray-500">{achievement.description}</p>
                        </motion.div>
                    ))}
                </div>
            </GlassCard>

            {/* Personalized Insights */}
            {progress.welcomeSurveyCompleted && (
                <GlassCard className="p-6 bg-gradient-to-br from-afflyt-glass-white to-afflyt-glass-black border-afflyt-cyan-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
                            <Star className="w-5 h-5 text-afflyt-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">Profilo Personalizzato</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {progress.goal && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Obiettivo</p>
                                        <p className="text-sm text-white font-medium capitalize">{progress.goal}</p>
                                    </div>
                                )}
                                {progress.audienceSize && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Audience</p>
                                        <p className="text-sm text-white font-medium capitalize">{progress.audienceSize}</p>
                                    </div>
                                )}
                                {progress.experienceLevel && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Esperienza</p>
                                        <p className="text-sm text-white font-medium capitalize">{progress.experienceLevel}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};

interface StepItemProps {
    completed: boolean;
    title: string;
    description: string;
    icon: React.ElementType;
    optional?: boolean;
}

const StepItem = ({ completed, title, description, icon: Icon, optional }: StepItemProps) => {
    return (
        <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${completed
            ? 'bg-afflyt-profit-500/5 border-afflyt-profit-500/30'
            : 'bg-afflyt-dark-50 border-afflyt-glass-border'
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${completed
                ? 'bg-afflyt-profit-400/20'
                : 'bg-afflyt-dark-100'
                }`}>
                {completed ? (
                    <CheckCircle className="w-5 h-5 text-afflyt-profit-400" />
                ) : (
                    <Icon className="w-5 h-5 text-gray-500" />
                )}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${completed ? 'text-white' : 'text-gray-400'}`}>
                        {title}
                    </h4>
                    {optional && (
                        <span className="px-2 py-0.5 bg-afflyt-dark-100 rounded text-xs text-gray-500">
                            opzionale
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            {completed && (
                <div className="shrink-0">
                    <div className="px-3 py-1 bg-afflyt-profit-400/10 rounded-full text-xs text-afflyt-profit-400 font-medium">
                        Completato
                    </div>
                </div>
            )}
        </div>
    );
};
