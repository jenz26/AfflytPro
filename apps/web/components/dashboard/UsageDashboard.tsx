'use client';

import { PlanBadge, PlanType } from './PlanBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import Link from 'next/link';
import { ArrowUpRight, AlertTriangle } from 'lucide-react';

interface UsageItem {
  used: number;
  max: number;
}

interface UsageDashboardProps {
  plan: PlanType;
  usage: {
    automations: UsageItem;
    activeAutomations: UsageItem;
    channels: UsageItem;
    keepaTokens?: UsageItem;
  };
  className?: string;
}

function ProgressBar({
  value,
  max,
  label,
  showWarning = false
}: {
  value: number;
  max: number;
  label: string;
  showWarning?: boolean;
}) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : (value / max) * 100;
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold font-mono">
            {value} / {isUnlimited ? '∞' : max}
          </span>
          {isNearLimit && showWarning && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {!isUnlimited && (
        <>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isNearLimit
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {isNearLimit && (
            <p className="text-xs text-yellow-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Approaching limit. Consider upgrading your plan.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function UsageDashboard({ plan, usage, className = '' }: UsageDashboardProps) {
  const canUpgrade = plan !== 'BUSINESS';

  return (
    <GlassCard className={className} padding="lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Your Plan</h3>
          <PlanBadge plan={plan} size="lg" />
        </div>
        {canUpgrade && (
          <Link href="/settings/subscription">
            <CyberButton variant="primary" size="sm">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              Upgrade
            </CyberButton>
          </Link>
        )}
      </div>

      <div className="space-y-5">
        {/* Automation Rules */}
        <ProgressBar
          value={usage.automations.used}
          max={usage.automations.max}
          label="Automation Rules"
          showWarning
        />

        {/* Active Automations */}
        <ProgressBar
          value={usage.activeAutomations.used}
          max={usage.activeAutomations.max}
          label="Active Automations"
          showWarning
        />

        {/* Channels */}
        <ProgressBar
          value={usage.channels.used}
          max={usage.channels.max}
          label="Channels"
        />

        {/* Keepa Tokens (if provided) */}
        {usage.keepaTokens && (
          <ProgressBar
            value={usage.keepaTokens.used}
            max={usage.keepaTokens.max}
            label="Keepa Tokens (this month)"
            showWarning
          />
        )}
      </div>

      {/* Plan Benefits Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-bold text-white mb-3">Plan Features</h4>
        <div className="space-y-2 text-sm">
          {plan === 'FREE' && (
            <>
              <Feature>Deal Score: ≥85 only (Hot Deals)</Feature>
              <Feature>Frequency: Every 6 hours</Feature>
              <Feature disabled>AI Copy</Feature>
              <Feature disabled>A/B Testing</Feature>
            </>
          )}
          {plan === 'PRO' && (
            <>
              <Feature>Deal Score: ≥70 (adjustable)</Feature>
              <Feature>Frequency: Every 2-3 hours</Feature>
              <Feature>AI Copy & Custom Templates</Feature>
              <Feature>A/B Testing</Feature>
            </>
          )}
          {plan === 'BUSINESS' && (
            <>
              <Feature>Deal Score: Any (0-100)</Feature>
              <Feature>Frequency: Every 30-90 minutes</Feature>
              <Feature>AI Copy Advanced</Feature>
              <Feature>A/B Testing Advanced</Feature>
              <Feature>API Access & Webhooks</Feature>
              <Feature>Team Access</Feature>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function Feature({
  children,
  disabled = false
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
      <span className={`text-xs ${disabled ? 'text-gray-500' : 'text-afflyt-cyan-400'}`}>
        {disabled ? '✗' : '✓'}
      </span>
      <span className={disabled ? 'text-gray-500' : 'text-gray-300'}>
        {children}
      </span>
    </div>
  );
}
