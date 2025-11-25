'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Check,
    Zap,
    Crown,
    Building2,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useTranslations } from 'next-intl';

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

interface PlanSelectorProps {
    onSelect: (plan: PlanType) => void;
    onSkip?: () => void;
    selectedPlan?: PlanType;
}

interface PlanFeature {
    text: string;
    included: boolean;
    highlight?: boolean;
}

interface Plan {
    id: PlanType;
    name: string;
    price: string;
    priceNote: string;
    description: string;
    icon: React.ElementType;
    color: string;
    borderColor: string;
    popular?: boolean;
    features: PlanFeature[];
}

export const PlanSelector = ({ onSelect, onSkip, selectedPlan }: PlanSelectorProps) => {
    const t = useTranslations('onboarding.plans');
    const [selected, setSelected] = useState<PlanType | null>(selectedPlan || null);

    const plans: Plan[] = [
        {
            id: 'FREE',
            name: t('free.name'),
            price: t('free.price'),
            priceNote: t('free.priceNote'),
            description: t('free.description'),
            icon: Zap,
            color: 'from-gray-500 to-gray-600',
            borderColor: 'border-gray-500/50',
            features: [
                { text: t('free.features.channels'), included: true },
                { text: t('free.features.amazonTag'), included: true },
                { text: t('free.features.basicAutomation'), included: true },
                { text: t('free.features.dealScore'), included: true },
                { text: t('free.features.templates'), included: false },
                { text: t('free.features.analytics'), included: false },
                { text: t('free.features.priority'), included: false }
            ]
        },
        {
            id: 'PRO',
            name: t('pro.name'),
            price: t('pro.price'),
            priceNote: t('pro.priceNote'),
            description: t('pro.description'),
            icon: Crown,
            color: 'from-afflyt-cyan-500 to-afflyt-cyan-600',
            borderColor: 'border-afflyt-cyan-500/50',
            popular: true,
            features: [
                { text: t('pro.features.channels'), included: true },
                { text: t('pro.features.amazonTag'), included: true },
                { text: t('pro.features.advancedAutomation'), included: true, highlight: true },
                { text: t('pro.features.dealScore'), included: true },
                { text: t('pro.features.templates'), included: true, highlight: true },
                { text: t('pro.features.analytics'), included: true, highlight: true },
                { text: t('pro.features.priority'), included: true }
            ]
        },
        {
            id: 'ENTERPRISE',
            name: t('enterprise.name'),
            price: t('enterprise.price'),
            priceNote: t('enterprise.priceNote'),
            description: t('enterprise.description'),
            icon: Building2,
            color: 'from-afflyt-plasma-500 to-afflyt-plasma-600',
            borderColor: 'border-afflyt-plasma-500/50',
            features: [
                { text: t('enterprise.features.unlimitedChannels'), included: true, highlight: true },
                { text: t('enterprise.features.amazonTag'), included: true },
                { text: t('enterprise.features.fullAutomation'), included: true, highlight: true },
                { text: t('enterprise.features.dealScore'), included: true },
                { text: t('enterprise.features.customTemplates'), included: true, highlight: true },
                { text: t('enterprise.features.advancedAnalytics'), included: true, highlight: true },
                { text: t('enterprise.features.teamAccess'), included: true, highlight: true },
                { text: t('enterprise.features.apiAccess'), included: true, highlight: true },
                { text: t('enterprise.features.dedicatedSupport'), included: true }
            ]
        }
    ];

    const handleSelect = (planId: PlanType) => {
        setSelected(planId);
    };

    const handleContinue = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-afflyt-dark-100" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {t('title')}
                </h1>
                <p className="text-sm text-gray-400 max-w-lg mx-auto">
                    {t('subtitle')}
                </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                    const isSelected = selected === plan.id;
                    const Icon = plan.icon;

                    return (
                        <motion.button
                            key={plan.id}
                            onClick={() => handleSelect(plan.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                                isSelected
                                    ? `${plan.borderColor} bg-gradient-to-b from-afflyt-dark-50 to-afflyt-dark-100`
                                    : 'border-afflyt-glass-border bg-afflyt-dark-50 hover:border-gray-600'
                            }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-600 text-xs font-bold text-white rounded-full">
                                        {t('popular')}
                                    </span>
                                </div>
                            )}

                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-4 right-4">
                                    <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                    <p className="text-xs text-gray-500">{plan.description}</p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                                    <span className="text-sm text-gray-500">{plan.priceNote}</span>
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className={`mt-0.5 ${feature.included ? 'text-afflyt-profit-400' : 'text-gray-600'}`}>
                                            {feature.included ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <span className="w-4 h-4 flex items-center justify-center">-</span>
                                            )}
                                        </span>
                                        <span className={`text-sm ${
                                            feature.included
                                                ? feature.highlight
                                                    ? 'text-white font-medium'
                                                    : 'text-gray-300'
                                                : 'text-gray-600 line-through'
                                        }`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.button>
                    );
                })}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-afflyt-glass-border">
                <div>
                    {onSkip && (
                        <CyberButton variant="ghost" onClick={onSkip}>
                            {t('skipForNow')}
                        </CyberButton>
                    )}
                </div>
                <CyberButton
                    variant="primary"
                    onClick={handleContinue}
                    disabled={!selected}
                    className="gap-2"
                >
                    {t('continue')}
                    <ChevronRight className="w-4 h-4" />
                </CyberButton>
            </div>

            {/* Note */}
            <p className="text-center text-xs text-gray-500">
                {t('changeLater')}
            </p>
        </div>
    );
};
