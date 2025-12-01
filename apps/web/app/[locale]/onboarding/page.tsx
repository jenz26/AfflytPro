'use client';

import { useState, useEffect } from 'react';
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
import { Analytics } from '@/components/analytics/PostHogProvider';

type OnboardingStep = 'welcome' | 'telegram' | 'email' | 'automation' | 'complete';

interface SurveyData {
    goal: string | null;
    audienceSize: string | null;
    experienceLevel: string | null;
    hasAmazonAssociates: boolean | null;
    channels: string[];
}

// Helper to load/save onboarding state from localStorage
const ONBOARDING_STATE_KEY = 'onboarding_state';

interface OnboardingState {
    currentStep: OnboardingStep;
    surveyData: SurveyData | null;
    selectedChannels: string[];
    progress: {
        welcomeSurveyCompleted: boolean;
        channelsSelected: string[];
        telegramSetupCompleted: boolean;
        emailSetupCompleted: boolean;
        discordSetupCompleted: boolean;
        firstAutomationCreated: boolean;
        totalTimeSpent: number;
    };
}

const loadOnboardingState = (): OnboardingState | null => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(ONBOARDING_STATE_KEY);
        if (saved && saved !== 'undefined' && saved !== 'null') {
            const parsed = JSON.parse(saved);
            // Validate structure
            if (parsed && typeof parsed === 'object' && 'currentStep' in parsed) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load onboarding state:', e);
        // Clear corrupted data
        try {
            localStorage.removeItem(ONBOARDING_STATE_KEY);
        } catch {}
    }
    return null;
};

const saveOnboardingState = (state: OnboardingState) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save onboarding state:', e);
    }
};

const clearOnboardingState = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ONBOARDING_STATE_KEY);
};

// Persona type determination - mirrors backend logic
type PersonaType = 'beginner' | 'creator' | 'power_user' | 'monetizer';

const calculatePersonaType = (data: SurveyData): PersonaType => {
    const exp = data.experienceLevel;
    const audience = data.audienceSize;
    const goal = data.goal;
    const hasAmazon = data.hasAmazonAssociates ?? false;

    // 1. MONETIZER: goal=monetize + has audience (not starting)
    if (goal === 'monetize' && audience !== 'starting') {
        return 'monetizer';
    }

    // 2. POWER_USER: advanced experience + has Amazon Associates
    if (exp === 'advanced' && hasAmazon) {
        return 'power_user';
    }

    // 3. CREATOR: intermediate experience + has some audience (small/medium)
    if (exp === 'intermediate' && (audience === 'small' || audience === 'medium')) {
        return 'creator';
    }

    // 4. BEGINNER: default for everyone else
    return 'beginner';
};

// Get personalized step order based on persona
const getPersonalizedStepFlow = (persona: PersonaType, channels: string[], hasAmazonAssociates: boolean): OnboardingStep[] => {
    const steps: OnboardingStep[] = ['welcome'];

    // Add channel setup steps based on selection
    if (channels.includes('telegram')) steps.push('telegram');
    if (channels.includes('email')) steps.push('email');

    // Always end with automation
    steps.push('automation');
    steps.push('complete');

    return steps;
};

