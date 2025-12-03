'use client';

import { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@/components/analytics/PostHogProvider';

type SurveyType = 'nps' | 'csat' | 'feedback' | 'feature';

interface SurveyConfig {
  type: SurveyType;
  feature?: string;
  cooldownDays?: number;
}

interface UseBetaSurveyReturn {
  shouldShowSurvey: boolean;
  showSurvey: () => void;
  dismissSurvey: () => void;
  completeSurvey: () => void;
  checkMilestone: (milestone: BetaMilestone) => void;
}

export type BetaMilestone =
  | 'first_login'
  | 'first_automation'
  | 'first_deal'
  | 'first_week'
  | 'first_month'
  | 'automation_activated'
  | 'channel_connected';

const MILESTONE_SURVEYS: Record<BetaMilestone, SurveyConfig> = {
  first_login: { type: 'csat', cooldownDays: 30 },
  first_automation: { type: 'feedback', feature: 'automation_creation', cooldownDays: 7 },
  first_deal: { type: 'csat', feature: 'deal_discovery', cooldownDays: 7 },
  first_week: { type: 'nps', cooldownDays: 14 },
  first_month: { type: 'nps', cooldownDays: 30 },
  automation_activated: { type: 'feedback', feature: 'automation', cooldownDays: 3 },
  channel_connected: { type: 'feedback', feature: 'channel', cooldownDays: 3 },
};

export function useBetaSurvey(
  userPlan?: string,
  config?: SurveyConfig
): UseBetaSurveyReturn {
  const [shouldShowSurvey, setShouldShowSurvey] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SurveyConfig | null>(config || null);

  const isBetaUser = userPlan === 'BETA_TESTER';

  const getSurveyKey = useCallback((cfg: SurveyConfig) => {
    return `afflyt_survey_${cfg.type}_${cfg.feature || 'general'}`;
  }, []);

  const canShowSurvey = useCallback(
    (cfg: SurveyConfig): boolean => {
      if (!isBetaUser) return false;

      const surveyKey = getSurveyKey(cfg);
      const lastShown = localStorage.getItem(surveyKey);

      if (!lastShown) return true;

      const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      const cooldown = cfg.cooldownDays || 7;

      return daysSinceShown >= cooldown;
    },
    [isBetaUser, getSurveyKey]
  );

  const showSurvey = useCallback(() => {
    if (currentConfig && canShowSurvey(currentConfig)) {
      setShouldShowSurvey(true);
      Analytics.captureSurveyShown(`beta_${currentConfig.type}_survey`);
    }
  }, [currentConfig, canShowSurvey]);

  const dismissSurvey = useCallback(() => {
    setShouldShowSurvey(false);
    if (currentConfig) {
      Analytics.captureSurveyDismissed(`beta_${currentConfig.type}_survey`);
    }
  }, [currentConfig]);

  const completeSurvey = useCallback(() => {
    setShouldShowSurvey(false);
    if (currentConfig) {
      const surveyKey = getSurveyKey(currentConfig);
      localStorage.setItem(surveyKey, Date.now().toString());
    }
  }, [currentConfig, getSurveyKey]);

  const checkMilestone = useCallback(
    (milestone: BetaMilestone) => {
      if (!isBetaUser) return;

      const milestoneKey = `afflyt_milestone_${milestone}`;
      const alreadyTriggered = localStorage.getItem(milestoneKey);

      if (alreadyTriggered) return;

      const surveyConfig = MILESTONE_SURVEYS[milestone];
      if (!surveyConfig) return;

      if (canShowSurvey(surveyConfig)) {
        // Mark milestone as triggered
        localStorage.setItem(milestoneKey, Date.now().toString());

        // Track the milestone event
        switch (milestone) {
          case 'first_automation':
            Analytics.trackFirstAutomationMilestone();
            break;
          case 'first_deal':
            Analytics.trackFirstDealMilestone(0);
            break;
          case 'first_week':
            Analytics.trackFirstWeekMilestone(0, 0);
            break;
        }

        // Set current config and show survey
        setCurrentConfig(surveyConfig);

        // Delay to let user see what they accomplished first
        setTimeout(() => {
          setShouldShowSurvey(true);
        }, 3000);
      }
    },
    [isBetaUser, canShowSurvey]
  );

  // Auto-check for time-based milestones
  useEffect(() => {
    if (!isBetaUser) return;

    const checkTimeMilestones = () => {
      const signupDate = localStorage.getItem('afflyt_signup_date');
      if (!signupDate) return;

      const daysSinceSignup = (Date.now() - parseInt(signupDate)) / (1000 * 60 * 60 * 24);

      if (daysSinceSignup >= 7 && daysSinceSignup < 8) {
        checkMilestone('first_week');
      } else if (daysSinceSignup >= 30 && daysSinceSignup < 31) {
        checkMilestone('first_month');
      }
    };

    checkTimeMilestones();
  }, [isBetaUser, checkMilestone]);

  return {
    shouldShowSurvey,
    showSurvey,
    dismissSurvey,
    completeSurvey,
    checkMilestone,
  };
}

/**
 * Hook specifically for NPS surveys
 */
export function useBetaNPS(userPlan?: string) {
  return useBetaSurvey(userPlan, { type: 'nps', cooldownDays: 14 });
}

/**
 * Hook for feature-specific feedback
 */
export function useFeatureFeedback(feature: string, userPlan?: string) {
  return useBetaSurvey(userPlan, { type: 'feature', feature, cooldownDays: 3 });
}
