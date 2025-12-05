'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Rocket, ChevronRight, ChevronLeft, X, Sparkles,
    Target, Filter, Gauge, Send, CheckCircle, Clock, Wand2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { StepIndicator } from './wizard/StepIndicator';
import { Step1Mission } from './wizard/Step1Mission';
import { Step2Categories } from './wizard/Step2Categories';
import { Step3Filters } from './wizard/Step3Filters';
import { Step4Quality } from './wizard/Step4Quality';
import { Step4Schedule } from './wizard/Step4Schedule';
import { Step5Destination } from './wizard/Step5Destination';
import { Step6Copy } from './wizard/Step6Copy';
import { Step7Review } from './wizard/Step7Review';
import { API_BASE } from '@/lib/api/config';
import { Analytics } from '@/components/analytics/PostHogProvider';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface MissionConfig {
    // Step 1: Basic Info
    name: string;
    description: string;

    // Step 2: Categories + Deal Mode
    categories: string[];
    dealPublishMode: 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH';

    // Step 3: Filters (PRO/BUSINESS)
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    minRating?: number;
    minReviews?: number;
    maxSalesRank?: number;
    amazonOnly: boolean;
    fbaOnly: boolean;
    hasCoupon: boolean;
    primeOnly: boolean;
    brandInclude: string[];
    brandExclude: string[];
    listedAfter?: string;

    // Step 3b: Quality Score
    minScore: number;

    // Step 4: Schedule
    schedulePreset: 'relaxed' | 'active' | 'intensive' | 'custom';
    publishingMode: 'smart' | 'immediate';
    intervalMinutes?: number;
    dealsPerRun?: number;

    // Step 5: Destination
    channelId: string;
    showKeepaButton: boolean;

    // Step 6: Copy Mode (LLM)
    copyMode: 'TEMPLATE' | 'LLM';
    messageTemplate?: string;
    customStylePrompt?: string;
    llmModel: string;

    // Activation
    isActive: boolean;
}

export interface WizardConfig {
    categories: Array<{
        id: string;
        name: string;
        nameEN: string;
        isGated: boolean;
        avgDiscount: string;
        priceRange: string;
        competition: string;
    }>;
    planLimits: {
        plan: string;
        maxCategories: number;
        maxResultsPerRun: number;
        frequency: string;
        frequencyLabel: string;
        allowedFilters: string[];
    };
    filterTiers: {
        FREE: string[];
        PRO: string[];
        BUSINESS: string[];
    };
    scorePresets: Array<{
        value: number;
        label: string;
        labelIT: string;
        recommended?: boolean;
    }>;
}

