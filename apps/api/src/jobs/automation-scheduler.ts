/**
 * Automation Scheduler - Executes automation rules based on nextRunAt
 *
 * NEW SYSTEM (v2):
 * - Uses nextRunAt field instead of cron parsing
 * - Applies jitter to avoid bot-like behavior
 * - Supports deduplication to avoid publishing same deals
 * - Tracks empty runs for user notification
 *
 * Checks every minute for rules where nextRunAt <= now
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { RuleExecutor } from '../services/RuleExecutor';

const prisma = new PrismaClient();

// Track running executions to prevent duplicates
const runningExecutions = new Set<string>();

/**
 * Calculate next run time with jitter to avoid bot-like behavior
 */
function calculateNextRunWithJitter(intervalMinutes: number): Date {
  // Jitter ±15% dell'intervallo (max ±30 min)
  const jitterMax = Math.min(intervalMinutes * 0.15, 30);
  const jitter = (Math.random() - 0.5) * 2 * jitterMax;
  return new Date(Date.now() + (intervalMinutes + jitter) * 60 * 1000);
}

/**
 * Check and execute automation rules based on nextRunAt
 */
async function checkAndExecuteRules() {
  try {
    const now = new Date();

    // Find active rules where nextRunAt <= now
    const dueRules = await prisma.automationRule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now
        }
      },
      include: {
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

    if (dueRules.length === 0) {
      return; // Nothing to do
    }

    console.log(`\n[Scheduler] Found ${dueRules.length} rule(s) due for execution`);

    for (const rule of dueRules) {
      // Skip if already running
      if (runningExecutions.has(rule.id)) {
        console.log(`[Scheduler] Rule "${rule.name}" already executing, skipping`);
        continue;
      }

      // Validate prerequisites
      if (!rule.channel) {
        console.log(`[Scheduler] Rule "${rule.name}" has no channel, skipping`);
        // Still update nextRunAt to avoid re-checking every minute
        await updateNextRun(rule.id, rule.intervalMinutes);
        continue;
      }

      if (!rule.user.credentials || rule.user.credentials.length === 0) {
        console.log(`[Scheduler] Rule "${rule.name}" user has no Telegram bot, skipping`);
        await updateNextRun(rule.id, rule.intervalMinutes);
        continue;
      }

      // Mark as running
      runningExecutions.add(rule.id);

      // Execute asynchronously (don't block other rules)
      executeRuleAsync(rule);
    }
  } catch (error: any) {
    console.error('[Scheduler] Error:', error.message);
  }
}

/**
 * Execute a rule asynchronously
 */
async function executeRuleAsync(rule: any) {
  const startTime = Date.now();

  try {
    console.log(`[Scheduler] Executing rule "${rule.name}" (${rule.id})`);

    const result = await RuleExecutor.executeRule(rule.id);

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(
        `[Scheduler] Rule "${rule.name}" completed: ` +
        `${result.dealsPublished}/${result.dealsProcessed} deals published (${duration}ms)`
      );

      // Reset empty runs counter on success
      if (result.dealsPublished > 0) {
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: { emptyRunsCount: 0 }
        });
      } else {
        // Increment empty runs counter
        await incrementEmptyRunsCount(rule.id);
      }
    } else {
      console.log(
        `[Scheduler] Rule "${rule.name}" failed: ${result.errors.join(', ')}`
      );
      // Increment empty runs on failure too
      await incrementEmptyRunsCount(rule.id);
    }

    // Update next run time
    await updateNextRun(rule.id, rule.intervalMinutes);

  } catch (error: any) {
    console.error(`[Scheduler] Fatal error executing rule "${rule.name}":`, error.message);

    // Still update next run to avoid blocking
    await updateNextRun(rule.id, rule.intervalMinutes);
    await incrementEmptyRunsCount(rule.id);

  } finally {
    runningExecutions.delete(rule.id);
  }
}

/**
 * Update nextRunAt with jitter
 */
async function updateNextRun(ruleId: string, intervalMinutes: number) {
  const nextRun = calculateNextRunWithJitter(intervalMinutes);

  await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      lastRunAt: new Date(),
      nextRunAt: nextRun,
      totalRuns: { increment: 1 }
    }
  });
}

/**
 * Increment empty runs counter and check for notification threshold
 */
async function incrementEmptyRunsCount(ruleId: string) {
  const updated = await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      emptyRunsCount: { increment: 1 }
    },
    select: {
      emptyRunsCount: true,
      name: true,
      userId: true
    }
  });

  // Notify user after 3 consecutive empty runs
  if (updated.emptyRunsCount === 3) {
    console.log(
      `[Scheduler] Rule "${updated.name}" had 3 empty runs, should notify user`
    );

    // TODO: Send notification to user
    // await sendEmptyRunsNotification(updated.userId, updated.name);
  }
}

/**
 * Initialize nextRunAt for rules that don't have it set
 * (for migration from old system)
 */
async function initializeMissingNextRunAt() {
  const rulesWithoutNextRun = await prisma.automationRule.findMany({
    where: {
      isActive: true,
      nextRunAt: null
    },
    select: {
      id: true,
      intervalMinutes: true,
      name: true
    }
  });

  if (rulesWithoutNextRun.length === 0) {
    return;
  }

  console.log(`[Scheduler] Initializing nextRunAt for ${rulesWithoutNextRun.length} rule(s)`);

  for (const rule of rulesWithoutNextRun) {
    const nextRun = calculateNextRunWithJitter(rule.intervalMinutes);

    await prisma.automationRule.update({
      where: { id: rule.id },
      data: { nextRunAt: nextRun }
    });

    console.log(`[Scheduler] Set nextRunAt for "${rule.name}" to ${nextRun.toISOString()}`);
  }
}

/**
 * Start automation scheduler
 */
export function startAutomationScheduler() {
  console.log('\n[Scheduler] Starting Automation Scheduler v2...');
  console.log('[Scheduler] Check Interval: Every minute');
  console.log('[Scheduler] Using: nextRunAt + jitter system\n');

  // Initialize missing nextRunAt values
  initializeMissingNextRunAt();

  // Run check every minute
  cron.schedule('* * * * *', async () => {
    await checkAndExecuteRules();
  });

  // Also run immediately on startup
  checkAndExecuteRules();

  console.log('[Scheduler] Started successfully\n');
}

/**
 * Stop automation scheduler (for graceful shutdown)
 */
export function stopAutomationScheduler() {
  console.log('[Scheduler] Stopping...');
  if (runningExecutions.size > 0) {
    console.log(`[Scheduler] Waiting for ${runningExecutions.size} execution(s) to complete...`);
  }
  console.log('[Scheduler] Stopped');
}
