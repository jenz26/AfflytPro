'use client';

import { useTranslations } from 'next-intl';
import {
    Send,
    Key,
    Zap,
    CheckCircle,
    ArrowRight,
    Info,
    Sparkles
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
                path: '/dashboard/settings/channels'
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
                path: '/dashboard/settings/credentials'
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

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">{t('configProgress')}</span>
                                <span className="text-sm font-mono text-afflyt-cyan-400">
                                    {completedSteps}/3 {t('completed')}
                                </span>
                            </div>
                            <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400 transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
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

                    return (
                        <div
                            key={step.id}
                            className={`relative ${step.completed ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-50'
                                }`}
                        >
                            {/* Connection Line */}
                            {index < steps.length - 1 && (
                                <div className={`hidden lg:block absolute top-12 left-full w-full h-0.5 -ml-3 z-0 ${step.completed ? 'bg-afflyt-cyan-400' : 'bg-gray-700'
                                    }`} />
                            )}

                            <GlassCard
                                className={`relative z-10 p-6 ${isActive
                                    ? 'border-afflyt-cyan-500/40 shadow-[0_0_30px_rgba(0,229,224,0.2)]'
                                    : step.completed
                                        ? 'border-afflyt-profit-400/30'
                                        : 'border-afflyt-glass-border'
                                    } transition-all duration-500`}
                            >
                                {/* Step Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Step Number/Check */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold ${step.completed
                                            ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400'
                                            : isActive
                                                ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400 animate-pulse'
                                                : 'bg-afflyt-dark-50 text-gray-600'
                                            }`}>
                                            {step.completed ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                step.id
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.completed
                                            ? 'bg-afflyt-profit-400/10'
                                            : isActive
                                                ? 'bg-afflyt-cyan-500/10'
                                                : 'bg-afflyt-dark-50'
                                            }`}>
                                            <step.icon className={`w-5 h-5 ${step.completed
                                                ? 'text-afflyt-profit-400'
                                                : isActive
                                                    ? 'text-afflyt-cyan-400'
                                                    : 'text-gray-600'
                                                }`} />
                                        </div>
                                    </div>

                                    {/* Time Badge */}
                                    {!step.completed && (
                                        <span className="px-2 py-1 bg-afflyt-dark-50 rounded text-xs text-gray-400">
                                            ~{step.estimatedTime}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {step.description}
                                </p>

                                {/* Details List */}
                                <div className="space-y-2 mb-4">
                                    {step.details.map((detail, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="text-afflyt-cyan-400 font-mono text-xs mt-0.5">
                                                {String(i + 1).padStart(2, '0')}.
                                            </span>
                                            <span className="text-xs text-gray-500">{detail}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Button */}
                                {!step.completed ? (
                                    <CyberButton
                                        variant={isActive ? 'primary' : 'secondary'}
                                        size="sm"
                                        className="w-full justify-center"
                                        disabled={!isActive}
                                        onClick={() => window.location.href = step.action.path}
                                    >
                                        {step.action.label}
                                        <ArrowRight className="w-4 h-4" />
                                    </CyberButton>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-2 text-afflyt-profit-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">{t('stepCompleted')}</span>
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    );
                })}
            </div>

            {/* Helper Box */}
            <div className="mt-6 p-4 bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-afflyt-cyan-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white mb-1">
                            {t('whyImportant')}
                        </p>
                        <p className="text-xs text-gray-400">
                            {t('whyImportantDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
