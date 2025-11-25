/**
 * Example: How to use Plan Badge, Usage Dashboard, and Upgrade Prompts
 *
 * This file shows how to integrate the tier system UI components
 * into your dashboard pages.
 */

import { PlanBadge } from '@/components/dashboard/PlanBadge';
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';
import { UpgradePrompt, UpgradeCard } from '@/components/upsell/UpgradePrompt';
import { Sparkles, Bot, Zap } from 'lucide-react';

// ==================== EXAMPLE 1: Dashboard Overview Page ====================

export function DashboardPage() {
  // Fetch user data from API
  const user = {
    plan: 'PRO' as const,
    usage: {
      automations: { used: 8, max: 10 },
      activeAutomations: { used: 6, max: 7 },
      channels: { used: 3, max: 5 },
      keepaTokens: { used: 7500, max: 10000 },
    },
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-400">Welcome back!</p>
            <PlanBadge plan={user.plan} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white">Your Automations</h2>
          {/* Automation list here */}
        </div>

        {/* Sidebar with Usage Dashboard */}
        <div className="space-y-6">
          <UsageDashboard plan={user.plan} usage={user.usage} />
        </div>
      </div>
    </div>
  );
}

// ==================== EXAMPLE 2: Limit Reached - Show Upgrade Prompt ====================

export function AutomationCreatePage() {
  const user = {
    plan: 'FREE' as const,
    automationCount: 2, // Already at limit
  };

  const PLAN_LIMITS = {
    FREE: { automations: 2 },
    PRO: { automations: 10 },
    BUSINESS: { automations: -1 },
  };

  const canCreate = user.automationCount < PLAN_LIMITS[user.plan].automations;

  if (!canCreate) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <UpgradePrompt
          currentPlan={user.plan}
          feature="More Automations"
          message={`You've reached the limit of ${PLAN_LIMITS[user.plan].automations} automations for the ${user.plan} plan.`}
          benefits={[
            'Create up to 10 automation rules',
            'Adjust deal score threshold (≥70)',
            'Run automations every 2-3 hours',
            'AI-powered copy generation',
            'A/B testing for optimization',
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Show create form */}
    </div>
  );
}

// ==================== EXAMPLE 3: Inline Banner when Approaching Limit ====================

export function AutomationListPage() {
  const user = {
    plan: 'PRO' as const,
    automations: { used: 9, max: 10 }, // Near limit
  };

  const isNearLimit =
    user.automations.max !== -1 &&
    (user.automations.used / user.automations.max) >= 0.8;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Automations</h1>

      {/* Show banner when near limit */}
      {isNearLimit && (
        <div className="mb-6">
          <UpgradePrompt
            currentPlan={user.plan}
            feature="More Automation Slots"
            message="You're using 9 out of 10 automation slots."
            variant="banner"
          />
        </div>
      )}

      {/* Automation list */}
    </div>
  );
}

// ==================== EXAMPLE 4: Feature Cards Grid (Locked Features) ====================

export function FeaturesPage() {
  const user = {
    plan: 'FREE' as const,
  };

  const lockedFeatures = [
    {
      feature: 'AI Copy Generator',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      description: 'Generate compelling deal descriptions with AI',
    },
    {
      feature: 'A/B Testing',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      description: 'Test different templates and optimize performance',
    },
    {
      feature: 'Advanced Analytics',
      icon: <Bot className="w-5 h-5 text-cyan-400" />,
      description: 'Deep insights into your automation performance',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Available Features</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lockedFeatures.map((item, index) => (
          <UpgradeCard
            key={index}
            currentPlan={user.plan}
            feature={item.feature}
            icon={item.icon}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}

// ==================== EXAMPLE 5: Handle API Error Response (PlanGuardError) ====================

export async function handleCreateAutomation(data: any) {
  try {
    const response = await fetch('/api/automation/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();

      // Check if it's a PlanGuardError
      if (error.error === 'UPGRADE_REQUIRED') {
        // Show upgrade prompt
        return {
          type: 'upgrade_required',
          currentPlan: error.currentPlan,
          feature: error.requiredFeature,
          message: error.message,
          suggestedPlan: error.suggestedPlan,
          upgradeUrl: error.upgradeUrl,
        };
      }

      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create automation:', error);
    throw error;
  }
}

// ==================== EXAMPLE 6: Plan Badge in Sidebar ====================

export function Sidebar() {
  const user = {
    email: 'user@example.com',
    plan: 'PRO' as const,
  };

  return (
    <div className="w-64 bg-gray-900 h-screen p-4">
      {/* Sidebar content */}

      {/* User section at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user.email}</p>
          </div>
        </div>
        <PlanBadge plan={user.plan} size="sm" className="w-full justify-center" />
      </div>
    </div>
  );
}

// ==================== USAGE NOTES ====================

/**
 * PLAN BADGE
 *
 * Basic usage:
 * <PlanBadge plan="PRO" />
 *
 * Sizes:
 * <PlanBadge plan="PRO" size="sm" />   // Small
 * <PlanBadge plan="PRO" size="md" />   // Medium (default)
 * <PlanBadge plan="PRO" size="lg" />   // Large
 *
 * Without icon:
 * <PlanBadge plan="PRO" showIcon={false} />
 */

/**
 * USAGE DASHBOARD
 *
 * Required props:
 * - plan: Current user plan
 * - usage: Object with used/max values
 *
 * Features:
 * - Shows progress bars for each metric
 * - Warning when approaching limits (80%+)
 * - Shows plan features summary
 * - Upgrade button if not on BUSINESS
 */

/**
 * UPGRADE PROMPT
 *
 * Variants:
 * 1. 'inline' (default): Full card with benefits list
 * 2. 'banner': Compact horizontal banner
 * 3. 'modal': Can be wrapped in a modal component
 *
 * Features:
 * - Auto-detects next plan in upgrade path
 * - Shows pricing
 * - Optional benefits list
 * - Optional close button (onClose prop)
 */

/**
 * UPGRADE CARD
 *
 * Best for:
 * - Feature discovery pages
 * - Settings pages
 * - Grids of locked features
 *
 * Compact design with:
 * - Icon
 * - Feature name
 * - Plan required
 * - Short description
 * - Lock icon
 */
