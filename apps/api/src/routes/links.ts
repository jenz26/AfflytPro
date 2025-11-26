import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { SecurityService } from '../services/SecurityService';

const generateLinkSchema = z.object({
    asin: z.string().regex(/^[A-Z0-9]{10}$/, 'Invalid ASIN format'),
    amazonTag: z.string().min(1, 'Amazon tag is required').max(50)
});

const idParamSchema = z.object({
    id: z.string().uuid('Invalid ID format')
});

export async function linkRoutes(fastify: FastifyInstance) {
    const securityService = new SecurityService();

    // Protect all routes
    fastify.addHook('onRequest', fastify.authenticate);

    /**
     * POST /links/generate
     * Generate Amazon affiliate link with user's tag
     */
    fastify.post<{
        Body: {
            asin: string;
            amazonTag: string;
        };
    }>('/generate', async (request, reply) => {
        const userId = request.user.id;

        try {
            const { asin, amazonTag } = generateLinkSchema.parse(request.body);
            // Verify product exists
            const product = await prisma.product.findUnique({
                where: { asin }
            });

            if (!product) {
                return reply.code(404).send({ message: 'Product not found' });
            }

            // Verify Amazon tag belongs to user (check in Vault)
            // Amazon tags are stored with provider 'AMAZON_TAG' or 'AMAZON_AFFILIATE'
            const userAmazonTags = await prisma.credential.findMany({
                where: {
                    userId,
                    provider: {
                        in: ['AMAZON_TAG', 'AMAZON_AFFILIATE', 'AMAZON']
                    }
                }
            });

            // Check if the provided tag matches any of user's stored tags
            let tagIsValid = false;
            for (const credential of userAmazonTags) {
                try {
                    const decryptedTag = securityService.decrypt(credential.key);
                    if (decryptedTag === amazonTag) {
                        tagIsValid = true;
                        break;
                    }
                } catch (e) {
                    // Skip invalid credentials
                    request.log.warn(`Failed to decrypt credential ${credential.id}`);
                }
            }

            // If no tags stored yet, allow the first one (onboarding flow)
            // But warn the user they should save it
            if (userAmazonTags.length === 0) {
                request.log.info(`User ${userId} using Amazon tag without storing it in vault`);
                // Allow but recommend saving - this supports onboarding
            } else if (!tagIsValid) {
                return reply.code(403).send({
                    message: 'Tag Amazon non autorizzato',
                    error: 'INVALID_AMAZON_TAG',
                    hint: 'Il tag fornito non corrisponde a nessun tag salvato nel tuo Credential Vault. Aggiungi il tag nelle impostazioni prima di usarlo.'
                });
            }

            // Generate Amazon affiliate link
            const fullUrl = `https://www.amazon.it/dp/${asin}?tag=${amazonTag}`;

            // Generate short URL (mock - in production use Amazon's link shortener API)
            const shortUrl = `https://amzn.to/${generateShortCode()}`;

            // Generate short code
            const shortCode = generateShortCode();

            // Store link in DB for tracking
            const affiliateLink = await prisma.affiliateLink.create({
                data: {
                    productId: product.id,
                    userId,
                    amazonTag,
                    shortCode,
                    shortUrl,
                    fullUrl,
                    destinationUrl: fullUrl,
                    clicks: 0
                }
            });

            // Calculate expiration (24h from last price check)
            const expiresAt = new Date(product.lastPriceCheckAt);
            expiresAt.setHours(expiresAt.getHours() + 24);

            return {
                id: affiliateLink.id,
                shortUrl,
                fullUrl,
                asin,
                amazonTag,
                expiresAt,
                compliance: {
                    lastPriceCheck: product.lastPriceCheckAt,
                    ttlRemaining: Math.max(0, product.keepaDataTTL),
                    disclaimer: 'Prezzo aggiornato al momento della generazione del link. Verifica sempre il prezzo finale su Amazon.'
                }
            };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    message: 'Validation error',
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to generate link' });
        }
    });

    /**
     * GET /links/my
     * Get user's generated links
     */
    fastify.get('/my', async (request, reply) => {
        const userId = request.user.id;

        try {
            const links = await prisma.affiliateLink.findMany({
                where: { userId },
                include: {
                    product: {
                        select: {
                            asin: true,
                            title: true,
                            currentPrice: true,
                            imageUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            return {
                links: links.map((link: any) => ({
                    id: link.id,
                    shortUrl: link.shortUrl,
                    fullUrl: link.fullUrl,
                    amazonTag: link.amazonTag,
                    clicks: link.clicks,
                    product: link.product,
                    createdAt: link.createdAt
                }))
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to fetch links' });
        }
    });

    /**
     * POST /links/:id/click
     * Track link click
     */
    fastify.post<{ Params: { id: string } }>('/:id/click', async (request, reply) => {
        try {
            const { id } = idParamSchema.parse(request.params);

            await prisma.affiliateLink.update({
                where: { id },
                data: {
                    clicks: {
                        increment: 1
                    }
                }
            });

            return { success: true };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    message: 'Validation error',
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to track click' });
        }
    });
}

/**
 * Helper: Generate short code for links
 */
function generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
