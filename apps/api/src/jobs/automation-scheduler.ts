/**
 * Automation Scheduler - Executes automation rules based on schedule triggers
 *
 * Checks every 5 minutes for rules that should be executed based on:
 * - Cron expressions in triggers (custom or plan-based)
 * - Last execution time
 * - Rule active status
 * - User plan (FREE: 6h, PRO: 2-3h, BUSINESS: 30-90min)
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { RuleExecutor } from '../services/RuleExecutor';
import { PLAN_LIMITS, PlanType, getPlanLimits } from '../config/planLimits';

const prisma = new PrismaClient();

// Track running executions to prevent duplicates
const runningExecutions = new Set<string>();

/**
 * Parse common cron patterns to determine if rule should execute
 */
function shouldExecuteRule(
  lastRunAt: Date | null,
  cronExpression: string,
  now: Date = new Date()
): boolean {
  // First run - always execute
  if (!lastRunAt) {
    return true;
  }

  const minutesSinceLastRun = (now.getTime() - lastRunAt.getTime()) / (1000 * 60);

  // Parse common cron patterns
  // Format: "minute hour day month weekday"

  // Every X hours: "0 */X * * *"
  const everyHoursMatch = cronExpression.match(/0 \*\/(\d+) \* \* \*/);
  if (everyHoursMatch) {
    const hours = parseInt(everyHoursMatch[1]);
    return minutesSinceLastRun >= hours * 60;
  }

  // Every X minutes: "*/X * * * *"
  const everyMinutesMatch = cronExpression.match(/\*\/(\d+) \* \* \* \*/);
  if (everyMinutesMatch) {
    const minutes = parseInt(everyMinutesMatch[1]);
    return minutesSinceLastRun >= minutes;
  }

  // Daily at specific time: "0 H * * *" (es: "0 9 * * *" = 9:00 AM)
  const dailyMatch = cronExpression.match(/0 (\d+) \* \* \*/);
  if (dailyMatch) {
    const targetHour = parseInt(dailyMatch[1]);
    const currentHour = now.getHours();
    const lastRunHour = lastRunAt.getHours();

    // Execute if:
    // 1. Current hour matches target
    // 2. Last run was more than 23 hours ago OR was before target hour today
    if (currentHour === targetHour) {
      const hoursSinceLastRun = minutesSinceLastRun / 60;
      return hoursSinceLastRun >= 23 || lastRunHour < targetHour;
    }
  }

  // Weekly at specific day and time: "0 H * * D" (es: "0 9 * * 1" = Monday 9 AM)
  const weeklyMatch = cronExpression.match(/0 (\d+) \* \* (\d+)/);
  if (weeklyMatch) {
    const targetHour = parseInt(weeklyMatch[1]);
    const targetDay = parseInt(weeklyMatch[2]);
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    // Execute if current day/hour matches and last run was > 6 days ago
    if (currentDay === targetDay && currentHour === targetHour) {
      const daysSinceLastRun = minutesSinceLastRun / (60 * 24);
      return daysSinceLastRun >= 6;
    }
  }

  // Default: execute if last run was more than 24 hours ago
  return minutesSinceLastRun >= 1440;
}

/**
 * Check and execute automation rules
 */
