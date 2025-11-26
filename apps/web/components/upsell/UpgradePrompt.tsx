'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import Link from 'next/link';
import { Lock, Sparkles, Zap, Check } from 'lucide-react';
import { PlanType } from '../dashboard/PlanBadge';

interface UpgradePromptProps {
  currentPlan: PlanType;
  feature: string;
  message: string;
  benefits?: string[];
  variant?: 'inline' | 'modal' | 'banner';
  onClose?: () => void;
}

const NEXT_PLAN: Record<PlanType, PlanType | null> = {
  FREE: 'PRO',
  PRO: 'BUSINESS',
  BUSINESS: null,
};

const PLAN_PRICES: Record<string, number> = {
  PRO: 79,
  BUSINESS: 199,
};

const PLAN_LABELS: Record<PlanType, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  BUSINESS: 'Business',
};

export function UpgradePrompt({
  currentPlan,
  feature,
  message,
  benefits = [],
  variant = 'inline',
  onClose,
}: UpgradePromptProps) {
  const nextPlan = NEXT_PLAN[currentPlan];
  const price = nextPlan ? PLAN_PRICES[nextPlan] : null;

  if (!nextPlan) {
    return null; // Already on highest plan
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-afflyt-cyan-500/10 via-blue-500/10 to-afflyt-plasma-500/10 border border-afflyt-cyan-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-afflyt-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{feature}</p>
              <p className="text-gray-300 text-xs">{message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings/subscription">
              <CyberButton variant="primary" size="sm">
                Upgrade to {PLAN_LABELS[nextPlan]}
              </CyberButton>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <GlassCard className="border-afflyt-cyan-500/30" padding="lg">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                Unlock {feature}
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </h3>
              <p className="text-gray-300 text-sm">{message}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Benefits */}
          {benefits && benefits.length > 0 && (
            <div className="mb-4 space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/settings/subscription">
              <CyberButton
                variant="primary"
                className="bg-gradient-to-r from-afflyt-cyan-500 to-blue-600 hover:from-afflyt-cyan-600 hover:to-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to {PLAN_LABELS[nextPlan]}
                {price && (
                  <span className="ml-2 opacity-90">(€{price}/mo)</span>
                )}
              </CyberButton>
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              Compare all plans →
            </Link>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Compact upgrade card for use in lists/grids
 */
export function UpgradeCard({
  currentPlan,
  feature,
  icon,
  description,
}: {
  currentPlan: PlanType;
  feature: string;
  icon: React.ReactNode;
  description: string;
}) {
  const nextPlan = NEXT_PLAN[currentPlan];
  const price = nextPlan ? PLAN_PRICES[nextPlan] : null;

  if (!nextPlan) return null;

  return (
    <GlassCard
      className="border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer"
      padding="md"
    >
      <Link href="/settings/subscription" className="block">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm">{feature}</h4>
            <p className="text-xs text-cyan-400">
              {PLAN_LABELS[nextPlan]} {price && `• €${price}/mo`}
            </p>
          </div>
          <Lock className="w-4 h-4 text-gray-500" />
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </Link>
    </GlassCard>
  );
}
