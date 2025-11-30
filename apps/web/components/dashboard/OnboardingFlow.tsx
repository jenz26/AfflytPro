'use client';

import { useTranslations } from 'next-intl';
import {
    Send,
    Key,
    Zap,
    CheckCircle,
    ArrowRight,
    Info,
    Sparkles,
    Lock,
    Circle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface OnboardingFlowProps {
    progress: {
        channelConnected: boolean;
        credentialsSet: boolean;
        automationCreated: boolean;
    };
    onProgressUpdate: (progress: any) => void;
}

export const OnboardingFlow = ({ progress, onProgressUpdate }: OnboardingFlowProps) => {
    const t = useTranslations('dashboard.onboarding');
    const tSteps = useTranslations('dashboard.onboarding.steps');

    const steps = [
        {
            id: 1,
            title: tSteps('connectChannel.title'),
            description: tSteps('connectChannel.description'),
            icon: Send,
            completed: progress.channelConnected,
            action: {
                label: tSteps('connectChannel.button'),
                path: '/settings/channels'
            },
            details: [
                tSteps('connectChannel.step1'),
                tSteps('connectChannel.step2'),
                tSteps('connectChannel.step3')
            ],
            estimatedTime: tSteps('connectChannel.time')
        },
        {
            id: 2,
            title: tSteps('credentials.title'),
            description: tSteps('credentials.description'),
            icon: Key,
            completed: progress.credentialsSet,
            action: {
                label: tSteps('credentials.button'),
                path: '/settings/api-keys'
            },
            details: [
                tSteps('credentials.step1'),
                tSteps('credentials.step2'),
                tSteps('credentials.step3')
            ],
            estimatedTime: tSteps('credentials.time')
        },
        {
            id: 3,
            title: tSteps('automation.title'),
            description: tSteps('automation.description'),
            icon: Zap,
            completed: progress.automationCreated,
            action: {
                label: tSteps('automation.button'),
                path: '/dashboard/automations'
            },
            details: [
                tSteps('automation.step1'),
                tSteps('automation.step2'),
                tSteps('automation.step3')
            ],
            estimatedTime: tSteps('automation.time')
        }
    ];

    const completedSteps = Object.values(progress).filter(Boolean).length;
    const progressPercentage = (completedSteps / 3) * 100;

    return (
        <div className="mb-8">
            {/* Welcome Hero */}
            <GlassCard className="p-8 mb-6 border-afflyt-cyan-500/30 bg-gradient-to-r from-afflyt-cyan-500/5 to-afflyt-plasma-500/5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-afflyt-dark-100" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {t('welcome')}
                                </h2>
                                <p className="text-gray-400 mt-1">
                                    {t('completeSetup')}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar with Milestones */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">{t('configProgress')}</span>
                                <span className="text-sm font-mono text-afflyt-cyan-400">
                                    {completedSteps}/3 {t('completed')}
                                </span>
                            </div>
                            <div className="relative">
                                {/* Background track */}
                                <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
                                    {/* Animated gradient fill with shimmer */}
                                    <div
                                        className="h-full bg-gradient-to-r from-afflyt-cyan-500 via-blue-500 to-afflyt-cyan-400 rounded-full relative overflow-hidden transition-all duration-700 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
                                             style={{ transform: 'translateX(-100%)', animation: 'shimmer 2s infinite' }} />
                                    </div>
                                </div>

                                {/* Milestone dots */}
                                <div className="absolute inset-0 flex justify-between items-center">
                                    {[0, 1, 2].map((milestone) => (
                                        <div
                                            key={milestone}
                                            className={`w-4 h-4 rounded-full border-2 border-afflyt-dark-100 transition-all duration-300 ${
                                                milestone < completedSteps
                                                    ? 'bg-afflyt-cyan-400 shadow-[0_0_8px_rgba(0,229,224,0.5)]'
                                                    : milestone === completedSteps
                                                        ? 'bg-afflyt-cyan-400/50 animate-pulse'
                                                        : 'bg-gray-600'
                                            }`}
                                            style={{
                                                marginLeft: milestone === 0 ? '-2px' : '0',
                                                marginRight: milestone === 2 ? '-2px' : '0'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                {t('estimatedTime', { minutes: 10 - (completedSteps * 3) })}
                            </p>
                        </div>
                    </div>

                    {/* Value Proposition */}
                    <div className="ml-8 p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                        <h3 className="text-sm font-medium text-afflyt-cyan-300 mb-3">
                            {t('whatYouGet')}
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-afflyt-profit-400 mt-0.5" />
                                <span>{t('benefit1')}</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-afflyt-profit-400 mt-0.5" />
                                <span>{t('benefit2')}</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle className="w-4 h-4 text-afflyt-profit-400 mt-0.5" />
                                <span>{t('benefit3')}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </GlassCard>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {steps.map((step, index) => {
                        const isActive = !step.completed &&
                            (index === 0 || steps[index - 1].completed);
                        const isLocked = !step.completed && !isActive;

                        return (
                            <div
                                key={step.id}
                                className={`transition-all duration-500 ${
                                    step.completed ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-60'
                                }`}
                            >
                                <GlassCard
                                className={`relative z-10 p-6 transition-all duration-500 ${
                                    isActive
                                        ? 'border-2 border-afflyt-cyan-500/60 shadow-[0_0_40px_rgba(0,229,224,0.25)] bg-afflyt-cyan-500/5'
                                        : step.completed
                                            ? 'border-afflyt-profit-400/40 bg-afflyt-profit-400/5'
                                            : 'border-gray-700/50 bg-gray-900/30'
                                }`}
                            >
                                {/* Completed Badge Overlay */}
                                {step.completed && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 bg-afflyt-profit-400 rounded-full flex items-center justify-center shadow-lg shadow-afflyt-profit-400/30">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Locked Badge Overlay */}
                                {isLocked && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                                            <Lock className="w-3 h-3 text-gray-500" />
                                        </div>
                                    </div>
                                )}

                                {/* Step Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Step Number/Check */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold transition-all duration-300 ${
                                            step.completed
                                                ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400 ring-2 ring-afflyt-profit-400/30'
                                                : isActive
                                                    ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400 ring-2 ring-afflyt-cyan-500/50 animate-pulse'
                                                    : 'bg-gray-800 text-gray-600'
                                        }`}>
                                            {step.completed ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : isLocked ? (
                                                <Lock className="w-4 h-4" />
                                            ) : (
                                                step.id
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                            step.completed
                                                ? 'bg-afflyt-profit-400/10'
                                                : isActive
                                                    ? 'bg-afflyt-cyan-500/10'
                                                    : 'bg-gray-800/50'
                                        }`}>
                                            <step.icon className={`w-5 h-5 transition-colors duration-300 ${
                                                step.completed
                                                    ? 'text-afflyt-profit-400'
                                                    : isActive
                                                        ? 'text-afflyt-cyan-400'
                                                        : 'text-gray-600'
                                            }`} />
                                        </div>
                                    </div>

                                    {/* Time Badge */}
                                    {!step.completed && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            isActive
                                                ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400'
                                                : 'bg-gray-800 text-gray-500'
                                        }`}>
                                            ~{step.estimatedTime}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                                    isLocked ? 'text-gray-500' : 'text-white'
                                }`}>
                                    {step.title}
                                </h3>
                                <p className={`text-sm mb-4 transition-colors duration-300 ${
                                    isLocked ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                    {step.description}
                                </p>

                                {/* Details List */}
                                <div className="space-y-2 mb-4">
                                    {step.details.map((detail, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className={`font-mono text-xs mt-0.5 transition-colors duration-300 ${
                                                step.completed
                                                    ? 'text-afflyt-profit-400'
                                                    : isActive
                                                        ? 'text-afflyt-cyan-400'
                                                        : 'text-gray-700'
                                            }`}>
                                                {String(i + 1).padStart(2, '0')}.
                                            </span>
                                            <span className={`text-xs transition-colors duration-300 ${
                                                isLocked ? 'text-gray-600' : 'text-gray-500'
                                            }`}>{detail}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Button */}
                                {step.completed ? (
                                    <div className="flex items-center justify-center gap-2 py-2.5 bg-afflyt-profit-400/10 rounded-lg border border-afflyt-profit-400/30">
                                        <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                        <span className="text-sm font-medium text-afflyt-profit-400">{t('stepCompleted')}</span>
                                    </div>
                                ) : isLocked ? (
                                    <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <Lock className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-500">{t('completePreviousStep')}</span>
                                    </div>
                                ) : (
                                    <CyberButton
                                        variant="primary"
                                        size="sm"
                                        className="w-full justify-center"
                                        onClick={() => window.location.href = step.action.path}
                                    >
                                        {step.action.label}
                                        <ArrowRight className="w-4 h-4" />
                                    </CyberButton>
                                )}
                            </GlassCard>
                        </div>
                    );
                })}
            </div>

            {/* Actionable Next Steps Card */}
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/5 to-afflyt-cyan-500/5 rounded-xl border border-blue-500/20">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Info className="w-5 h-5 text-blue-400" />
                    </div>

                    <div className="flex-1">
                        <h4 className="text-white font-semibold mb-2">
                            {t('whyImportant')}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {t('whyImportantDesc')}
                        </p>

                        {/* Progress Checklist */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                {progress.channelConnected ? (
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-600" />
                                )}
                                <span className={progress.channelConnected ? 'text-gray-300' : 'text-gray-500'}>
                                    {t('checklistChannels')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                {progress.credentialsSet ? (
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-600" />
                                )}
                                <span className={progress.credentialsSet ? 'text-gray-300' : 'text-gray-500'}>
                                    {t('checklistCredentials')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                {progress.automationCreated ? (
                                    <CheckCircle className="w-4 h-4 text-afflyt-profit-400" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-600" />
                                )}
                                <span className={progress.automationCreated ? 'text-gray-300' : 'text-gray-500'}>
                                    {t('checklistAutomation')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
