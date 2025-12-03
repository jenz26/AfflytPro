import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { IPAnonymizer } from '../services/IPAnonymizer';

const prisma = new PrismaClient();

// ===================== TRACKING DATA INTERFACES =====================

interface ClickTrackingData {
    // Device & Browser
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;

    // Screen & Display
    screenWidth?: number;
    screenHeight?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    pixelRatio?: number;
    touchEnabled?: boolean;

    // Locale & Time
    language?: string;
    timezone?: string;

    // Connection
    connectionType?: string;
    connectionSpeed?: string;

    // UTM Tracking
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;

    // Visitor Tracking
    visitorId?: string;
    sessionId?: string;

    // Telegram Source Tracking
    telegramChannelId?: string;  // ch param - Channel ID or username
    telegramMessageId?: string;  // mid param - Message ID
    postTimestamp?: string;      // t param - ISO timestamp of when post was published
}

interface GeoIPResponse {
    status: string;
    country?: string;
    countryCode?: string;
    region?: string;
    regionName?: string;
    city?: string;
}

// ===================== BOT DETECTION =====================

const BOT_USER_AGENT_PATTERNS = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /slurp/i,
    /googlebot/i,
    /bingbot/i,
    /yandex/i,
    /baiduspider/i,
    /duckduckbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /discordbot/i,
    /slackbot/i,
    /applebot/i,
    /ia_archiver/i,
    /mediapartners-google/i,
    /adsbot-google/i,
    /feedfetcher/i,
    /python-requests/i,
    /python-urllib/i,
    /curl/i,
    /wget/i,
    /postman/i,
    /insomnia/i,
    /scrapy/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
    /lighthouse/i,
    /pagespeed/i,
    /gtmetrix/i,
];

