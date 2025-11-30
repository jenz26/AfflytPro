/**
 * Scheduler Cron Service
 *
 * Runs every minute to check for scheduled posts that need to be executed.
 * Enqueues jobs to the SchedulerQueue for processing.
 */

import cron, { ScheduledTask } from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import { SchedulerQueue } from './SchedulerQueue';
import { calculateNextRunAt } from '../../lib/scheduler-utils';
import { captureException, addBreadcrumb } from '../../lib/sentry';

export class SchedulerCron {
  private prisma: PrismaClient;
  private redis: Redis;
  private queue: SchedulerQueue;
  private cronJob: ScheduledTask | null = null;

  constructor(prisma: PrismaClient, redis: Redis, queue: SchedulerQueue) {
    this.prisma = prisma;
    this.redis = redis;
    this.queue = queue;
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  start(): void {
    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkDuePosts();
    });

    console.log('[SchedulerCron] Started - checking posts every minute');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    console.log('[SchedulerCron] Stopped');
  }

  // ============================================
  // CHECK DUE POSTS
  // ============================================

  private async checkDuePosts(): Promise<void> {
    const now = new Date();

    try {
      // Find scheduled posts that are due
      const duePosts = await this.prisma.scheduledPost.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now },
        },
        select: {
          id: true,
          name: true,
          type: true,
          schedule: true,
          timezone: true,
          nextRunAt: true,
        },
      });

      if (duePosts.length === 0) {
        return;
      }

      console.log(`[SchedulerCron] Found ${duePosts.length} due posts`);

      addBreadcrumb(`Processing ${duePosts.length} due posts`, 'scheduler.cron', {
        postIds: duePosts.map(p => p.id),
      });

      // Enqueue each post for processing
      for (const post of duePosts) {
        try {
          // Calculate next run time immediately to prevent re-processing
          const nextRunAt = calculateNextRunAt(post.schedule, post.timezone);

          // Update nextRunAt first to prevent duplicate processing
          await this.prisma.scheduledPost.update({
            where: { id: post.id },
            data: { nextRunAt },
          });

          // Enqueue the job (runs now)
          await this.queue.schedulePost(post.id, new Date());

          console.log(`[SchedulerCron] Enqueued post ${post.id} (${post.name}), next run: ${nextRunAt.toISOString()}`);
        } catch (error) {
          console.error(`[SchedulerCron] Error enqueueing post ${post.id}:`, error);

          captureException(error as Error, {
            component: 'SchedulerCron',
            operation: 'enqueuePost',
            postId: post.id,
            postName: post.name,
          });
        }
      }
    } catch (error) {
      console.error('[SchedulerCron] Error checking due posts:', error);

      captureException(error as Error, {
        component: 'SchedulerCron',
        operation: 'checkDuePosts',
      });
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Initialize next run times for all active posts (on startup)
   */
  async initializeNextRunTimes(): Promise<void> {
    try {
      const posts = await this.prisma.scheduledPost.findMany({
        where: {
          isActive: true,
          nextRunAt: null,
        },
        select: {
          id: true,
          schedule: true,
          timezone: true,
        },
      });

      if (posts.length === 0) {
        return;
      }

      console.log(`[SchedulerCron] Initializing ${posts.length} posts without nextRunAt`);

      for (const post of posts) {
        try {
          const nextRunAt = calculateNextRunAt(post.schedule, post.timezone);

          await this.prisma.scheduledPost.update({
            where: { id: post.id },
            data: { nextRunAt },
          });

          // Schedule the job
          await this.queue.schedulePost(post.id, nextRunAt);

          console.log(`[SchedulerCron] Initialized post ${post.id}, next run: ${nextRunAt.toISOString()}`);
        } catch (error) {
          console.error(`[SchedulerCron] Error initializing post ${post.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[SchedulerCron] Error initializing posts:', error);
    }
  }

  /**
   * Reschedule a specific post (called after manual changes)
   */
  async reschedulePost(postId: string): Promise<void> {
    const post = await this.prisma.scheduledPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        schedule: true,
        timezone: true,
        isActive: true,
      },
    });

    if (!post || !post.isActive) {
      // Cancel any existing jobs
      await this.queue.cancelPost(postId);
      return;
    }

    // Cancel existing jobs
    await this.queue.cancelPost(postId);

    // Calculate new next run time
    const nextRunAt = calculateNextRunAt(post.schedule, post.timezone);

    // Update in database
    await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { nextRunAt },
    });

    // Schedule new job
    await this.queue.schedulePost(postId, nextRunAt);

    console.log(`[SchedulerCron] Rescheduled post ${postId}, next run: ${nextRunAt.toISOString()}`);
  }
}
