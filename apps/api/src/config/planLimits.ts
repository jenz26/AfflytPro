/**
 * Plan Limits Configuration - v2.0
 * Based on: AFFLYT PRO — SPECIFICA UFFICIALE TIER & COMPLIANCE.md v2.0
 *
 * SQLite doesn't support native enums, so we use string constants
 * with runtime validation.
 */

export const PlanType = {
  FREE: 'FREE',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
  BETA_TESTER: 'BETA_TESTER',
} as const;

export type PlanType = typeof PlanType[keyof typeof PlanType];

export interface PlanLimits {
  automations: {
    active: number;  // -1 = unlimited
    total: number;
  };
  channels: number;
  minScore: number;  // Minimum deal score threshold
  execution: {
    cron: string;
    intervalMinutes: number;
  };
  keepa: {
    refreshInterval: number;        // Minutes between passive refreshes
    forceRefreshIfOlderThan: number | null;  // Minutes, null = never force refresh
  };
  features: {
    aiCopy: boolean;
    aiCopyAdvanced?: boolean;
    abTesting: boolean;
    abTestingAdvanced?: boolean;
    customTemplates: boolean;
    apiAccess?: boolean;
    webhooks?: boolean;
    teamAccess?: boolean;
    priorityQueue?: boolean;
    analytics: 'basic' | 'advanced' | 'enterprise';
  };
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    automations: {
      active: 1,        // Only 1 active automation (intentional limitation)
      total: 2,         // Can create up to 2 rules (but only 1 active)
    },
    channels: 1,
    minScore: 60,       // Locked at 60+ (OTTIMO deals only)
    execution: {
      cron: '0 */6 * * *',      // Every 6 hours
      intervalMinutes: 360,
    },
    keepa: {
      refreshInterval: 270,      // 4.5h average (4-6h range)
      forceRefreshIfOlderThan: null,  // No forced refresh before publish
    },
    features: {
      aiCopy: false,
      abTesting: false,
      customTemplates: false,
      analytics: 'basic',
    },
  },

  [PlanType.PRO]: {
    automations: {
      active: 7,        // Up to 7 active automations
      total: 10,        // Can create up to 10 rules
    },
    channels: 5,
    minScore: 35,       // User can adjust 35-100
    execution: {
      cron: '0 */2 * * *',      // Every 2-3 hours
      intervalMinutes: 150,
    },
    keepa: {
      refreshInterval: 120,      // 2h average
      forceRefreshIfOlderThan: 720,  // Force refresh if data > 12 hours old
    },
    features: {
      aiCopy: true,
      abTesting: true,
      customTemplates: true,
      analytics: 'advanced',
    },
  },

  [PlanType.BUSINESS]: {
    automations: {
      active: -1,       // Unlimited active automations
      total: -1,        // Unlimited rules
    },
    channels: -1,      // Unlimited channels
    minScore: 0,        // Any score (0-100)
    execution: {
      cron: '*/30 * * * *',     // Every 30-90 min
      intervalMinutes: 60,
    },
    keepa: {
      refreshInterval: 60,       // 1h average
      forceRefreshIfOlderThan: 0,  // Always force refresh before publish
    },
    features: {
      aiCopy: true,
      aiCopyAdvanced: true,
      abTesting: true,
      abTestingAdvanced: true,
      customTemplates: true,
      apiAccess: true,
      webhooks: true,
      teamAccess: true,
      priorityQueue: true,
      analytics: 'enterprise',
    },
  },

  // BETA_TESTER = Same as PRO (full access to test all features)
  [PlanType.BETA_TESTER]: {
    automations: {
      active: 7,        // Up to 7 active automations
      total: 10,        // Can create up to 10 rules
    },
    channels: 5,
    minScore: 35,       // User can adjust 35-100
    execution: {
      cron: '0 */2 * * *',      // Every 2-3 hours
      intervalMinutes: 150,
    },
    keepa: {
      refreshInterval: 120,      // 2h average
      forceRefreshIfOlderThan: 720,  // Force refresh if data > 12 hours old
    },
    features: {
      aiCopy: true,
      abTesting: true,
      customTemplates: true,
      analytics: 'advanced',
    },
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: string): PlanLimits {
  if (!isValidPlan(plan)) {
    throw new Error(`Invalid plan type: ${plan}`);
  }
  return PLAN_LIMITS[plan as PlanType];
}

