/**
 * SchedulerService
 *
 * Manages the scheduling of deals for optimal publication times.
 * Uses ChannelInsights to determine best hours and handles priorities
 * for different deal types (lightning deals get immediate priority).
 */

import { PrismaClient } from '@prisma/client';
import {
    TimeSlot,
    SchedulingDecision,
    SchedulingReason,
    DealPriority,
    ScheduleDealInput,
    ChannelSchedulingStats,
    ScheduledDealWithRelations,
    DEAL_TYPE_PRIORITY,
    DEFAULT_BEST_HOURS,
    SCHEDULING_CONFIG
} from './types';

const prisma = new PrismaClient();

/**
 * Add hours to a date
 */
function addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get start of hour for a date
 */
function startOfHour(date: Date): Date {
    const result = new Date(date);
    result.setMinutes(0, 0, 0);
    return result;
}

/**
 * Check if date1 is before date2
 */
function isBefore(date1: Date, date2: Date): boolean {
    return date1.getTime() < date2.getTime();
}

export class SchedulerService {

    /**
     * Schedule a deal for publication
     * Returns the ID of the created ScheduledDeal
     */
    static async scheduleDeal(input: ScheduleDealInput): Promise<string> {
        const { channelId, ruleId } = input;

        // 1. Load rule to check publishingMode
        const rule = await prisma.automationRule.findUnique({
            where: { id: ruleId },
            select: { publishingMode: true }
        });

        if (!rule) {
            throw new Error(`Rule ${ruleId} not found`);
        }

        // 2. Determine deal priority
        const priority = this.getDealPriority(input.dealType);

        // 3. Calculate when to publish
        let decision: SchedulingDecision;

        if (rule.publishingMode === 'immediate') {
            // Immediate mode: publish right away (with minimum delay)
            decision = {
                scheduledFor: addMinutes(new Date(), SCHEDULING_CONFIG.minDelayMinutes),
                reason: 'immediate',
                slotScore: 0
            };
        } else if (priority === 'critical') {
            // Lightning deal: publish ASAP
            decision = await this.scheduleUrgent(channelId, input.dealEndTime);
        } else {
            // Smart scheduling: find optimal slot
            decision = await this.findOptimalSlot(channelId);
        }

        // 4. Create ScheduledDeal
        const scheduledDeal = await prisma.scheduledDeal.create({
            data: {
                channelId,
                ruleId,
                asin: input.asin,
                productTitle: input.productTitle,
                baseScore: input.baseScore,
                finalScore: input.finalScore,
                dealType: input.dealType,
                originalPrice: input.originalPrice,
                dealPrice: input.dealPrice,
                discount: input.discount,
                category: input.category,
                dealEndTime: input.dealEndTime,
                scheduledFor: decision.scheduledFor,
                reason: decision.reason,
                status: 'pending'
            }
        });

        console.log(`[Scheduler] Scheduled deal ${input.asin} for ${decision.scheduledFor.toISOString()} (${decision.reason})`);

        return scheduledDeal.id;
    }

    /**
     * Urgent scheduling for Lightning Deals
     */
    private static async scheduleUrgent(channelId: string, dealEndTime?: Date): Promise<SchedulingDecision> {
        const now = new Date();

        // Publish within X minutes, or sooner if deal expires
        let scheduledFor = addMinutes(now, SCHEDULING_CONFIG.lightningMaxDelayMinutes);

        if (dealEndTime && isBefore(dealEndTime, scheduledFor)) {
            // Deal expires before our delay, publish immediately
            scheduledFor = addMinutes(now, 2);
        }

        // Note: For lightning deals, we ignore the max deals per hour limit
        // as they are priority items

        return {
            scheduledFor,
            reason: 'lightning_priority',
            slotScore: 100
        };
    }

