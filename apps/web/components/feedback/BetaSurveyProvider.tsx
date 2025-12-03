'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { BetaSurvey } from './BetaSurvey';
import { useBetaSurvey, BetaMilestone } from '@/hooks/useBetaSurvey';
import { API_BASE } from '@/lib/api/config';

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

interface BetaSurveyContextValue {
  triggerSurvey: (type: 'nps' | 'csat' | 'feedback' | 'feature', feature?: string) => void;
  triggerMilestone: (milestone: BetaMilestone) => void;
}

const BetaSurveyContext = createContext<BetaSurveyContextValue | null>(null);

export function useBetaSurveyContext() {
  const context = useContext(BetaSurveyContext);
  if (!context) {
    // Return no-op functions if context not available
    return {
      triggerSurvey: () => {},
      triggerMilestone: () => {},
    };
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════

interface BetaSurveyProviderProps {
  children: ReactNode;
}

export function BetaSurveyProvider({ children }: BetaSurveyProviderProps) {
  const [userPlan, setUserPlan] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [surveyType, setSurveyType] = useState<'nps' | 'csat' | 'feedback' | 'feature'>('nps');
  const [surveyFeature, setSurveyFeature] = useState<string | undefined>();
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasCheckedInitialMilestones, setHasCheckedInitialMilestones] = useState(false);

  const { checkMilestone } = useBetaSurvey(userPlan);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.user?.plan);
          setUserId(data.user?.id);

          // Store signup date for time-based milestones
          if (data.user?.createdAt && !localStorage.getItem('afflyt_signup_date')) {
            localStorage.setItem('afflyt_signup_date', new Date(data.user.createdAt).getTime().toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data for surveys:', error);
      }
    };

    fetchUserData();
  }, []);

  // Check initial milestones (once per session)
  useEffect(() => {
    if (!userPlan || userPlan !== 'BETA_TESTER' || hasCheckedInitialMilestones) return;

    const checkInitialMilestones = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch dashboard stats to check milestones
        const response = await fetch(`${API_BASE}/user/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();

          // Check for first automation milestone
          if (data.automations && data.automations.length > 0) {
            const milestoneKey = 'afflyt_milestone_first_automation';
            if (!localStorage.getItem(milestoneKey)) {
              // User has automation but milestone not tracked - delay NPS
              setTimeout(() => {
                checkMilestone('first_automation');
              }, 5000);
            }
          }

          // Check for first channel milestone
          if (data.channels && data.channels.length > 0) {
            const milestoneKey = 'afflyt_milestone_channel_connected';
            if (!localStorage.getItem(milestoneKey)) {
              localStorage.setItem(milestoneKey, Date.now().toString());
            }
          }
        }

        setHasCheckedInitialMilestones(true);
      } catch (error) {
        console.error('Failed to check initial milestones:', error);
      }
    };

    // Delay initial check to let user see the dashboard first
    const timer = setTimeout(checkInitialMilestones, 10000);
    return () => clearTimeout(timer);
  }, [userPlan, hasCheckedInitialMilestones, checkMilestone]);

  // Trigger survey function
  const triggerSurvey = useCallback(
    (type: 'nps' | 'csat' | 'feedback' | 'feature', feature?: string) => {
      if (userPlan !== 'BETA_TESTER') return;

      // Check cooldown
      const surveyKey = `afflyt_survey_${type}_${feature || 'general'}`;
      const lastShown = localStorage.getItem(surveyKey);

      if (lastShown) {
        const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
        const cooldown = type === 'nps' ? 7 : 3;
        if (daysSinceShown < cooldown) return;
      }

      setSurveyType(type);
      setSurveyFeature(feature);
      setShowSurvey(true);
    },
    [userPlan]
  );

  // Trigger milestone function
  const triggerMilestone = useCallback(
    (milestone: BetaMilestone) => {
      if (userPlan !== 'BETA_TESTER') return;
      checkMilestone(milestone);
    },
    [userPlan, checkMilestone]
  );

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    const surveyKey = `afflyt_survey_${surveyType}_${surveyFeature || 'general'}`;
    localStorage.setItem(surveyKey, Date.now().toString());
  };

  const handleSurveyDismiss = () => {
    setShowSurvey(false);
  };

  return (
    <BetaSurveyContext.Provider value={{ triggerSurvey, triggerMilestone }}>
      {children}

      {/* Survey Modal */}
      {showSurvey && (
        <BetaSurvey
          userPlan={userPlan}
          userId={userId}
          surveyType={surveyType}
          feature={surveyFeature}
          trigger="manual"
          onComplete={handleSurveyComplete}
          onDismiss={handleSurveyDismiss}
        />
      )}
    </BetaSurveyContext.Provider>
  );
}

export default BetaSurveyProvider;