/**
 * Check if a plan type is valid
 */
export function isValidPlan(plan: string): plan is PlanType {
  return Object.values(PlanType).includes(plan as PlanType);
}

/**
 * Check if user can create another automation
 */
export function canCreateAutomation(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.automations.total === -1) return true;
  return currentCount < limits.automations.total;
}

/**
 * Check if user can activate another automation
 */
export function canActivateAutomation(plan: string, activeCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.automations.active === -1) return true;
  return activeCount < limits.automations.active;
}

/**
 * Check if a requested score is allowed for the plan
 */
export function isScoreAllowed(plan: string, requestedScore: number): boolean {
  const limits = getPlanLimits(plan);
  return requestedScore >= limits.minScore;
}

/**
 * Check if Keepa refresh is needed based on plan and data age
 */
export function needsKeepaRefresh(plan: string, minutesSinceRefresh: number): boolean {
  const limits = getPlanLimits(plan);

  // If no forced refresh policy, never force
  if (limits.keepa.forceRefreshIfOlderThan === null) {
    return false;
  }

  // BUSINESS plan: always refresh (forceRefreshIfOlderThan = 0)
  if (limits.keepa.forceRefreshIfOlderThan === 0) {
    return true;
  }

  // PRO plan: refresh if older than threshold (12h = 720min)
  return minutesSinceRefresh > limits.keepa.forceRefreshIfOlderThan;
}

/**
 * Check if user can add another channel
 */
export function canAddChannel(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.channels === -1) return true;
  return currentCount < limits.channels;
}

/**
 * Get the next plan in the upgrade path
 */
export function getNextPlan(currentPlan: string): PlanType | null {
  const UPGRADE_PATH: Record<PlanType, PlanType | null> = {
    [PlanType.FREE]: PlanType.PRO,
    [PlanType.PRO]: PlanType.BUSINESS,
    [PlanType.BUSINESS]: null,
    [PlanType.BETA_TESTER]: PlanType.BUSINESS, // Beta testers can upgrade to Business
  };

  if (!isValidPlan(currentPlan)) return null;
  return UPGRADE_PATH[currentPlan as PlanType];
}

/**
 * Get user-friendly plan name
 */
export function getPlanLabel(plan: string): string {
  const LABELS: Record<PlanType, string> = {
    [PlanType.FREE]: 'Free',
    [PlanType.PRO]: 'Pro',
    [PlanType.BUSINESS]: 'Business',
    [PlanType.BETA_TESTER]: 'Beta Tester',
  };

  if (!isValidPlan(plan)) return 'Unknown';
  return LABELS[plan as PlanType];
}

/**
 * Get plan pricing (monthly in EUR)
 */
export function getPlanPrice(plan: string): number | null {
  const PRICES: Record<PlanType, number | null> = {
    [PlanType.FREE]: null,
    [PlanType.PRO]: 79,
    [PlanType.BUSINESS]: 199,
    [PlanType.BETA_TESTER]: null, // Free during beta
  };

  if (!isValidPlan(plan)) return null;
  return PRICES[plan as PlanType];
}

/**
 * Check if a feature is available for the plan
 */
export function hasFeature(
  plan: string,
  feature: keyof PlanLimits['features']
): boolean {
  const limits = getPlanLimits(plan);
  return limits.features[feature] === true || limits.features[feature] === 'advanced' || limits.features[feature] === 'enterprise';
}

/**
 * Get recommended upgrade reason based on limit hit
 */
export function getUpgradeReason(
  plan: string,
  limitType: 'automations' | 'channels' | 'minScore' | 'aiCopy' | 'abTesting'
): string {
  const nextPlan = getNextPlan(plan);
  if (!nextPlan) return 'You are already on the highest plan';

  const UPGRADE_REASONS: Record<string, string> = {
    automations: `Upgrade to ${getPlanLabel(nextPlan)} for more automations`,
    channels: `Upgrade to ${getPlanLabel(nextPlan)} for more channels`,
    minScore: `Upgrade to ${getPlanLabel(nextPlan)} to access deals with lower scores`,
    aiCopy: `Upgrade to ${getPlanLabel(nextPlan)} to unlock AI-powered copy generation`,
    abTesting: `Upgrade to ${getPlanLabel(nextPlan)} to unlock A/B testing`,
  };

  return UPGRADE_REASONS[limitType] || `Upgrade to ${getPlanLabel(nextPlan)}`;
}
