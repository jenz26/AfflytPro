'use client';

import { LucideIcon } from 'lucide-react';

interface Step {
    id: number;
    icon: LucideIcon;
    title: string;
    description: string;
}

interface StepIndicatorProps {
    steps: Step[];
    currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
        <div className="flex items-center gap-2">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                    <div key={step.id} className="flex items-center flex-1">
                        <div className={`flex items-center gap-2 ${
                            isActive || isCompleted ? 'text-afflyt-cyan-400' : 'text-gray-600'
                        }`}>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
                                isCompleted
                                    ? 'border-afflyt-cyan-400 bg-afflyt-cyan-500/20'
                                    : isActive
                                        ? 'border-afflyt-cyan-400 bg-afflyt-cyan-500/10'
                                        : 'border-gray-600'
                            }`}>
                                {isCompleted ? (
                                    <span className="text-afflyt-cyan-400">✓</span>
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-xs font-medium">{step.title}</p>
                                <p className="text-[10px] text-gray-500">{step.description}</p>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${
                                currentStep > step.id ? 'bg-afflyt-cyan-400' : 'bg-gray-700'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
