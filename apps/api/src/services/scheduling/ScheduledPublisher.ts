/**
 * ScheduledPublisher
 *
 * Processes scheduled deals and publishes them when their scheduled time arrives.
 * Called by a cron job every minute.
 */

import { PrismaClient } from '@prisma/client';
import { SchedulerService } from './SchedulerService';
import { trackingIdPool } from '../TrackingIdPoolService';
import { TelegramBotService } from '../TelegramBotService';
import { SecurityService } from '../SecurityService';
import { LLMCopyService, type DealCopyPayload, type LLMCopyConfig } from '../LLMCopyService';
import { ProcessingStats, ScheduledDealWithRelations, SCHEDULING_CONFIG } from './types';
import { captureException, addBreadcrumb } from '../../lib/sentry';

const prisma = new PrismaClient();
const securityService = new SecurityService();

// Redis client for LLM copy service (initialized lazily)
let llmCopyService: LLMCopyService | null = null;

function getLLMCopyService(redis: any): LLMCopyService {
    if (!llmCopyService) {
        llmCopyService = new LLMCopyService(redis);
    }
    return llmCopyService;
}

export class ScheduledPublisher {
    private redis: any;

    constructor(redis: any) {
        this.redis = redis;
    }

    /**
     * Process scheduled deals ready for publication
     * Called by the cron job every minute
     */
    async processScheduledDeals(): Promise<ProcessingStats> {
        const stats: ProcessingStats = {
            processed: 0,
            published: 0,
            failed: 0,
            cancelled: 0,
            retried: 0
        };

        // 1. Get deals ready to publish
        const deals = await SchedulerService.getDealsReadyToPublish(SCHEDULING_CONFIG.processBatchSize);

        if (deals.length === 0) {
            return stats;
        }

        console.log(`[ScheduledPublisher] Processing ${deals.length} scheduled deals`);

        // 2. Process each deal
        for (const deal of deals) {
            stats.processed++;

            try {
                // Verify rule is still active
                if (!deal.rule.isActive) {
                    await SchedulerService.cancelScheduledDeal(deal.id, 'rule_disabled');
                    stats.cancelled++;
                    continue;
                }

                // Verify channel has credential
                if (!deal.channel.credential) {
                    await SchedulerService.cancelScheduledDeal(deal.id, 'no_credential');
                    stats.cancelled++;
                    console.error(`[ScheduledPublisher] Channel ${deal.channelId} has no credential`);
                    continue;
                }

                // Publish the deal
                const result = await this.publishDeal(deal);

                if (result.success) {
                    await SchedulerService.markAsPublished(
                        deal.id,
                        result.messageId!,
                        result.trackingId
                    );
                    stats.published++;
                    console.log(`[ScheduledPublisher] Published ${deal.asin} to ${deal.channel.channelId}`);

                    // Sentry breadcrumb
                    addBreadcrumb(`Scheduled deal published: ${deal.asin}`, 'scheduler.publish', {
                        scheduledDealId: deal.id,
                        asin: deal.asin,
                        channelId: deal.channelId,
                        reason: deal.reason
                    });
                } else {
                    const shouldRetry = await SchedulerService.markAsFailed(deal.id, result.error!);
                    if (shouldRetry) {
                        stats.retried++;
                        console.log(`[ScheduledPublisher] Will retry ${deal.asin}: ${result.error}`);
                    } else {
                        stats.failed++;
                        console.error(`[ScheduledPublisher] Failed permanently ${deal.asin}: ${result.error}`);
                    }
                }

            } catch (error: any) {
                console.error(`[ScheduledPublisher] Error processing deal ${deal.id}:`, error);
                captureException(error, {
                    scheduledDealId: deal.id,
                    asin: deal.asin,
                    channelId: deal.channelId,
                    component: 'ScheduledPublisher',
                    operation: 'processScheduledDeals'
                });
                await SchedulerService.markAsFailed(deal.id, error.message);
                stats.failed++;
            }

            // Small delay between messages to avoid rate limiting
            await this.delay(1000);
        }

        console.log(`[ScheduledPublisher] Completed: ${stats.published} published, ${stats.failed} failed, ${stats.cancelled} cancelled, ${stats.retried} retried`);

        return stats;
    }

