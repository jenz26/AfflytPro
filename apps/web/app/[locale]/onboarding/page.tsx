'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    WelcomeFlow,
    TelegramSetup,
    EmailSetup,
    FirstAutomation,
    ProgressDashboard,
    OnboardingLayout,
    ProgressTracker,
    ContextPreview
} from '@/components/onboarding';
import { API_BASE } from '@/lib/api/config';

type OnboardingStep = 'welcome' | 'telegram' | 'email' | 'automation' | 'complete';

interface SurveyData {
    goal: string | null;
    audienceSize: string | null;
    experienceLevel: string | null;
    channels: string[];
}

export default function OnboardingPage() {
    const router = useRouter();
    const locale = useLocale();
    const tErrors = useTranslations('onboarding.errors');
    const tSteps = useTranslations('onboarding.steps');
    const tComplete = useTranslations('onboarding.complete');
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [progress, setProgress] = useState({
        welcomeSurveyCompleted: false,
        channelsSelected: [] as string[],
        telegramSetupCompleted: false,
        emailSetupCompleted: false,
        discordSetupCompleted: false,
        firstAutomationCreated: false,
        totalTimeSpent: 0
    });

    const handleWelcomeComplete = (data: SurveyData) => {
        console.log('Survey completed:', data);
        setSurveyData(data);
        setSelectedChannels(data.channels);
        setProgress(prev => ({
            ...prev,
            welcomeSurveyCompleted: true,
            channelsSelected: data.channels,
            goal: data.goal,
            audienceSize: data.audienceSize,
            experienceLevel: data.experienceLevel
        }));

        // Navigate to first selected channel or automation
        if (data.channels.includes('telegram')) {
            setCurrentStep('telegram');
        } else if (data.channels.includes('email')) {
            setCurrentStep('email');
        } else {
            setCurrentStep('automation');
        }
    };

    const handleTelegramComplete = async (data: any) => {
        console.log('Telegram setup completed:', data);

        try {
            // 1. Save bot token as Credential
            const token = localStorage.getItem('token');
            const credentialResponse = await fetch('${API_BASE}/user/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    provider: 'TELEGRAM_BOT',
                    key: data.botToken,
                    label: `@${data.botInfo.username}`
                })
            });

            if (!credentialResponse.ok) {
                const errorData = await credentialResponse.json().catch(() => ({}));
                console.error('Credential save failed:', errorData);
                throw new Error(errorData.message || 'Failed to save bot token');
            }

            const credentialData = await credentialResponse.json();

            // 2. Create Channel linked to the credential
            const channelResponse = await fetch('${API_BASE}/user/channels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    name: data.channelName || `Telegram - ${data.channelId}`, // Use friendly name
                    platform: 'TELEGRAM',
                    channelId: data.channelId,
                    credentialId: credentialData.id
                })
            });

            if (!channelResponse.ok) {
                throw new Error('Failed to save channel');
            }

            console.log('Telegram channel saved successfully!');
            setProgress(prev => ({ ...prev, telegramSetupCompleted: true }));

            // Check if email is next
            if (selectedChannels.includes('email')) {
                setCurrentStep('email');
            } else {
                setCurrentStep('automation');
            }
        } catch (error) {
            console.error('Error saving Telegram config:', error);
            alert(tErrors('telegramSaveFailed'));
        }
    };

    const handleEmailComplete = async (data: any) => {
        console.log('Email setup completed:', data);

        try {
            // 1. Save API key as Credential
            const token = localStorage.getItem('token');
            const credentialResponse = await fetch('${API_BASE}/user/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    provider: data.provider.toUpperCase(), // SENDGRID or RESEND
                    key: data.apiKey,
                    label: `${data.provider} - ${data.senderEmail}`
                })
            });

            if (!credentialResponse.ok) {
                const errorData = await credentialResponse.json().catch(() => ({}));
                console.error('Email credential save failed:', errorData);
                throw new Error(errorData.message || 'Failed to save email API key');
            }

            const credentialData = await credentialResponse.json();

            // 2. Create Channel for email
            const channelResponse = await fetch('${API_BASE}/user/channels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    name: `Email - ${data.senderName}`,
                    platform: 'EMAIL',
                    channelId: data.senderEmail,
                    credentialId: credentialData.id
                })
            });

            if (!channelResponse.ok) {
                throw new Error('Failed to save email channel');
            }

            console.log('Email channel saved successfully!');
            setProgress(prev => ({ ...prev, emailSetupCompleted: true }));
            setCurrentStep('automation');
        } catch (error) {
            console.error('Error saving Email config:', error);
            alert(tErrors('emailSaveFailed'));
        }
    };

    const handleAutomationComplete = (automationId: string) => {
        console.log('Automation created:', automationId);
        setProgress(prev => ({ ...prev, firstAutomationCreated: true }));
        setCurrentStep('complete');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            router.push(`/${locale}/dashboard`);
        }, 2000);
    };

    const handleSkipChannel = () => {
        // Skip to next step
        if (currentStep === 'telegram') {
            if (selectedChannels.includes('email')) {
                setCurrentStep('email');
            } else {
                setCurrentStep('automation');
            }
        } else if (currentStep === 'email') {
            setCurrentStep('automation');
        }
    };

    const handleSkipAutomation = () => {
        router.push(`/${locale}/dashboard`);
    };

    // Helper to generate steps for ProgressTracker
    const getProgressSteps = () => {
        const steps = [
            {
                id: 'welcome',
                label: tSteps('welcome.label'),
                description: tSteps('welcome.description'),
                completed: progress.welcomeSurveyCompleted,
                current: currentStep === 'welcome',
                locked: false
            },
            {
                id: 'channels',
                label: tSteps('channels.label'),
                description: tSteps('channels.description'),
                completed: progress.telegramSetupCompleted || progress.emailSetupCompleted,
                current: currentStep === 'telegram' || currentStep === 'email',
                locked: !progress.welcomeSurveyCompleted
            },
            {
                id: 'automation',
                label: tSteps('automation.label'),
                description: tSteps('automation.description'),
                completed: progress.firstAutomationCreated,
                current: currentStep === 'automation',
                locked: !progress.welcomeSurveyCompleted
            }
        ];
        return steps;
    };

    // Get current step number
    const getCurrentStepNumber = () => {
        const stepMap = { welcome: 1, telegram: 2, email: 2, automation: 3, complete: 3 };
        return stepMap[currentStep] || 1;
    };

    // Handle step navigation from ProgressTracker
    const handleStepNavigation = (stepId: string) => {
        if (stepId === 'welcome' && progress.welcomeSurveyCompleted) {
            setCurrentStep('welcome');
        }
        // Add more navigation logic as needed
    };

    // Get context for preview
    const getPreviewContext = (): 'welcome' | 'telegram' | 'email' | 'automation' => {
        if (currentStep === 'complete') return 'automation';
        return currentStep as 'welcome' | 'telegram' | 'email' | 'automation';
    };

    // Don't use layout for complete step
    if (currentStep === 'complete') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-afflyt-dark-100 to-afflyt-dark-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        {tComplete('title')}
                    </h1>
                    <p className="text-xl text-gray-300 mb-8">
                        {tComplete('subtitle')}
                        <br />
                        {tComplete('redirecting')}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-afflyt-cyan-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-afflyt-cyan-400 rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-afflyt-cyan-400 rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <OnboardingLayout
            currentStep={getCurrentStepNumber()}
            totalSteps={3}
            onExit={() => router.push(`/${locale}/dashboard`)}
            leftSidebar={
                <ProgressTracker
                    steps={getProgressSteps()}
                    onStepClick={handleStepNavigation}
                />
            }
            rightPreview={
                <ContextPreview
                    context={getPreviewContext()}
                    data={surveyData}
                />
            }
        >
            {currentStep === 'welcome' && (
                <WelcomeFlow
                    onComplete={handleWelcomeComplete}
                    onSkip={() => router.push(`/${locale}/dashboard`)}
                />
            )}

            {currentStep === 'telegram' && (
                <TelegramSetup
                    onComplete={handleTelegramComplete}
                    onSkip={handleSkipChannel}
                />
            )}

            {currentStep === 'email' && (
                <EmailSetup
                    onComplete={handleEmailComplete}
                    onSkip={handleSkipChannel}
                />
            )}

            {currentStep === 'automation' && (
                <FirstAutomation
                    onComplete={handleAutomationComplete}
                    onSkip={handleSkipAutomation}
                />
            )}
        </OnboardingLayout>
    );
}

// Helper function to determine completed steps
function getCompletedSteps(currentStep: OnboardingStep): string[] {
    const steps = ['welcome', 'telegram', 'email', 'automation', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    return steps.slice(0, currentIndex);
}
