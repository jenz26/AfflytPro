/**
 * Automation Scheduler - Executes automation rules based on nextRunAt
 * Checks every minute for rules where nextRunAt <= now
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { RuleExecutor } from '../services/RuleExecutor';

const prisma = new PrismaClient();
const runningExecutions = new Set<string>();

/**
 * Calculate next run time with jitter to avoid bot-like behavior
 */
function calculateNextRunWithJitter(intervalMinutes: number): Date {
  const jitterMax = Math.min(intervalMinutes * 0.15, 30);
  const jitter = (Math.random() - 0.5) * 2 * jitterMax;
  return new Date(Date.now() + (intervalMinutes + jitter) * 60 * 1000);
}

/**
 * Check and execute automation rules based on nextRunAt
 */
async function checkAndExecuteRules() {
  try {
    const dueRules = await prisma.automationRule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: new Date() }
      },
      include: {
        channel: true,
        user: {
          include: {
            credentials: { where: { provider: 'TELEGRAM_BOT' } }
          }
        }
      }
    });

    if (dueRules.length === 0) return;

    for (const rule of dueRules) {
      if (runningExecutions.has(rule.id)) continue;
      if (!rule.channel || !rule.user.credentials?.length) {
        await updateNextRun(rule.id, rule.intervalMinutes);
        continue;
      }

      runningExecutions.add(rule.id);
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
  try {
    const result = await RuleExecutor.executeRule(rule.id);

    if (result.dealsPublished > 0) {
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { emptyRunsCount: 0 }
      });
    } else {
      await incrementEmptyRunsCount(rule.id);
    }

    await updateNextRun(rule.id, rule.intervalMinutes);

  } catch (error: any) {
    console.error(`[Scheduler] Rule "${rule.name}" failed:`, error.message);
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
  await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      lastRunAt: new Date(),
      nextRunAt: calculateNextRunWithJitter(intervalMinutes),
      totalRuns: { increment: 1 }
    }
  });
}

/**
 * Increment empty runs counter
 */
async function incrementEmptyRunsCount(ruleId: string) {
  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { emptyRunsCount: { increment: 1 } }
  });
}

/**
 * Initialize nextRunAt for rules that don't have it set
 */
async function initializeMissingNextRunAt() {
  const rulesWithoutNextRun = await prisma.automationRule.findMany({
    where: { isActive: true, nextRunAt: null },
    select: { id: true, intervalMinutes: true }
  });

  for (const rule of rulesWithoutNextRun) {
    await prisma.automationRule.update({
      where: { id: rule.id },
      data: { nextRunAt: calculateNextRunWithJitter(rule.intervalMinutes) }
    });
  }
}

/**
 * Start automation scheduler
 */
export function startAutomationScheduler() {
  console.log('[Scheduler] Started');
  initializeMissingNextRunAt();
  cron.schedule('* * * * *', checkAndExecuteRules);
  checkAndExecuteRules();
}

/**
 * Stop automation scheduler
 */
export function stopAutomationScheduler() {
  // Graceful shutdown handled by cron
}