export default function OnboardingPage() {
    const router = useRouter();
    const locale = useLocale();
    const tErrors = useTranslations('onboarding.errors');
    const tSteps = useTranslations('onboarding.steps');
    const tComplete = useTranslations('onboarding.complete');

    // Load saved state on mount
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [personaType, setPersonaType] = useState<PersonaType | null>(null);
    const [progress, setProgress] = useState({
        welcomeSurveyCompleted: false,
        channelsSelected: [] as string[],
        telegramSetupCompleted: false,
        emailSetupCompleted: false,
        discordSetupCompleted: false,
        firstAutomationCreated: false,
        totalTimeSpent: 0
    });

    // Load saved state on mount
    useEffect(() => {
        const savedState = loadOnboardingState();
        if (savedState) {
            // Handle legacy state with 'plan' step - redirect to telegram
            let step = savedState.currentStep;
            if (step === 'plan' as any) {
                step = savedState.selectedChannels?.includes('telegram') ? 'telegram' : 'automation';
            }
            setCurrentStep(step);
            setSurveyData(savedState.surveyData);
            setSelectedChannels(savedState.selectedChannels);
            setProgress(savedState.progress);
        }
        setIsInitialized(true);
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        if (!isInitialized) return;
        saveOnboardingState({
            currentStep,
            surveyData,
            selectedChannels,
            progress
        });
    }, [isInitialized, currentStep, surveyData, selectedChannels, progress]);

    // Track onboarding step changes
    useEffect(() => {
        if (!isInitialized) return;
        const stepIndex = ['welcome', 'telegram', 'email', 'automation', 'complete'].indexOf(currentStep);
        Analytics.trackOnboardingStep(stepIndex + 1, currentStep);

        // Track completion
        if (currentStep === 'complete') {
            Analytics.trackOnboardingCompleted();
        }
    }, [isInitialized, currentStep]);

    const handleWelcomeComplete = async (data: SurveyData) => {
        console.log('Survey completed:', data);
        setSurveyData(data);
        setSelectedChannels(data.channels);

        // Calculate and set persona type
        const persona = calculatePersonaType(data);
        setPersonaType(persona);
        console.log('Calculated persona:', persona);

        setProgress(prev => ({
            ...prev,
            welcomeSurveyCompleted: true,
            channelsSelected: data.channels,
            goal: data.goal,
            audienceSize: data.audienceSize,
            experienceLevel: data.experienceLevel
        }));

        // Save persona to API (async, don't block navigation)
        try {
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API_BASE}/auth/persona`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        experienceLevel: data.experienceLevel,
                        audienceSize: data.audienceSize,
                        primaryGoal: data.goal,
                        preferredChannels: data.channels,
                        hasAmazonAssociates: data.hasAmazonAssociates ?? false
                    })
                }).then(response => {
                    if (response.ok) {
                        console.log('Persona saved successfully');
                    } else {
                        console.error('Failed to save persona');
                    }
                }).catch(error => {
                    console.error('Error saving persona:', error);
                });
            }
        } catch (error) {
            console.error('Error initiating persona save:', error);
        }

        // Go directly to channel setup (skip plan selection)
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
            const credentialResponse = await fetch(`${API_BASE}/user/credentials`, {
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
            const channelResponse = await fetch(`${API_BASE}/user/channels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    name: data.channelName || `Telegram - ${data.channelId}`,
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
            const credentialResponse = await fetch(`${API_BASE}/user/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    provider: data.provider.toUpperCase(),
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
            const channelResponse = await fetch(`${API_BASE}/user/channels`, {
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

        // Mark onboarding as completed and clear saved state
        if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_completed', 'true');
            clearOnboardingState();

            // Mark onboarding as completed in API
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API_BASE}/auth/persona`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        onboardingCompleted: true
                    })
                }).catch(error => {
                    console.error('Error marking onboarding as completed:', error);
                });
            }
        }

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
        // Mark onboarding as completed even when skipping and clear saved state
        if (typeof window !== 'undefined') {
            localStorage.setItem('onboarding_completed', 'true');

            // Mark onboarding as completed in API
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API_BASE}/auth/persona`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        onboardingCompleted: true
                    })
                }).catch(error => {
                    console.error('Error marking onboarding as completed:', error);
                });
            }
            clearOnboardingState();
        }
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
        const stepMap: Record<OnboardingStep, number> = {
            welcome: 1,
            telegram: 2,
            email: 2,
            automation: 3,
            complete: 3
        };
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

    // Loading state while restoring saved progress
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-afflyt-dark-100 to-afflyt-dark-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

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
