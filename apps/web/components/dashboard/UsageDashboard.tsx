'use client';

import { PlanBadge, PlanType } from './PlanBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import Link from 'next/link';
import { ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  showWarning = false,
  warningText
}: {
  value: number;
  max: number;
  label: string;
  showWarning?: boolean;
  warningText?: string;
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

          {isNearLimit && warningText && (
            <p className="text-xs text-yellow-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {warningText}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function UsageDashboard({ plan, usage, className = '' }: UsageDashboardProps) {
  const t = useTranslations('usageDashboard');
  const canUpgrade = plan !== 'BUSINESS';

  return (
    <GlassCard className={className} padding="lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">{t('yourPlan')}</h3>
          <PlanBadge plan={plan} size="lg" />
        </div>
        {canUpgrade && (
          <Link href="/settings/subscription">
            <CyberButton variant="primary" size="sm">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              {t('upgrade')}
            </CyberButton>
          </Link>
        )}
      </div>

      <div className="space-y-5">
        {/* Automation Rules */}
        <ProgressBar
          value={usage.automations.used}
          max={usage.automations.max}
          label={t('labels.automationRules')}
          showWarning
          warningText={t('approachingLimit')}
        />

        {/* Active Automations */}
        <ProgressBar
          value={usage.activeAutomations.used}
          max={usage.activeAutomations.max}
          label={t('labels.activeAutomations')}
          showWarning
          warningText={t('approachingLimit')}
        />

        {/* Channels */}
        <ProgressBar
          value={usage.channels.used}
          max={usage.channels.max}
          label={t('labels.channels')}
        />

        {/* Keepa Tokens (if provided) */}
        {usage.keepaTokens && (
          <ProgressBar
            value={usage.keepaTokens.used}
            max={usage.keepaTokens.max}
            label={t('labels.keepaTokens')}
            showWarning
            warningText={t('approachingLimit')}
          />
        )}
      </div>

      {/* Plan Benefits Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-bold text-white mb-3">{t('planFeatures')}</h4>
        <div className="space-y-2 text-sm">
          {plan === 'FREE' && (
            <>
              <Feature>{t('features.free.dealScore')}</Feature>
              <Feature>{t('features.free.frequency')}</Feature>
              <Feature disabled>{t('features.free.aiCopy')}</Feature>
              <Feature disabled>{t('features.free.abTesting')}</Feature>
            </>
          )}
          {plan === 'PRO' && (
            <>
              <Feature>{t('features.pro.dealScore')}</Feature>
              <Feature>{t('features.pro.frequency')}</Feature>
              <Feature>{t('features.pro.aiCopy')}</Feature>
              <Feature>{t('features.pro.abTesting')}</Feature>
            </>
          )}
          {plan === 'BUSINESS' && (
            <>
              <Feature>{t('features.business.dealScore')}</Feature>
              <Feature>{t('features.business.frequency')}</Feature>
              <Feature>{t('features.business.aiCopy')}</Feature>
              <Feature>{t('features.business.abTesting')}</Feature>
              <Feature>{t('features.business.apiAccess')}</Feature>
              <Feature>{t('features.business.teamAccess')}</Feature>
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