    /**
     * Find the optimal slot for publication
     */
    private static async findOptimalSlot(channelId: string): Promise<SchedulingDecision> {
        // 1. Load channel insights
        const insights = await prisma.channelInsights.findUnique({
            where: { channelId },
            select: { bestHours: true, hourlyStats: true }
        });

        const bestHours = insights?.bestHours?.length
            ? insights.bestHours
            : DEFAULT_BEST_HOURS;

        // 2. Build list of available slots for the next 24h
        const slots = await this.getAvailableSlots(channelId, bestHours);

        if (slots.length === 0) {
            // No slot available, fallback to next hour
            return {
                scheduledFor: addHours(new Date(), 1),
                reason: 'fallback',
                slotScore: 0
            };
        }

        // 3. Take the best available slot
        const bestSlot = slots[0]; // Already sorted by score

        return {
            scheduledFor: bestSlot.time,
            reason: bestSlot.score > 50 ? 'best_hour' : 'next_slot',
            slotScore: bestSlot.score
        };
    }

    /**
     * Get available slots sorted by score
     */
    private static async getAvailableSlots(
        channelId: string,
        bestHours: number[]
    ): Promise<Array<{ time: Date; score: number }>> {
        const now = new Date();
        const slots: Array<{ time: Date; score: number }> = [];

        // Look at the next 24 hours
        for (let hoursAhead = 1; hoursAhead <= SCHEDULING_CONFIG.maxScheduleAheadHours; hoursAhead++) {
            const slotTime = addHours(startOfHour(now), hoursAhead);
            const hour = slotTime.getHours();

            // Skip dead hours
            if (SCHEDULING_CONFIG.deadHours.includes(hour)) {
                continue;
            }

            // Count deals already scheduled in this slot
            const slotEnd = addHours(slotTime, 1);
            const dealsInSlot = await prisma.scheduledDeal.count({
                where: {
                    channelId,
                    status: 'pending',
                    scheduledFor: {
                        gte: slotTime,
                        lt: slotEnd
                    }
                }
            });

            // Slot full?
            if (dealsInSlot >= SCHEDULING_CONFIG.maxDealsPerHour) {
                continue;
            }

            // Calculate slot score
            const hourRank = bestHours.indexOf(hour);
            let score: number;

            if (hourRank === 0) score = 100;
            else if (hourRank === 1) score = 90;
            else if (hourRank === 2) score = 80;
            else if (hourRank === 3) score = 70;
            else if (hourRank === 4) score = 60;
            else if (hourRank >= 0) score = 50;
            else score = 30; // Not in best hours

            // Penalize slots far in the future
            if (hoursAhead > 12) {
                score -= 10;
            }

            // Bonus for slots with fewer deals (spreading)
            if (dealsInSlot === 0) {
                score += 5;
            }

            slots.push({ time: slotTime, score: Math.max(0, score) });
        }

        // Sort by score (descending)
        slots.sort((a, b) => b.score - a.score);

        return slots;
    }

    /**
     * Determine deal priority based on type
     */
    private static getDealPriority(dealType?: string): DealPriority {
        if (!dealType) return 'normal';
        return DEAL_TYPE_PRIORITY[dealType] || 'normal';
    }

