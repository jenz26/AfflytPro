import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { IPAnonymizer } from '../services/IPAnonymizer';

const prisma = new PrismaClient();

const trackingRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * POST /track/r/:hash/clickout
     * 
     * Public endpoint to track clicks and return redirect URL
     * No authentication required - this is called by end users
     */
    fastify.post<{
        Params: { hash: string };
    }>('/r/:hash/clickout', async (request, reply) => {
        const { hash } = request.params;

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

            // Anonymize IP address (GDPR compliance)
            const clientIp = request.ip;
            const ipHash = IPAnonymizer.process(clientIp);

            // Get referer header (handle array case)
            const refererHeader = request.headers['referer'] || request.headers['referrer'];
            const referer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader;

            // Record click with anonymized data
            await prisma.click.create({
                data: {
                    linkId: link.id,
                    ipHash,
                    userAgent: request.headers['user-agent'] || null,
                    referer: referer || null
                }
            });

            // Increment click counter (atomic operation)
            await prisma.affiliateLink.update({
                where: { id: link.id },
                data: { clicks: { increment: 1 } }
            });

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
