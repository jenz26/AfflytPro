'use client';

import { motion } from 'framer-motion';
import { Check, Circle, Lock } from 'lucide-react';

interface Step {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    current: boolean;
    locked: boolean;
}

interface ProgressTrackerProps {
    steps: Step[];
    onStepClick?: (stepId: string) => void;
}

export const ProgressTracker = ({ steps, onStepClick }: ProgressTrackerProps) => {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Il Tuo Percorso
            </h3>

            {steps.map((step, index) => {
                const isClickable = step.completed && onStepClick;

                return (
                    <button
                        key={step.id}
                        onClick={() => isClickable && onStepClick(step.id)}
                        disabled={!isClickable}
                        className={`w-full text-left transition-all ${
                            isClickable ? 'cursor-pointer' : 'cursor-default'
                        }`}
                    >
                        <div className="flex items-start gap-3 p-4 rounded-lg border transition-all ${
                            step.current
                                ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/50'
                                : step.completed
                                ? 'bg-afflyt-profit-500/5 border-afflyt-profit-500/20 opacity-60 hover:opacity-100'
                                : 'bg-transparent border-afflyt-glass-border opacity-40'
                        }">
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                step.current
                                    ? 'bg-afflyt-cyan-500'
                                    : step.completed
                                    ? 'bg-afflyt-profit-400'
                                    : 'bg-afflyt-dark-100'
                            }`}>
                                {step.completed ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : step.locked ? (
                                    <Lock className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <Circle className={`w-5 h-5 ${
                                        step.current ? 'text-white' : 'text-gray-600'
                                    }`} />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-mono text-gray-500`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <h4 className={`text-base font-semibold ${
                                        step.current ? 'text-white font-bold' : 'text-gray-300'
                                    }`}>
                                        {step.label}
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2">
                                    {step.description}
                                </p>
                            </div>

                            {/* Status Badge */}
                            {step.completed && (
                                <div className="shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-afflyt-profit-400" />
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
