/**
 * TrackingIdPoolService
 *
 * Manages Amazon Attribution tracking IDs per user for precise conversion tracking.
 * Uses FIFO assignment with 24h TTL and early release on deal expiry.
 *
 * Flow:
 * 1. User adds tracking IDs via API
 * 2. KeepaWorker calls acquireTrackingId() before publishing
 * 3. If available, trackingId is assigned to the deal with 24h TTL
 * 4. Background job checks deal validity and releases early if expired
 * 5. After 24h (or early release), trackingId returns to pool
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TTL for tracking ID assignment (24 hours)
const TRACKING_ID_TTL_MS = 24 * 60 * 60 * 1000;

export interface TrackingIdAssignment {
    trackingId: string;
    trackingRecordId: string;
    expiresAt: Date;
}

export interface TrackingIdStats {
    total: number;
    available: number;
    inUse: number;
    trackingIds: {
        id: string;
        trackingId: string;
        status: string;
        totalUses: number;
        lastUsedAt: Date | null;
        assignedAt: Date | null;
        expiresAt: Date | null;
    }[];
}

/**
 * TrackingIdPoolService
 *
 * Manages a pool of Amazon Attribution tracking IDs per user.
 */
export class TrackingIdPoolService {
    /**
     * Add a new tracking ID to the user's pool
     */
    async addTrackingId(userId: string, trackingId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if tracking ID already exists for this user
            const existing = await prisma.userTrackingId.findUnique({
                where: { userId_trackingId: { userId, trackingId } }
            });

            if (existing) {
                return { success: false, error: 'Tracking ID already exists for this user' };
            }

            await prisma.userTrackingId.create({
                data: {
                    userId,
                    trackingId,
                    status: 'available'
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[TrackingIdPool] Error adding tracking ID:', error);
            return { success: false, error: 'Failed to add tracking ID' };
        }
    }

    /**
     * Add multiple tracking IDs at once
     */
    async addTrackingIds(userId: string, trackingIds: string[]): Promise<{ added: number; skipped: number; errors: string[] }> {
        const result = { added: 0, skipped: 0, errors: [] as string[] };

        for (const trackingId of trackingIds) {
            const res = await this.addTrackingId(userId, trackingId);
            if (res.success) {
                result.added++;
            } else {
                result.skipped++;
                if (res.error) result.errors.push(`${trackingId}: ${res.error}`);
            }
        }

        return result;
    }

    /**
     * Remove a tracking ID from the user's pool
     */
    async removeTrackingId(userId: string, trackingId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const existing = await prisma.userTrackingId.findUnique({
                where: { userId_trackingId: { userId, trackingId } }
            });

            if (!existing) {
                return { success: false, error: 'Tracking ID not found' };
            }

            if (existing.status === 'in_use') {
                return { success: false, error: 'Cannot remove tracking ID while in use' };
            }

            await prisma.userTrackingId.delete({
                where: { userId_trackingId: { userId, trackingId } }
            });

            return { success: true };
        } catch (error) {
            console.error('[TrackingIdPool] Error removing tracking ID:', error);
            return { success: false, error: 'Failed to remove tracking ID' };
        }
    }

    /**
     * Get stats for a user's tracking ID pool
     */
    async getStats(userId: string): Promise<TrackingIdStats> {
        const trackingIds = await prisma.userTrackingId.findMany({
            where: { userId },
            orderBy: [{ status: 'asc' }, { lastUsedAt: 'asc' }]
        });

        const available = trackingIds.filter(t => t.status === 'available').length;
        const inUse = trackingIds.filter(t => t.status === 'in_use').length;

        return {
            total: trackingIds.length,
            available,
            inUse,
            trackingIds: trackingIds.map(t => ({
                id: t.id,
                trackingId: t.trackingId,
                status: t.status,
                totalUses: t.totalUses,
                lastUsedAt: t.lastUsedAt,
                assignedAt: t.assignedAt,
                expiresAt: t.expiresAt
            }))
        };
    }

    /**
     * Acquire a tracking ID for a deal (FIFO - oldest available first)
     *
     * @param userId - The user ID
     * @param dealHistoryId - The ChannelDealHistory ID to link
     * @returns TrackingIdAssignment if available, null if no tracking IDs available
     */
    async acquireTrackingId(userId: string, dealHistoryId: string): Promise<TrackingIdAssignment | null> {
        try {
            // Get the oldest available tracking ID (FIFO)
            const available = await prisma.userTrackingId.findFirst({
                where: {
                    userId,
                    status: 'available'
                },
                orderBy: [
                    { lastUsedAt: 'asc' }, // Oldest used first (null = never used = first)
                    { createdAt: 'asc' }   // Then by creation date
                ]
            });

            if (!available) {
                console.log(`[TrackingIdPool] No available tracking IDs for user ${userId}`);
                return null;
            }

            const now = new Date();
            const expiresAt = new Date(now.getTime() + TRACKING_ID_TTL_MS);

            // Update tracking ID status and link to deal
            await prisma.userTrackingId.update({
                where: { id: available.id },
                data: {
                    status: 'in_use',
                    assignedAt: now,
                    expiresAt,
                    dealHistoryId,
                    totalUses: { increment: 1 },
                    lastUsedAt: now
                }
            });

            console.log(`[TrackingIdPool] Assigned tracking ID ${available.trackingId} to deal ${dealHistoryId}, expires at ${expiresAt.toISOString()}`);

            return {
                trackingId: available.trackingId,
                trackingRecordId: available.id,
                expiresAt
            };
        } catch (error) {
            console.error('[TrackingIdPool] Error acquiring tracking ID:', error);
            return null;
        }
    }

    /**
     * Release a tracking ID back to the pool
     *
     * @param trackingRecordId - The UserTrackingId record ID
     * @param reason - Why the ID is being released ('expired' | 'deal_ended' | 'manual')
     */
    async releaseTrackingId(trackingRecordId: string, reason: 'expired' | 'deal_ended' | 'manual' = 'expired'): Promise<boolean> {
        try {
            const record = await prisma.userTrackingId.findUnique({
                where: { id: trackingRecordId }
            });

            if (!record) {
                console.warn(`[TrackingIdPool] Tracking record ${trackingRecordId} not found`);
                return false;
            }

            if (record.status !== 'in_use') {
                console.warn(`[TrackingIdPool] Tracking ID ${record.trackingId} is not in use`);
                return false;
            }

            // If deal ended early, mark it in deal history
            if (reason === 'deal_ended' && record.dealHistoryId) {
                await prisma.channelDealHistory.update({
                    where: { id: record.dealHistoryId },
                    data: {
                        dealStillValid: false,
                        dealExpiredAt: new Date()
                    }
                });
            }

            // Release the tracking ID
            await prisma.userTrackingId.update({
                where: { id: trackingRecordId },
                data: {
                    status: 'available',
                    assignedAt: null,
                    expiresAt: null,
                    dealHistoryId: null
                }
            });

            console.log(`[TrackingIdPool] Released tracking ID ${record.trackingId} (reason: ${reason})`);
            return true;
        } catch (error) {
            console.error('[TrackingIdPool] Error releasing tracking ID:', error);
            return false;
        }
    }

    /**
     * Release all expired tracking IDs (called by cleanup job)
     *
     * @returns Number of tracking IDs released
     */
    async releaseExpiredTrackingIds(): Promise<number> {
        const now = new Date();

        const expired = await prisma.userTrackingId.findMany({
            where: {
                status: 'in_use',
                expiresAt: { lte: now }
            }
        });

        let released = 0;
        for (const record of expired) {
            const success = await this.releaseTrackingId(record.id, 'expired');
            if (success) released++;
        }

        if (released > 0) {
            console.log(`[TrackingIdPool] Released ${released} expired tracking IDs`);
        }

        return released;
    }

    /**
     * Check if a user has any available tracking IDs
     */
    async hasAvailableTrackingIds(userId: string): Promise<boolean> {
        const count = await prisma.userTrackingId.count({
            where: {
                userId,
                status: 'available'
            }
        });

        return count > 0;
    }

    /**
     * Get count of available tracking IDs for a user
     */
    async getAvailableCount(userId: string): Promise<number> {
        return prisma.userTrackingId.count({
            where: {
                userId,
                status: 'available'
            }
        });
    }

    /**
     * Mark a deal as expired (called when deal is no longer valid)
     * This triggers early release of the tracking ID
     *
     * @param dealHistoryId - The ChannelDealHistory ID
     */
    async markDealExpired(dealHistoryId: string): Promise<boolean> {
        try {
            // Find the tracking ID linked to this deal
            const trackingRecord = await prisma.userTrackingId.findUnique({
                where: { dealHistoryId }
            });

            if (!trackingRecord) {
                // No tracking ID linked, just update deal history
                await prisma.channelDealHistory.update({
                    where: { id: dealHistoryId },
                    data: {
                        dealStillValid: false,
                        dealExpiredAt: new Date()
                    }
                });
                return true;
            }

            // Release the tracking ID early
            return this.releaseTrackingId(trackingRecord.id, 'deal_ended');
        } catch (error) {
            console.error('[TrackingIdPool] Error marking deal expired:', error);
            return false;
        }
    }

    /**
     * Update deal validity check timestamp
     *
     * @param dealHistoryId - The ChannelDealHistory ID
     * @param isValid - Whether the deal is still valid
     */
    async updateDealValidity(dealHistoryId: string, isValid: boolean): Promise<void> {
        try {
            const now = new Date();

            if (isValid) {
                await prisma.channelDealHistory.update({
                    where: { id: dealHistoryId },
                    data: { validityCheckedAt: now }
                });
            } else {
                await this.markDealExpired(dealHistoryId);
            }
        } catch (error) {
            console.error('[TrackingIdPool] Error updating deal validity:', error);
        }
    }

    /**
     * Get deals with tracking IDs that need validity check
     * (published more than 1 hour ago, still marked as valid)
     */
    async getDealsNeedingValidityCheck(limit = 50): Promise<{ dealHistoryId: string; asin: string; channelId: string }[]> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        const deals = await prisma.channelDealHistory.findMany({
            where: {
                trackingIdUsed: { not: null },
                dealStillValid: true,
                publishedAt: { lte: oneHourAgo },
                OR: [
                    { validityCheckedAt: null },
                    { validityCheckedAt: { lte: sixHoursAgo } } // Check at least every 6 hours
                ]
            },
            select: {
                id: true,
                asin: true,
                channelId: true
            },
            take: limit,
            orderBy: { validityCheckedAt: 'asc' }
        });

        return deals.map(d => ({
            dealHistoryId: d.id,
            asin: d.asin,
            channelId: d.channelId
        }));
    }
}

// Singleton instance
export const trackingIdPool = new TrackingIdPoolService();
