/**
 * Smart Scheduling Types and Constants
 *
 * Defines types, interfaces, and configuration for the smart scheduling system
 * that queues deals for optimal publication times.
 */

export interface TimeSlot {
    hour: number;        // 0-23
    score: number;       // 0-100, quanto è buono questo slot
    available: boolean;  // Non già occupato
    time: Date;          // Actual datetime for this slot
}

export interface SchedulingDecision {
    scheduledFor: Date;
    reason: SchedulingReason;
    slotScore: number;
}

export type SchedulingReason =
    | 'best_hour'           // Slot ottimale disponibile
    | 'next_slot'           // Prossimo slot disponibile (best già occupato)
    | 'lightning_priority'  // Lightning deal, priorità massima
    | 'immediate'           // Modalità immediate, pubblica subito
    | 'fallback';           // Nessun insight, usa default

export type DealPriority = 'critical' | 'high' | 'normal' | 'low';

export type ScheduledDealStatus = 'pending' | 'published' | 'cancelled' | 'failed' | 'expired';

export type PublishingMode = 'smart' | 'immediate';

/**
 * Deal type to priority mapping
 * - lightning: Scade presto, pubblica ASAP
 * - deal_of_day: Importante ma non urgente
 * - coupon/price_drop/deal: Standard priority
 */
export const DEAL_TYPE_PRIORITY: Record<string, DealPriority> = {
    'lightning': 'critical',
    'deal_of_day': 'high',
    'coupon': 'normal',
    'price_drop': 'normal',
    'deal': 'normal'
};

/**
 * Default best hours for publishing when no insights are available
 * Based on typical Italian audience engagement patterns
 */
export const DEFAULT_BEST_HOURS = [20, 19, 21, 12, 18];

/**
 * Scheduling configuration constants
 */
export const SCHEDULING_CONFIG = {
    // Massimo deal per ora per canale (evita spam)
    maxDealsPerHour: 3,

    // Finestra di scheduling (ore in avanti)
    maxScheduleAheadHours: 24,

    // Minimo delay prima di pubblicare (minuti)
    minDelayMinutes: 5,

    // Per lightning deals, max delay (minuti)
    lightningMaxDelayMinutes: 15,

    // Ore "morte" da evitare se possibile (notte italiana)
    deadHours: [2, 3, 4, 5, 6],

    // Retry config
    maxRetries: 3,
    retryDelayMinutes: 5,

    // Cleanup: deal pending da più di X ore vengono marcati come expired
    staleThresholdHours: 48,

    // Process batch size per cron run
    processBatchSize: 20
};

/**
 * Input for scheduling a deal
 */
export interface ScheduleDealInput {
    channelId: string;
    ruleId: string;
    asin: string;
    productTitle?: string;
    baseScore: number;
    finalScore: number;
    dealType?: string;
    originalPrice?: number;
    dealPrice?: number;
    discount?: number;
    category?: string;
    dealEndTime?: Date;  // Per lightning deals
}

/**
 * Result from processing scheduled deals
 */
export interface ProcessingStats {
    processed: number;
    published: number;
    failed: number;
    cancelled: number;
    retried: number;
}

/**
 * Scheduling stats for a channel
 */
export interface ChannelSchedulingStats {
    pending: number;
    publishedToday: number;
    cancelledToday: number;
    failedToday: number;
    nextScheduled: Date | null;
}

/**
 * Deal ready for publishing (from DB query)
 */
export interface ScheduledDealWithRelations {
    id: string;
    channelId: string;
    ruleId: string;
    asin: string;
    productTitle: string | null;
    baseScore: number;
    finalScore: number;
    dealType: string | null;
    originalPrice: number | null;
    dealPrice: number | null;
    discount: number | null;
    category: string | null;
    dealEndTime: Date | null;
    scheduledFor: Date;
    reason: string | null;
    status: string;
    retryCount: number;
    channel: {
        id: string;
        channelId: string;
        userId: string;
        name: string;
        credential?: {
            id: string;
            key: string;
        } | null;
        user?: {
            id: string;
            brandId: string | null;
        };
    };
    rule: {
        id: string;
        name: string;
        isActive: boolean;
        copyMode: string;
        messageTemplate: string | null;
        customStylePrompt: string | null;
        llmModel: string;
        showKeepaButton: boolean;
    };
}
