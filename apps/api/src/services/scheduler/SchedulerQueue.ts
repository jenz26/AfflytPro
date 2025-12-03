/**
 * Scheduler Queue Service
 *
 * BullMQ-based queue for scheduled posts execution.
 * Uses a separate queue from the Keepa automation system.
 *
 * Queue name: 'scheduler-posts' (isolated from 'keepa:queue')
 */

import { Queue, Worker, Job, QueueEvents, type ConnectionOptions } from 'bullmq';
import type { PrismaClient, ExecutionStatus } from '@prisma/client';
import type Redis from 'ioredis';
import { calculateNextRunAt, calculateRetryDelay, RETRY_CONFIG, SchedulerErrorCode } from '../../lib/scheduler-utils';
import { TelegramBotService, convertLLMToMarkdownV2 } from '../TelegramBotService';
import { SecurityService } from '../SecurityService';
import { captureException, addBreadcrumb } from '../../lib/sentry';

// ============================================
// TYPES
// ============================================

export interface ScheduledPostJobData {
  scheduledPostId: string;
  executionId?: string;
  retryCount?: number;
}

export interface ScheduledPostJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: SchedulerErrorCode;
}

interface ConflictSettings {
  checkBeforePublish: boolean;
  skipIfDealPosted: boolean;
  rescheduleMinutes?: number;
  cooldownMinutes: number;
}

// ============================================
// QUEUE
// ============================================

const QUEUE_NAME = 'scheduler-posts';

export class SchedulerQueue {
  private queue: Queue<ScheduledPostJobData, ScheduledPostJobResult>;
  private worker: Worker<ScheduledPostJobData, ScheduledPostJobResult> | null = null;
  private queueEvents: QueueEvents | null = null;
  private prisma: PrismaClient;
  private redis: Redis;
  private securityService: SecurityService;

