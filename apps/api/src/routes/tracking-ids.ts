/**
 * Tracking IDs Routes
 *
 * API endpoints for managing Amazon Attribution tracking IDs per user.
 *
 * Endpoints:
 * - GET /tracking-ids - Get user's tracking ID pool stats
 * - POST /tracking-ids - Add tracking IDs to pool
 * - DELETE /tracking-ids/:trackingId - Remove a tracking ID from pool
 */

import { FastifyPluginAsync } from 'fastify';
import { trackingIdPool } from '../services/TrackingIdPoolService';

// Request/Response types
interface AddTrackingIdsBody {
    trackingIds: string[];
}

interface AddTrackingIdsResponse {
    success: boolean;
    added: number;
    skipped: number;
    errors?: string[];
}

interface GetTrackingIdsResponse {
    total: number;
    available: number;
    inUse: number;
    trackingIds: {
        id: string;
        trackingId: string;
        status: string;
        totalUses: number;
        lastUsedAt: string | null;
        assignedAt: string | null;
        expiresAt: string | null;
    }[];
}

interface DeleteTrackingIdParams {
    trackingId: string;
}

interface DeleteTrackingIdResponse {
    success: boolean;
    error?: string;
}

const trackingIdsRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /tracking-ids
     * Get user's tracking ID pool stats
     */
    fastify.get<{
        Reply: GetTrackingIdsResponse;
    }>('/', {
        preHandler: fastify.authenticate,
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        available: { type: 'number' },
                        inUse: { type: 'number' },
                        trackingIds: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    trackingId: { type: 'string' },
                                    status: { type: 'string' },
                                    totalUses: { type: 'number' },
                                    lastUsedAt: { type: 'string', nullable: true },
                                    assignedAt: { type: 'string', nullable: true },
                                    expiresAt: { type: 'string', nullable: true }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const userId = request.user.id;
        const stats = await trackingIdPool.getStats(userId);

        return {
            total: stats.total,
            available: stats.available,
            inUse: stats.inUse,
            trackingIds: stats.trackingIds.map(t => ({
                id: t.id,
                trackingId: t.trackingId,
                status: t.status,
                totalUses: t.totalUses,
                lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
                assignedAt: t.assignedAt?.toISOString() ?? null,
                expiresAt: t.expiresAt?.toISOString() ?? null
            }))
        };
    });

    /**
     * POST /tracking-ids
     * Add tracking IDs to user's pool
     */
    fastify.post<{
        Body: AddTrackingIdsBody;
        Reply: AddTrackingIdsResponse;
    }>('/', {
        preHandler: fastify.authenticate,
        schema: {
            body: {
                type: 'object',
                required: ['trackingIds'],
                properties: {
                    trackingIds: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                        maxItems: 100
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        added: { type: 'number' },
                        skipped: { type: 'number' },
                        errors: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const userId = request.user.id;
        const { trackingIds } = request.body;

        // Validate tracking IDs format (basic validation)
        const validTrackingIds = trackingIds.filter(id => id && id.trim().length > 0);

        if (validTrackingIds.length === 0) {
            return reply.status(400).send({
                success: false,
                added: 0,
                skipped: 0,
                errors: ['No valid tracking IDs provided']
            });
        }

        const result = await trackingIdPool.addTrackingIds(userId, validTrackingIds);

        return {
            success: result.added > 0,
            added: result.added,
            skipped: result.skipped,
            errors: result.errors.length > 0 ? result.errors : undefined
        };
    });

    /**
     * DELETE /tracking-ids/:trackingId
     * Remove a tracking ID from user's pool
     */
    fastify.delete<{
        Params: DeleteTrackingIdParams;
        Reply: DeleteTrackingIdResponse;
    }>('/:trackingId', {
        preHandler: fastify.authenticate,
        schema: {
            params: {
                type: 'object',
                required: ['trackingId'],
                properties: {
                    trackingId: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const userId = request.user.id;
        const { trackingId } = request.params;

        const result = await trackingIdPool.removeTrackingId(userId, decodeURIComponent(trackingId));

        if (!result.success) {
            return reply.status(400).send(result);
        }

        return result;
    });
};

export default trackingIdsRoutes;