function isBot(userAgent: string | null | undefined): boolean {
    if (!userAgent) return false;
    return BOT_USER_AGENT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// ===================== GEO IP LOOKUP =====================

async function lookupGeoIP(ip: string): Promise<GeoIPResponse | null> {
    try {
        // Skip localhost/private IPs
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return null;
        }

        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city`, {
            signal: AbortSignal.timeout(2000) // 2 second timeout
        });

        if (!response.ok) return null;

        const data: GeoIPResponse = await response.json();

        if (data.status !== 'success') return null;

        return data;
    } catch (error) {
        // Silent fail - geo lookup is not critical
        return null;
    }
}

// Rate limit for tracking endpoints - more permissive but still protected
const trackingRateLimitConfig = {
    max: 30,          // 30 requests per minute (reasonable for normal user behavior)
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down.',
    })
};

const trackingRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * POST /track/r/:hash/clickout
     *
     * Public endpoint to track clicks and return redirect URL
     * No authentication required - this is called by end users
     * Rate limited: 30 per minute per IP
     *
     * Receives enriched tracking data from client:
     * - Device & Browser info
     * - Screen dimensions
     * - Locale & Timezone
     * - Connection type
     * - UTM parameters
     * - Visitor/Session IDs
     */
    fastify.post<{
        Params: { hash: string };
        Body: ClickTrackingData;
    }>('/r/:hash/clickout', {
        config: {
            rateLimit: trackingRateLimitConfig
        }
    }, async (request, reply) => {
        const { hash } = request.params;
        const trackingData = request.body || {};

        try {
            // Find link by short code
            const link = await prisma.affiliateLink.findUnique({
                where: { shortCode: hash }
            });

            if (!link) {
                return reply.code(404).send({
                    error: 'Link not found',
                    message: 'The requested short link does not exist'
                });
            }

            // Get client IP and user agent
            const clientIp = request.ip;
            const userAgent = request.headers['user-agent'] || null;

            // Anonymize IP address (GDPR compliance)
            const ipHash = IPAnonymizer.process(clientIp);

            // Get referer header (handle array case)
            const refererHeader = request.headers['referer'] || request.headers['referrer'];
            const referer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader;

            // Bot detection
            const isBotRequest = isBot(userAgent);

            // GeoIP lookup (non-blocking, don't fail if it errors)
            const geoData = await lookupGeoIP(clientIp);

            // Check if this is a unique visitor for this link
            let isUniqueVisitor = false;
            if (trackingData.visitorId) {
                const existingClick = await prisma.click.findFirst({
                    where: {
                        linkId: link.id,
                        visitorId: trackingData.visitorId
                    }
                });
                isUniqueVisitor = !existingClick;
            }

            // Record click with all enriched data
            await prisma.click.create({
                data: {
                    linkId: link.id,
                    ipHash,
                    userAgent,
                    referer: referer || null,

                    // Device & Browser (from client)
                    deviceType: trackingData.deviceType || null,
                    browser: trackingData.browser || null,
                    browserVersion: trackingData.browserVersion || null,
                    os: trackingData.os || null,
                    osVersion: trackingData.osVersion || null,

                    // Screen & Display (from client)
                    screenWidth: trackingData.screenWidth || null,
                    screenHeight: trackingData.screenHeight || null,
                    viewportWidth: trackingData.viewportWidth || null,
                    viewportHeight: trackingData.viewportHeight || null,
                    pixelRatio: trackingData.pixelRatio || null,
                    touchEnabled: trackingData.touchEnabled ?? null,

                    // Locale & Time (from client)
                    language: trackingData.language || null,
                    timezone: trackingData.timezone || null,

                    // Connection (from client)
                    connectionType: trackingData.connectionType || null,
                    connectionSpeed: trackingData.connectionSpeed || null,

                    // GeoIP (from server-side lookup)
                    country: geoData?.countryCode || null,
                    countryName: geoData?.country || null,
                    region: geoData?.regionName || null,
                    city: geoData?.city || null,

                    // UTM Tracking (from client URL params)
                    utmSource: trackingData.utmSource || null,
                    utmMedium: trackingData.utmMedium || null,
                    utmCampaign: trackingData.utmCampaign || null,
                    utmTerm: trackingData.utmTerm || null,
                    utmContent: trackingData.utmContent || null,

                    // Visitor Tracking
                    visitorId: trackingData.visitorId || null,
                    sessionId: trackingData.sessionId || null,
                    isUniqueVisitor,
                    isBot: isBotRequest,

                    // Telegram Source Tracking
                    telegramChannelId: trackingData.telegramChannelId || null,
                    telegramMessageId: trackingData.telegramMessageId || null,
                    postTimestamp: trackingData.postTimestamp ? new Date(trackingData.postTimestamp) : null,
                }
            });

            // Increment click counter (atomic operation)
            // Only count non-bot clicks
            if (!isBotRequest) {
                await prisma.affiliateLink.update({
                    where: { id: link.id },
                    data: { clicks: { increment: 1 } }
                });
            }

            // Return redirect URL and tracking ID
            return reply.send({
                redirectUrl: link.destinationUrl,
                trackingId: link.id,
                message: 'Click tracked successfully'
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to process click tracking'
            });
        }
    });

    /**
     * POST /track/conversion
     * 
     * Public endpoint to receive conversion notifications
     * Called by external systems (e.g., Amazon affiliate network)
     * No authentication required
     */
    fastify.post<{
        Body: {
            trackingId: string;
            revenue: number;
            commission?: number;
        };
    }>('/conversion', async (request, reply) => {
        const { trackingId, revenue, commission } = request.body;

        // Validate input
        if (!trackingId || typeof revenue !== 'number' || revenue <= 0) {
            return reply.code(400).send({
                error: 'Invalid request',
                message: 'trackingId and revenue (> 0) are required'
            });
        }

        try {
            // Verify tracking ID exists
            const link = await prisma.affiliateLink.findUnique({
                where: { id: trackingId }
            });

            if (!link) {
                return reply.code(404).send({
                    error: 'Invalid tracking ID',
                    message: 'The provided tracking ID does not exist'
                });
            }

            // Check for duplicate conversion
            const existingConversion = await prisma.conversion.findUnique({
                where: { trackingId }
            });

            if (existingConversion) {
                return reply.code(409).send({
                    error: 'Duplicate conversion',
                    message: 'This conversion has already been recorded',
                    conversionId: existingConversion.id
                });
            }

            // Calculate commission if not provided (default 5%)
            const finalCommission = commission !== undefined
                ? commission
                : revenue * 0.05;

            // Create conversion record
            const conversion = await prisma.conversion.create({
                data: {
                    linkId: link.id,
                    trackingId,
                    revenue,
                    commission: finalCommission
                }
            });

            // Update link aggregates (atomic operations)
            await prisma.affiliateLink.update({
                where: { id: link.id },
                data: {
                    totalRevenue: { increment: revenue },
                    conversionCount: { increment: 1 }
                }
            });

            fastify.log.info({
                conversionId: conversion.id,
                linkId: link.id,
                revenue,
                commission: finalCommission
            }, 'Conversion tracked successfully');

            return reply.send({
                success: true,
                conversionId: conversion.id,
                revenue,
                commission: finalCommission,
                message: 'Conversion tracked successfully'
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to process conversion tracking'
            });
        }
    });

    /**
     * GET /track/stats/:linkId
     * 
     * Get tracking statistics for a specific link
     * Requires authentication (user must own the link)
     */
    fastify.get<{
        Params: { linkId: string };
    }>('/stats/:linkId', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const { linkId } = request.params;
        const userId = (request.user as any).id;

        try {
            // Verify ownership
            const link = await prisma.affiliateLink.findFirst({
                where: {
                    id: linkId,
                    userId
                },
                include: {
                    _count: {
                        select: {
                            clickRecords: true,
                            conversions: true
                        }
                    }
                }
            });

            if (!link) {
                return reply.code(404).send({
                    error: 'Link not found',
                    message: 'Link does not exist or you do not have permission to view it'
                });
            }

            // Calculate metrics
            const cvr = link.clicks > 0
                ? (link.conversionCount / link.clicks) * 100
                : 0;

            const epc = link.clicks > 0
                ? link.totalRevenue / link.clicks
                : 0;

            return reply.send({
                linkId: link.id,
                shortCode: link.shortCode,
                clicks: link.clicks,
                conversions: link.conversionCount,
                revenue: link.totalRevenue,
                cvr: parseFloat(cvr.toFixed(2)),
                epc: parseFloat(epc.toFixed(2)),
                createdAt: link.createdAt
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                message: 'Failed to retrieve link statistics'
            });
        }
    });
};

export default trackingRoutes;