async function checkAndExecuteRules() {
  try {
    const now = new Date();
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Automation Scheduler Check - ${now.toLocaleString()}`);
    console.log('='.repeat(70));

    // Find active rules with SCHEDULE triggers
    const rules = await prisma.automationRule.findMany({
      where: {
        isActive: true,
        triggers: {
          some: {
            type: 'SCHEDULE'
          }
        }
      },
      include: {
        triggers: {
          where: { type: 'SCHEDULE' }
        },
        channel: true,
        user: {
          include: {
            credentials: {
              where: { provider: 'TELEGRAM_BOT' }
            }
          }
        }
      }
    });

    if (rules.length === 0) {
      console.log('ℹ️  No active scheduled automation rules found\n');
      return;
    }

    console.log(`📋 Found ${rules.length} active scheduled rule(s)\n`);

    // Check each rule
    for (const rule of rules) {
      // Skip if already running
      if (runningExecutions.has(rule.id)) {
        console.log(`⏭️  Rule "${rule.name}" is already executing, skipping...`);
        continue;
      }

      // Check schedule triggers
      for (const trigger of rule.triggers) {
        const config = trigger.config as any;

        // Get user plan and use plan-based cron if custom cron not specified
        const userPlan = rule.user.plan as string;
        const planLimits = getPlanLimits(userPlan);
        const cronExpression = config.cron || planLimits.execution.cron;

        console.log(`\n📋 Rule: "${rule.name}"`);
        console.log(`   ID: ${rule.id}`);
        console.log(`   Plan: ${userPlan}`);
        console.log(`   Schedule: ${cronExpression}${config.cron ? ' (custom)' : ' (plan default)'}`);
        console.log(`   Last Run: ${rule.lastRunAt ? rule.lastRunAt.toLocaleString() : 'Never'}`);

        const shouldExecute = shouldExecuteRule(rule.lastRunAt, cronExpression, now);

        if (shouldExecute) {
          // Validate prerequisites
          if (!rule.channel) {
            console.log(`   ⚠️  No channel configured, skipping...`);
            continue;
          }

          if (!rule.user.credentials || rule.user.credentials.length === 0) {
            console.log(`   ⚠️  No Telegram bot token configured, skipping...`);
            continue;
          }

          console.log(`   ✅ Should execute NOW!`);

          // Mark as running
          runningExecutions.add(rule.id);

          // Execute asynchronously
          (async () => {
            try {
              console.log(`   🚀 Starting execution...`);

              const result = await RuleExecutor.executeRule(rule.id);

              if (result.success) {
                console.log(`   ✅ Execution completed successfully`);
                console.log(`   📊 Processed: ${result.dealsProcessed}, Published: ${result.dealsPublished}`);
              } else {
                console.log(`   ❌ Execution failed`);
                console.log(`   Errors: ${result.errors.join(', ')}`);
              }
            } catch (error: any) {
              console.error(`   ❌ Fatal error executing rule "${rule.name}":`, error.message);
            } finally {
              // Remove from running set
              runningExecutions.delete(rule.id);
            }
          })();
        } else {
          console.log(`   ⏭️  Not scheduled to run yet`);
        }
      }
    }

    console.log(`\n${'='.repeat(70)}\n`);
  } catch (error: any) {
    console.error('❌ Automation scheduler error:', error);
  }
}

/**
 * Start automation scheduler
 */
export function startAutomationScheduler() {
  console.log('\n🤖 Starting Automation Scheduler...');
  console.log('   Check Interval: Every 5 minutes');
  console.log('   Supported Triggers: SCHEDULE (cron expressions)');
  console.log('   Supported Actions: PUBLISH_CHANNEL');
  console.log('\n   Plan-Based Frequencies:');
  console.log(`   • FREE:     ${PLAN_LIMITS.FREE.execution.cron} (every 6 hours)`);
  console.log(`   • PRO:      ${PLAN_LIMITS.PRO.execution.cron} (every 2-3 hours)`);
  console.log(`   • BUSINESS: ${PLAN_LIMITS.BUSINESS.execution.cron} (every 30-90 min)\n`);

  // Run check every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await checkAndExecuteRules();
  });

  // Also run immediately on startup (for testing)
  console.log('🔍 Running initial check...');
  checkAndExecuteRules();

  console.log('✅ Automation Scheduler started successfully\n');
}

/**
 * Stop automation scheduler (for graceful shutdown)
 */
export function stopAutomationScheduler() {
  console.log('🛑 Stopping Automation Scheduler...');
  // Wait for running executions to complete
  if (runningExecutions.size > 0) {
    console.log(`⏳ Waiting for ${runningExecutions.size} running execution(s) to complete...`);
  }
  console.log('✅ Automation Scheduler stopped');
}