    /**
     * Publish a single deal to Telegram
     */
    private async publishDeal(deal: ScheduledDealWithRelations): Promise<{
        success: boolean;
        messageId?: string;
        trackingId?: string;
        error?: string;
    }> {
        try {
            const userId = deal.channel.user?.id || deal.channel.userId;
            const telegramChannelId = deal.channel.channelId;

            // 1. Decrypt bot token
            let botToken: string;
            try {
                botToken = securityService.decrypt(deal.channel.credential!.key);
            } catch (error) {
                return { success: false, error: 'Failed to decrypt bot token' };
            }

            // 2. Acquire tracking ID
            let trackingId: string | undefined;
            const trackingAssignment = await trackingIdPool.acquireTrackingId(userId, deal.id);
            if (trackingAssignment) {
                trackingId = trackingAssignment.trackingId;
            }

            // 3. Resolve Amazon tag
            const amazonTag = deal.channel.user?.brandId || 'afflyt-21';

            // 4. Build affiliate link
            const affiliateLink = `https://www.amazon.it/dp/${deal.asin}?tag=${amazonTag}&linkCode=ll1&language=it_IT`;

            // 5. Generate copy (LLM or template)
            const copyPayload: DealCopyPayload = {
                asin: deal.asin,
                title: deal.productTitle || `Prodotto ${deal.asin}`,
                currentPrice: deal.dealPrice || 0,
                originalPrice: deal.originalPrice || 0,
                discountPercent: deal.discount || 0,
                category: deal.category || '',
                rating: null,
                reviewCount: null,
                isHistoricalLow: false,
                hasVisibleDiscount: (deal.discount || 0) > 0,
                affiliateUrl: affiliateLink
            };

            const llmConfig: LLMCopyConfig = {
                copyMode: (deal.rule.copyMode as 'TEMPLATE' | 'LLM') || 'TEMPLATE',
                messageTemplate: deal.rule.messageTemplate || undefined,
                customStylePrompt: deal.rule.customStylePrompt || undefined,
                llmModel: deal.rule.llmModel || 'gpt-4o-mini',
                ruleId: deal.ruleId
            };

            const copyService = getLLMCopyService(this.redis);
            const copyResult = await copyService.generateCopy(copyPayload, llmConfig);

            // 6. Send to Telegram
            // Map deal type to TelegramBotService expected values
            const mapDealType = (dt: string | null): 'discounted' | 'lowest_price' | undefined => {
                if (!dt) return undefined;
                if (dt === 'lightning' || dt === 'deal_of_day' || dt === 'coupon') return 'discounted';
                if (dt === 'price_drop' || dt === 'lowest_price') return 'lowest_price';
                return 'discounted'; // Default to discounted for other deal types
            };

            const result = await TelegramBotService.sendDealToChannel(
                telegramChannelId,
                botToken,
                {
                    asin: deal.asin,
                    title: deal.productTitle || `Prodotto ${deal.asin}`,
                    price: deal.dealPrice || 0,
                    originalPrice: deal.originalPrice || 0,
                    discount: (deal.discount || 0) / 100,
                    rating: 0,
                    reviewCount: 0,
                    imageUrl: undefined,
                    affiliateLink,
                    dealType: mapDealType(deal.dealType),
                    hasVisibleDiscount: (deal.discount || 0) > 0,
                    isLowestEver: false,
                    includeKeepaChart: deal.rule.includeKeepaChart,
                    customCopy: copyResult.text
                },
                userId,
                amazonTag,
                {
                    channelName: deal.channel.name,
                    platform: 'TELEGRAM'
                }
            );

            if (!result.success) {
                return { success: false, error: result.error };
            }

            // 7. Save to ChannelDealHistory
            const dealHistory = await prisma.channelDealHistory.create({
                data: {
                    channelId: deal.channelId,
                    asin: deal.asin,
                    ruleId: deal.ruleId,
                    publishedAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    telegramMessageId: result.messageId?.toString(),
                    baseScore: deal.baseScore,
                    finalScore: deal.finalScore,
                    trackingIdUsed: trackingId,
                    dealType: deal.dealType,
                    originalPrice: deal.originalPrice,
                    dealPrice: deal.dealPrice,
                    discount: deal.discount,
                    category: deal.category,
                    generatedCopy: copyResult.text,
                    copySource: copyResult.source,
                    copyGeneratedAt: new Date(),
                    priceAtGeneration: deal.dealPrice,
                    dealStillValid: true
                }
            });

            // 8. Link tracking ID to deal history (if used from pool)
            if (trackingAssignment && dealHistory) {
                await prisma.userTrackingId.update({
                    where: { id: trackingAssignment.trackingRecordId },
                    data: { dealHistoryId: dealHistory.id }
                });
            }

            // 9. Update rule stats
            await prisma.automationRule.update({
                where: { id: deal.ruleId },
                data: {
                    dealsPublished: { increment: 1 },
                    lastRunAt: new Date()
                }
            });

            return {
                success: true,
                messageId: result.messageId?.toString(),
                trackingId
            };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Singleton factory for use with Redis from app.ts
 */
let publisherInstance: ScheduledPublisher | null = null;

export function getScheduledPublisher(redis: any): ScheduledPublisher {
    if (!publisherInstance) {
        publisherInstance = new ScheduledPublisher(redis);
    }
    return publisherInstance;
}

export default ScheduledPublisher;