    /**
     * Get deals ready for publication
     */
    static async getDealsReadyToPublish(limit: number = SCHEDULING_CONFIG.processBatchSize): Promise<ScheduledDealWithRelations[]> {
        const now = new Date();

        return prisma.scheduledDeal.findMany({
            where: {
                status: 'pending',
                scheduledFor: { lte: now }
            },
            include: {
                channel: {
                    select: {
                        id: true,
                        channelId: true,
                        userId: true,
                        name: true,
                        credential: {
                            select: {
                                id: true,
                                key: true
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                brandId: true
                            }
                        }
                    }
                },
                rule: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        copyMode: true,
                        messageTemplate: true,
                        customStylePrompt: true,
                        llmModel: true,
                        includeKeepaChart: true
                    }
                }
            },
            orderBy: [
                { scheduledFor: 'asc' }
            ],
            take: limit
        }) as Promise<ScheduledDealWithRelations[]>;
    }

    /**
     * Mark a deal as published
     */
    static async markAsPublished(
        scheduledDealId: string,
        telegramMessageId: string,
        trackingIdUsed?: string
    ): Promise<void> {
        await prisma.scheduledDeal.update({
            where: { id: scheduledDealId },
            data: {
                status: 'published',
                publishedAt: new Date(),
                telegramMessageId,
                trackingIdUsed
            }
        });
    }

    /**
     * Mark a deal as failed
     * Returns true if should retry, false if max retries reached
     */
    static async markAsFailed(
        scheduledDealId: string,
        reason: string
    ): Promise<boolean> {
        const deal = await prisma.scheduledDeal.findUnique({
            where: { id: scheduledDealId },
            select: { retryCount: true, maxRetries: true }
        });

        if (!deal) return false;

        if (deal.retryCount >= deal.maxRetries) {
            // Max retries reached, mark as permanently failed
            await prisma.scheduledDeal.update({
                where: { id: scheduledDealId },
                data: {
                    status: 'failed',
                    failedAt: new Date(),
                    lastError: reason
                }
            });
            return false; // Don't retry
        }

        // Increment retry and reschedule
        await prisma.scheduledDeal.update({
            where: { id: scheduledDealId },
            data: {
                retryCount: { increment: 1 },
                scheduledFor: addMinutes(new Date(), SCHEDULING_CONFIG.retryDelayMinutes),
                lastError: reason
            }
        });

        return true; // Will retry
    }

    /**
     * Cancel a scheduled deal
     */
    static async cancelScheduledDeal(
        scheduledDealId: string,
        reason: string
    ): Promise<void> {
        await prisma.scheduledDeal.update({
            where: { id: scheduledDealId },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelReason: reason
            }
        });
    }

    /**
     * Cancel deals by ASIN (e.g., when deal expires)
     */
    static async cancelDealsByAsin(
        channelId: string,
        asin: string,
        reason: string
    ): Promise<number> {
        const result = await prisma.scheduledDeal.updateMany({
            where: {
                channelId,
                asin,
                status: 'pending'
            },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelReason: reason
            }
        });

        return result.count;
    }

    /**
     * Check if a deal is already scheduled for a channel
     */
    static async isDealScheduled(channelId: string, asin: string): Promise<boolean> {
        const count = await prisma.scheduledDeal.count({
            where: {
                channelId,
                asin,
                status: 'pending'
            }
        });

        return count > 0;
    }

    /**
     * Get scheduling stats for a channel
     */
    static async getSchedulingStats(channelId: string): Promise<ChannelSchedulingStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pending, publishedToday, cancelledToday, failedToday, nextDeal] = await Promise.all([
            prisma.scheduledDeal.count({
                where: { channelId, status: 'pending' }
            }),
            prisma.scheduledDeal.count({
                where: {
                    channelId,
                    status: 'published',
                    publishedAt: { gte: today }
                }
            }),
            prisma.scheduledDeal.count({
                where: {
                    channelId,
                    status: 'cancelled',
                    cancelledAt: { gte: today }
                }
            }),
            prisma.scheduledDeal.count({
                where: {
                    channelId,
                    status: 'failed',
                    failedAt: { gte: today }
                }
            }),
            prisma.scheduledDeal.findFirst({
                where: { channelId, status: 'pending' },
                orderBy: { scheduledFor: 'asc' },
                select: { scheduledFor: true }
            })
        ]);

        return {
            pending,
            publishedToday,
            cancelledToday,
            failedToday,
            nextScheduled: nextDeal?.scheduledFor || null
        };
    }

    /**
     * Cleanup stale scheduled deals (pending for too long)
     */
    static async cleanupStaleDeals(): Promise<number> {
        const cutoff = new Date(Date.now() - SCHEDULING_CONFIG.staleThresholdHours * 60 * 60 * 1000);

        const result = await prisma.scheduledDeal.updateMany({
            where: {
                status: 'pending',
                scheduledFor: { lt: cutoff }
            },
            data: {
                status: 'expired',
                cancelledAt: new Date(),
                cancelReason: 'stale'
            }
        });

        return result.count;
    }

    /**
     * Get pending deals for a channel
     */
    static async getPendingDeals(channelId: string, limit: number = 50): Promise<any[]> {
        return prisma.scheduledDeal.findMany({
            where: {
                channelId,
                status: 'pending'
            },
            orderBy: { scheduledFor: 'asc' },
            take: limit
        });
    }
}

export default SchedulerService;
