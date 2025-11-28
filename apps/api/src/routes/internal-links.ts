/**
 * Internal Links Routes
 *
 * These endpoints are for internal use only (server-to-server calls).
 * Protected by internal API key, not user JWT.
 */

import { FastifyPluginAsync } from 'fastify';
import prisma from '../lib/prisma';

// Internal API key for server-to-server calls
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-dev-key';

// Base URL for short links
const SHORT_LINK_BASE = process.env.APP_URL || 'https://afflyt.io';

/**
 * Generate a unique short code
 */
function generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const internalLinkRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * POST /internal/links/create
     *
     * Create a trackable short link for automation publishing.
     * This is called internally by TelegramBotService and other automation services.
     *
     * Authentication: Internal API key in header
     */
    fastify.post<{
        Body: {
            asin: string;
            amazonUrl: string;
            amazonTag: string;
            userId: string;
            title?: string;
            imageUrl?: string;
            currentPrice?: number;
            originalPrice?: number;
            source?: string;      // e.g., "telegram", "email"
            campaignId?: string;  // e.g., "channel_123"
        };
    }>('/links/create', async (request, reply) => {
        // Verify internal API key
        const apiKey = request.headers['x-internal-key'];
        if (apiKey !== INTERNAL_API_KEY) {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid internal API key'
            });
        }

        const {
            asin,
            amazonUrl,
            amazonTag,
            userId,
            title,
            imageUrl,
            currentPrice,
            originalPrice,
            source,
            campaignId
        } = request.body;

        // Validate required fields
        if (!asin || !amazonUrl || !amazonTag || !userId) {
            return reply.code(400).send({
                error: 'Bad Request',
                message: 'Missing required fields: asin, amazonUrl, amazonTag, userId'
            });
        }

        try {
            // Find or create the product reference
            let product = await prisma.product.findUnique({
                where: { asin }
            });

            // If product doesn't exist, create a minimal record
            if (!product) {
                product = await prisma.product.create({
                    data: {
                        asin,
                        title: title || `Product ${asin}`,
                        currentPrice: currentPrice || 0,
                        originalPrice: originalPrice || currentPrice || 0,
                        discount: 0,
                        category: 'Altro',
                        imageUrl,
                        lastPriceCheckAt: new Date(),
                        keepaDataTTL: 1440
                    }
                });
            }

            // Generate unique short code
            let shortCode = generateShortCode();
            let attempts = 0;
            while (attempts < 5) {
                const existing = await prisma.affiliateLink.findUnique({
                    where: { shortCode }
                });
                if (!existing) break;
                shortCode = generateShortCode();
                attempts++;
            }

            // Create the affiliate link with tracking
            const shortUrl = `${SHORT_LINK_BASE}/r/${shortCode}`;

            const affiliateLink = await prisma.affiliateLink.create({
                data: {
                    productId: product.id,
                    userId,
                    amazonTag,
                    shortCode,
                    shortUrl,
                    fullUrl: amazonUrl,
                    destinationUrl: amazonUrl,
                    clicks: 0,
                    totalRevenue: 0,
                    conversionCount: 0
                }
            });

            return reply.send({
                success: true,
                shortUrl,
                shortCode,
                linkId: affiliateLink.id,
                destinationUrl: amazonUrl
            });

        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Failed to create short link'
            });
        }
    });
};

export default internalLinkRoutes;