  constructor(redis: Redis, prisma: PrismaClient) {
    this.redis = redis;
    this.prisma = prisma;
    this.securityService = new SecurityService();

    // Create queue with Redis connection
    const connection: ConnectionOptions = {
      host: redis.options.host,
      port: redis.options.port,
      password: redis.options.password,
      db: redis.options.db,
    };

    this.queue = new Queue<ScheduledPostJobData, ScheduledPostJobResult>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: RETRY_CONFIG.maxRetries,
        backoff: {
          type: 'exponential',
          delay: RETRY_CONFIG.initialDelayMs,
        },
        removeOnComplete: {
          count: 1000, // Keep last 1000 completed jobs
          age: 86400, // Remove after 24h
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
          age: 604800, // Remove after 7 days
        },
      },
    });
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  async start(): Promise<void> {
    const connection: ConnectionOptions = {
      host: this.redis.options.host,
      port: this.redis.options.port,
      password: this.redis.options.password,
      db: this.redis.options.db,
    };

    // Create worker
    this.worker = new Worker<ScheduledPostJobData, ScheduledPostJobResult>(
      QUEUE_NAME,
      async (job) => this.processJob(job),
      {
        connection,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 10,
          duration: 1000, // Max 10 jobs per second (Telegram rate limit)
        },
      }
    );

    // Event handlers
    this.worker.on('completed', (job, result) => {
      console.log(`[SchedulerQueue] Job ${job.id} completed:`, result.success ? 'success' : 'failed');
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[SchedulerQueue] Job ${job?.id} failed:`, error.message);
      captureException(error, {
        component: 'SchedulerQueue',
        operation: 'worker.failed',
        jobId: job?.id,
        jobData: job?.data,
      });
    });

    this.worker.on('error', (error) => {
      console.error('[SchedulerQueue] Worker error:', error);
      captureException(error, {
        component: 'SchedulerQueue',
        operation: 'worker.error',
      });
    });

    // Queue events for monitoring
    this.queueEvents = new QueueEvents(QUEUE_NAME, { connection });

    console.log('[SchedulerQueue] Started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queueEvents) {
      await this.queueEvents.close();
      this.queueEvents = null;
    }
    await this.queue.close();
    console.log('[SchedulerQueue] Stopped');
  }

  // ============================================
  // ENQUEUE
  // ============================================

  /**
   * Schedule a job for a specific time
   */
  async schedulePost(scheduledPostId: string, runAt: Date): Promise<string> {
    const delay = Math.max(0, runAt.getTime() - Date.now());

    const job = await this.queue.add(
      'scheduled-post',
      { scheduledPostId },
      {
        delay,
        jobId: `post-${scheduledPostId}-${runAt.getTime()}`,
      }
    );

    console.log(`[SchedulerQueue] Scheduled post ${scheduledPostId} for ${runAt.toISOString()} (delay: ${delay}ms)`);
    return job.id || '';
  }

  /**
   * Cancel a scheduled job
   */
  async cancelPost(scheduledPostId: string): Promise<void> {
    // Find and remove jobs for this post
    const jobs = await this.queue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if (job.data.scheduledPostId === scheduledPostId) {
        await job.remove();
        console.log(`[SchedulerQueue] Cancelled job ${job.id} for post ${scheduledPostId}`);
      }
    }
  }

  // ============================================
  // JOB PROCESSING
  // ============================================

  private async processJob(job: Job<ScheduledPostJobData, ScheduledPostJobResult>): Promise<ScheduledPostJobResult> {
    const { scheduledPostId, retryCount = 0 } = job.data;

    addBreadcrumb(`Processing scheduled post ${scheduledPostId}`, 'scheduler.job', {
      jobId: job.id,
      scheduledPostId,
      retryCount,
    });

    // 1. Get scheduled post with relations
    const scheduledPost = await this.prisma.scheduledPost.findUnique({
      where: { id: scheduledPostId },
      include: {
        channel: {
          include: {
            credential: true,
          },
        },
        user: {
          select: {
            id: true,
            brandId: true,
          },
        },
      },
    });

    if (!scheduledPost) {
      console.error(`[SchedulerQueue] Scheduled post ${scheduledPostId} not found`);
      return {
        success: false,
        error: 'Scheduled post not found',
        errorCode: SchedulerErrorCode.INVALID_SETTINGS,
      };
    }

    if (!scheduledPost.isActive) {
      console.log(`[SchedulerQueue] Scheduled post ${scheduledPostId} is inactive, skipping`);
      return {
        success: false,
        error: 'Scheduled post is inactive',
      };
    }

    // 2. Create execution record
    const execution = await this.prisma.scheduledPostExecution.create({
      data: {
        scheduledPostId,
        status: 'RUNNING',
        retryCount,
      },
    });

    try {
      // 3. Check channel
      if (!scheduledPost.channel) {
        throw new SchedulerError('Channel not found', SchedulerErrorCode.CHANNEL_NOT_FOUND);
      }

      if (scheduledPost.channel.status !== 'CONNECTED') {
        throw new SchedulerError('Channel disconnected', SchedulerErrorCode.CHANNEL_DISCONNECTED);
      }

      if (!scheduledPost.channel.credential) {
        throw new SchedulerError('Channel has no credential', SchedulerErrorCode.CHANNEL_DISCONNECTED);
      }

      // 4. Check conflict settings
      const conflictSettings = scheduledPost.conflictSettings as ConflictSettings | null;
      if (conflictSettings?.checkBeforePublish) {
        const hasConflict = await this.checkDealConflict(scheduledPost.channelId, conflictSettings.cooldownMinutes);

        if (hasConflict) {
          if (conflictSettings.skipIfDealPosted) {
            // Skip this execution
            await this.updateExecution(execution.id, 'SKIPPED_CONFLICT', 'Skipped due to recent deal post');
            await this.scheduleNextRun(scheduledPost);
            return {
              success: false,
              error: 'Skipped due to deal conflict',
              errorCode: SchedulerErrorCode.CONFLICT_WITH_DEAL,
            };
          } else if (conflictSettings.rescheduleMinutes) {
            // Reschedule for later
            const newRunAt = new Date(Date.now() + conflictSettings.rescheduleMinutes * 60 * 1000);
            await this.updateExecution(execution.id, 'RESCHEDULED', `Rescheduled to ${newRunAt.toISOString()}`);
            await this.schedulePost(scheduledPostId, newRunAt);
            return {
              success: false,
              error: 'Rescheduled due to deal conflict',
              errorCode: SchedulerErrorCode.CONFLICT_WITH_DEAL,
            };
          }
        }
      }

      // 5. Decrypt bot token
      let botToken: string;
      try {
        botToken = this.securityService.decrypt(scheduledPost.channel.credential.key);
      } catch {
        throw new SchedulerError('Failed to decrypt credential', SchedulerErrorCode.CHANNEL_DISCONNECTED);
      }

      // 6. Send message to Telegram (convert Markdown to MarkdownV2)
      const formattedContent = convertLLMToMarkdownV2(scheduledPost.content);
      const result = await TelegramBotService.sendMessage(
        scheduledPost.channel.channelId,
        botToken,
        {
          text: formattedContent,
          parseMode: 'MarkdownV2',
          disableWebPagePreview: false,
        }
      );

      if (!result.success) {
        throw new SchedulerError(
          result.error || 'Telegram API error',
          SchedulerErrorCode.TELEGRAM_API_ERROR
        );
      }

      // 7. Update execution as success
      await this.updateExecution(execution.id, 'SUCCESS', undefined, result.messageId);

      // 8. Update scheduled post stats
      await this.prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          lastRunAt: new Date(),
          runCount: { increment: 1 },
        },
      });

      // 9. Schedule next run
      await this.scheduleNextRun(scheduledPost);

      console.log(`[SchedulerQueue] Successfully published post ${scheduledPostId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const schedulerError = error instanceof SchedulerError ? error : new SchedulerError(
        (error as Error).message,
        SchedulerErrorCode.TELEGRAM_API_ERROR
      );

      // Update execution as failed
      await this.updateExecution(execution.id, 'FAILED', schedulerError.message);

      // Update fail count
      await this.prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          failCount: { increment: 1 },
        },
      });

      captureException(error as Error, {
        component: 'SchedulerQueue',
        operation: 'processJob',
        scheduledPostId,
        executionId: execution.id,
        errorCode: schedulerError.code,
      });

      // Throw to trigger retry
      throw error;
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private async updateExecution(
    executionId: string,
    status: ExecutionStatus,
    error?: string,
    messageId?: string
  ): Promise<void> {
    await this.prisma.scheduledPostExecution.update({
      where: { id: executionId },
      data: {
        status,
        error,
        messageId,
      },
    });
  }

  private async scheduleNextRun(scheduledPost: {
    id: string;
    schedule: string;
    timezone: string;
    isActive: boolean;
  }): Promise<void> {
    if (!scheduledPost.isActive) {
      return;
    }

    const nextRunAt = calculateNextRunAt(scheduledPost.schedule, scheduledPost.timezone);

    await this.prisma.scheduledPost.update({
      where: { id: scheduledPost.id },
      data: { nextRunAt },
    });

    await this.schedulePost(scheduledPost.id, nextRunAt);
  }

  /**
   * Check if a deal was posted recently to this channel
   */
  private async checkDealConflict(channelId: string, cooldownMinutes: number): Promise<boolean> {
    const cooldownStart = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    // Check ChannelDealHistory for recent publishes
    const recentDeal = await this.prisma.channelDealHistory.findFirst({
      where: {
        channelId,
        publishedAt: { gte: cooldownStart },
      },
    });

    return !!recentDeal;
  }

  // ============================================
  // METRICS
  // ============================================

  async getMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}

// ============================================
// CUSTOM ERROR
// ============================================

class SchedulerError extends Error {
  code: SchedulerErrorCode;

  constructor(message: string, code: SchedulerErrorCode) {
    super(message);
    this.name = 'SchedulerError';
    this.code = code;
  }
}
