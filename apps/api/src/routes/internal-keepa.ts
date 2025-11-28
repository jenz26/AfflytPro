/**
 * Internal Keepa Routes
 *
 * Proxy endpoints for Keepa API to avoid exposing API key.
 * Protected by internal API key, not user JWT.
 */

import { FastifyPluginAsync } from 'fastify';

// Internal API key for server-to-server calls
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-dev-key';
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

const internalKeepaRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /internal/keepa/graph/:asin
     *
     * Proxy for Keepa Graph Image API.
     * Returns PNG image of price history graph.
     *
     * Authentication: Internal API key in header
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
    }>('/graph/:asin', async (request, reply) => {
        // Verify internal API key
        const apiKey = request.headers['x-internal-key'];
        if (apiKey !== INTERNAL_API_KEY) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        if (!KEEPA_API_KEY) {
            fastify.log.error('KEEPA_API_KEY not configured');
            return reply.code(500).send({ error: 'Keepa API not configured' });
        }

        const { asin } = request.params;
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

            // Return as PNG
            reply.header('Content-Type', 'image/png');
            reply.header('Cache-Control', 'public, max-age=5400'); // 90 minutes (same as Keepa cache)
            return reply.send(Buffer.from(imageBuffer));
        } catch (error: any) {
            fastify.log.error({ error: error.message, asin }, 'Failed to fetch Keepa graph');
            return reply.code(500).send({ error: 'Failed to fetch graph' });
        }
    });

    /**
     * GET /internal/keepa/graph-url/:asin
     *
     * Returns the URL for the graph image (for use in Telegram where we need URL, not binary).
     * Since we can't expose the Keepa API key, this returns our proxy URL.
     *
     * Authentication: Internal API key in header
     */
    fastify.get<{
        Params: { asin: string };
        Querystring: {
            domain?: string;
            range?: string;
        };
    }>('/graph-url/:asin', async (request, reply) => {
        // Verify internal API key
        const apiKey = request.headers['x-internal-key'];
        if (apiKey !== INTERNAL_API_KEY) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { asin } = request.params;
        const { domain = 'it', range = '180' } = request.query;

        // Return our public proxy URL (this needs to be publicly accessible for Telegram)
        const API_BASE_PUBLIC = process.env.API_BASE_PUBLIC || 'https://api.afflyt.io';
        const graphUrl = `${API_BASE_PUBLIC}/keepa/graph/${asin}?domain=${domain}&range=${range}`;

        return reply.send({ url: graphUrl });
    });
};

export default internalKeepaRoutes;