interface CreateMissionWizardProps {
    onComplete: (mission: MissionConfig) => void;
    onCancel: () => void;
    editingMission?: MissionConfig & { id: string } | null;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialMissionConfig: MissionConfig = {
    // Step 1
    name: '',
    description: '',
    // Step 2
    categories: [],
    dealPublishMode: 'DISCOUNTED_ONLY',
    // Step 3
    minPrice: undefined,
    maxPrice: undefined,
    minDiscount: undefined,
    minRating: undefined,
    minReviews: undefined,
    maxSalesRank: undefined,
    amazonOnly: false,
    fbaOnly: false,
    hasCoupon: false,
    primeOnly: false,
    brandInclude: [],
    brandExclude: [],
    listedAfter: undefined,
    minScore: 35,
    // Step 4
    schedulePreset: 'active',
    publishingMode: 'smart',
    intervalMinutes: 120,
    dealsPerRun: 3,
    // Step 5
    channelId: '',
    showKeepaButton: true,
    // Step 6
    copyMode: 'TEMPLATE',
    messageTemplate: undefined,
    customStylePrompt: undefined,
    llmModel: 'gpt-4o-mini',
    // Activation
    isActive: true,
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CreateMissionWizard({
    onComplete,
    onCancel,
    editingMission
}: CreateMissionWizardProps) {
    const t = useTranslations('automations.wizard');
    const [currentStep, setCurrentStep] = useState(1);
    const [mission, setMission] = useState<MissionConfig>(
        editingMission || initialMissionConfig
    );
    const [wizardConfig, setWizardConfig] = useState<WizardConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ═══════════════════════════════════════════════════════════════
    // FETCH WIZARD CONFIG
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/automation/wizard-config`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setWizardConfig(data);
                } else {
                    throw new Error('Failed to load wizard configuration');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();

        // Track wizard opened
        Analytics.track('automation_wizard_opened', {
            is_edit: !!editingMission,
        });
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // STEP CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    const steps = [
        {
            id: 1,
            icon: Rocket,
            title: t('steps.mission.title'),
            description: t('steps.mission.description'),
        },
        {
            id: 2,
            icon: Target,
            title: t('steps.categories.title'),
            description: t('steps.categories.description'),
        },
        {
            id: 3,
            icon: Filter,
            title: t('steps.filters.title'),
            description: t('steps.filters.description'),
        },
        {
            id: 4,
            icon: Clock,
            title: t('steps.schedule.title'),
            description: t('steps.schedule.description'),
        },
        {
            id: 5,
            icon: Send,
            title: t('steps.destination.title'),
            description: t('steps.destination.description'),
        },
        {
            id: 6,
            icon: Wand2,
            title: t('steps.copy.title'),
            description: t('steps.copy.description'),
        },
        {
            id: 7,
            icon: CheckCircle,
            title: t('steps.review.title'),
            description: t('steps.review.description'),
        },
    ];

    // ═══════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1:
                return mission.name.trim().length >= 3;
            case 2:
                return mission.categories.length >= 1;
            case 3:
                return mission.minScore >= 0 && mission.minScore <= 100; // Filters + minScore
            case 4:
                return !!mission.schedulePreset; // Schedule must be selected
            case 5:
                return true; // Channel is optional (testing mode)
            case 6:
                return !!mission.copyMode; // Copy mode must be selected
            case 7:
                return true; // Review step
            default:
                return false;
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleNext = () => {
        if (currentStep < steps.length && canProceed()) {
            // Track step completion
            Analytics.track('automation_wizard_step_completed', {
                step: currentStep,
                step_name: steps[currentStep - 1]?.title || `Step ${currentStep}`,
                categories_count: mission.categories.length,
            });
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async (activate: boolean) => {
        setIsSubmitting(true);
        try {
            // Track wizard completion
            Analytics.track('automation_wizard_completed', {
                is_edit: !!editingMission,
                categories_count: mission.categories.length,
                min_score: mission.minScore,
                has_channel: !!mission.channelId,
                copy_mode: mission.copyMode,
                activate_immediately: activate,
            });
            await onComplete({ ...mission, isActive: activate });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Track wizard abandoned
        Analytics.track('automation_wizard_abandoned', {
            step: currentStep,
            step_name: steps[currentStep - 1]?.title || `Step ${currentStep}`,
            is_edit: !!editingMission,
        });
        onCancel();
    };

    const updateMission = (updates: Partial<MissionConfig>) => {
        setMission(prev => ({ ...prev, ...updates }));
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER STEP CONTENT
    // ═══════════════════════════════════════════════════════════════

    const renderStepContent = () => {
        if (!wizardConfig) return null;

        switch (currentStep) {
            case 1:
                return (
                    <Step1Mission
                        name={mission.name}
                        description={mission.description}
                        onChange={updateMission}
                    />
                );
            case 2:
                return (
                    <Step2Categories
                        selected={mission.categories}
                        categories={wizardConfig.categories}
                        maxCategories={wizardConfig.planLimits.maxCategories}
                        dealPublishMode={mission.dealPublishMode}
                        onChange={(categories) => updateMission({ categories })}
                        onDealModeChange={(dealPublishMode) => updateMission({ dealPublishMode })}
                    />
                );
            case 3:
                return (
                    <div className="space-y-8">
                        <Step4Quality
                            minScore={mission.minScore}
                            presets={wizardConfig.scorePresets}
                            onChange={(minScore) => updateMission({ minScore })}
                        />
                        <Step3Filters
                            mission={mission}
                            userPlan={wizardConfig.planLimits.plan}
                            filterTiers={wizardConfig.filterTiers}
                            onChange={updateMission}
                        />
                    </div>
                );
            case 4:
                return (
                    <Step4Schedule
                        schedulePreset={mission.schedulePreset}
                        publishingMode={mission.publishingMode}
                        intervalMinutes={mission.intervalMinutes}
                        dealsPerRun={mission.dealsPerRun}
                        userPlan={wizardConfig.planLimits.plan}
                        onChange={(updates) => updateMission(updates)}
                    />
                );
            case 5:
                return (
                    <Step5Destination
                        channelId={mission.channelId}
                        showKeepaButton={mission.showKeepaButton}
                        onChange={(channelId) => updateMission({ channelId })}
                        onKeepaButtonChange={(showKeepaButton) => updateMission({ showKeepaButton })}
                    />
                );
            case 6:
                return (
                    <Step6Copy
                        copyMode={mission.copyMode}
                        llmModel={mission.llmModel as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo'}
                        customStylePrompt={mission.customStylePrompt || ''}
                        userPlan={wizardConfig.planLimits.plan}
                        onChange={(updates) => updateMission(updates)}
                    />
                );
            case 7:
                return (
                    <Step7Review
                        mission={mission}
                        wizardConfig={wizardConfig}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        isEditing={!!editingMission}
                    />
                );
            default:
                return null;
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // LOADING STATE
    // ═══════════════════════════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <div className="relative">
                    <div className="animate-spin w-12 h-12 border-4 border-afflyt-cyan-500 border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancel} />
                <GlassCard className="relative p-8 max-w-md text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <CyberButton variant="secondary" onClick={handleCancel}>
                        {t('cancel')}
                    </CyberButton>
                </GlassCard>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-afflyt-dark-50 border border-afflyt-glass-border rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Progress Bar */}
                <div className="relative h-1 bg-afflyt-dark-100">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600 transition-all duration-500"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="p-6 border-b border-afflyt-glass-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-afflyt-dark-100" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {editingMission ? t('titleEdit') : t('title')}
                                </h2>
                                <p className="text-sm text-gray-400">{t('subtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <StepIndicator steps={steps} currentStep={currentStep} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderStepContent()}
                </div>

                {/* Footer Navigation */}
                {currentStep < steps.length && (
                    <div className="p-6 border-t border-afflyt-glass-border flex items-center justify-between">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {t('cancel')}
                        </button>

                        <div className="flex gap-3">
                            {currentStep > 1 && (
                                <CyberButton variant="ghost" onClick={handleBack}>
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    {t('navigation.back')}
                                </CyberButton>
                            )}

                            <CyberButton
                                variant="primary"
                                onClick={handleNext}
                                disabled={!canProceed()}
                            >
                                {t('navigation.continue')}
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </CyberButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
