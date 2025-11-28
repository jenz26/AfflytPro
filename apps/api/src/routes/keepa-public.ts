/**
 * Public Keepa Routes
 *
 * Public proxy endpoints for Keepa Graph Images.
 * These are publicly accessible (no auth) because Telegram needs
 * to fetch the image directly from the URL.
 *
 * Rate limited to prevent abuse.
 */

import { FastifyPluginAsync } from 'fastify';

const KEEPA_API_KEY = process.env.KEEPA_API_KEY;

// Keepa domain IDs
const KEEPA_DOMAIN_IDS: Record<string, number> = {
    'com': 1,
    'co.uk': 2,
    'de': 3,
    'fr': 4,
    'co.jp': 5,
    'ca': 6,
    'it': 8,
    'es': 9,
    'in': 10,
    'com.mx': 11,
};

const keepaPublicRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /keepa/graph/:asin
     *
     * Public proxy for Keepa Graph Image API.
     * Returns PNG image of price history graph.
     *
     * No authentication required (public endpoint for Telegram).
     * Rate limited per IP.
     */
    fastify.get<{
        Params: { asin: string };
        Querystring: {
            domain?: string;
            range?: string;
            amazon?: string;
            new?: string;
            bb?: string;
            salesrank?: string;
            width?: string;
            height?: string;
        };
    }>('/graph/:asin', {
        config: {
            rateLimit: {
                max: 30,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        if (!KEEPA_API_KEY) {
            fastify.log.error('KEEPA_API_KEY not configured');
            return reply.code(500).send({ error: 'Keepa API not configured' });
        }

        const { asin } = request.params;

        // Validate ASIN format (10 alphanumeric characters)
        if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
            return reply.code(400).send({ error: 'Invalid ASIN format' });
        }

        const {
            domain = 'it',
            range = '180',
            amazon = '1',
            new: newPrice = '1',
            bb = '1',
            salesrank = '0',
            width = '500',
            height = '200',
        } = request.query;

        // Get domain ID
        const domainId = KEEPA_DOMAIN_IDS[domain] || 8;

        // Build Keepa Graph Image URL
        const keepaUrl = new URL('https://api.keepa.com/graphimage');
        keepaUrl.searchParams.set('key', KEEPA_API_KEY);
        keepaUrl.searchParams.set('domain', domainId.toString());
        keepaUrl.searchParams.set('asin', asin);
        keepaUrl.searchParams.set('range', range);
        keepaUrl.searchParams.set('amazon', amazon);
        keepaUrl.searchParams.set('new', newPrice);
        keepaUrl.searchParams.set('bb', bb);
        keepaUrl.searchParams.set('salesrank', salesrank);
        keepaUrl.searchParams.set('width', width);
        keepaUrl.searchParams.set('height', height);

        try {
            const response = await fetch(keepaUrl.toString());

            if (!response.ok) {
                fastify.log.error({ status: response.status, asin }, 'Keepa Graph API error');
                return reply.code(response.status).send({ error: 'Keepa API error' });
            }

            // Get image buffer
            const imageBuffer = await response.arrayBuffer();

            // Return as PNG with aggressive caching
            reply.header('Content-Type', 'image/png');
            reply.header('Cache-Control', 'public, max-age=5400'); // 90 minutes (same as Keepa cache)
            return reply.send(Buffer.from(imageBuffer));
        } catch (error: any) {
            fastify.log.error({ error: error.message, asin }, 'Failed to fetch Keepa graph');
            return reply.code(500).send({ error: 'Failed to fetch graph' });
        }
    });
};

export default keepaPublicRoutes;
