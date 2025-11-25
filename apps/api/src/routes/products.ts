import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ScoringEngine } from '../services/ScoringEngine';
import { KeepaEngine } from '../services/KeepaEngine';

const prisma = new PrismaClient();
const scoringEngine = new ScoringEngine();
const keepaEngine = new KeepaEngine();

export async function productRoutes(fastify: FastifyInstance) {
    // Protect all routes
    fastify.addHook('onRequest', fastify.authenticate);

    /**
     * GET /products/discover
     * Main Deal Finder search endpoint
     */
    fastify.get<{
        Querystring: {
            search?: string;
            category?: string;
            minScore?: number;
            priceMin?: number;
            priceMax?: number;
            limit?: number;
            offset?: number;
        };
    }>('/discover', async (request, reply) => {
        const {
            search,
            category,
            minScore = 70,
            priceMin,
            priceMax,
            limit = 20,
            offset = 0
        } = request.query;

        const userId = request.user.id;

        try {
            // Build query filters
            const where: any = {};

            if (search) {
                where.OR = [
                    { asin: { contains: search } },
                    { title: { contains: search } },
                    { category: { contains: search } }
                ];
            }

            if (category && category !== 'all') {
                where.category = category;
            }

            if (priceMin !== undefined || priceMax !== undefined) {
                where.currentPrice = {};
                if (priceMin !== undefined) where.currentPrice.gte = priceMin;
                if (priceMax !== undefined) where.currentPrice.lte = priceMax;
            }

            // Fetch products from DB
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where,
                    take: Number(limit),
                    skip: Number(offset),
                    orderBy: { discount: 'desc' },
                    include: {
                        brand: {
                            select: { name: true, slug: true }
                        }
                    }
                }),
                prisma.product.count({ where })
            ]);

            // Enrich with Deal Score and trigger lazy refresh
            const enrichedDeals = await Promise.all(
                products.map(async (product) => {
                    // Calculate Deal Score
                    const { score, components } = scoringEngine.calculateDealScore({
                        currentPrice: product.currentPrice,
                        originalPrice: product.originalPrice,
                        discount: product.discount,
                        salesRank: product.salesRank || undefined,
                        rating: product.rating || undefined,
                        reviewCount: product.reviewCount || undefined,
                        category: product.category
                    });

                    // Store score components in DB for transparency
                    await prisma.product.update({
                        where: { id: product.id },
                        data: {
                            scoreComponents: JSON.stringify(components)
                        }
                    });

                    // Trigger lazy refresh if needed (non-blocking)
                    keepaEngine.checkAndRefresh(product.asin, userId).catch((error) => {
                        request.log.error(`Keepa refresh failed for ${product.asin}:`, error);
                    });

                    // Calculate TTL
                    const now = new Date();
                    const lastCheck = new Date(product.lastPriceCheckAt);
                    const minutesSinceCheck = Math.floor((now.getTime() - lastCheck.getTime()) / 60000);
                    const ttl = Math.max(0, product.keepaDataTTL - minutesSinceCheck);

                    return {
                        asin: product.asin,
                        title: product.title,
                        brand: product.brand?.name,
                        dealScore: score,
                        scoreComponents: components,
                        currentPrice: product.currentPrice,
                        originalPrice: product.originalPrice,
                        discount: product.discount,
                        category: product.category,
                        salesRank: product.salesRank,
                        rating: product.rating,
                        reviewCount: product.reviewCount,
                        imageUrl: product.imageUrl,
                        ttl,
                        lastUpdated: product.lastPriceCheckAt
                    };
                })
            );

            // Filter by minScore (post-calculation)
            const filteredDeals = enrichedDeals.filter(deal => deal.dealScore >= minScore);

            return {
                deals: filteredDeals,
                total: filteredDeals.length,
                limit: Number(limit),
                offset: Number(offset)
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to fetch deals' });
        }
    });

    /**
     * GET /products/:asin
     * Get single product details
     */
    fastify.get<{ Params: { asin: string } }>('/:asin', async (request, reply) => {
        const { asin } = request.params;
        const userId = request.user.id;

        try {
            // Try to get from DB first
            let product = await prisma.product.findUnique({
                where: { asin },
                include: {
                    brand: true
                }
            });

            // If not found, fetch from Keepa
            if (!product) {
                product = await keepaEngine.checkAndRefresh(asin, userId);
            }

            if (!product) {
                return reply.code(404).send({ message: 'Product not found' });
            }

            // Calculate Deal Score
            const { score, components } = scoringEngine.calculateDealScore({
                currentPrice: product.currentPrice,
                originalPrice: product.originalPrice,
                discount: product.discount,
                salesRank: product.salesRank || undefined,
                rating: product.rating || undefined,
                reviewCount: product.reviewCount || undefined,
                category: product.category
            });

            // Calculate TTL
            const now = new Date();
            const lastCheck = new Date(product.lastPriceCheckAt);
            const minutesSinceCheck = Math.floor((now.getTime() - lastCheck.getTime()) / 60000);
            const ttl = Math.max(0, product.keepaDataTTL - minutesSinceCheck);

            return {
                asin: product.asin,
                title: product.title,
                brand: product.brand,
                dealScore: score,
                scoreComponents: components,
                currentPrice: product.currentPrice,
                originalPrice: product.originalPrice,
                discount: product.discount,
                category: product.category,
                salesRank: product.salesRank,
                rating: product.rating,
                reviewCount: product.reviewCount,
                imageUrl: product.imageUrl,
                ttl,
                lastUpdated: product.lastPriceCheckAt
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to fetch product' });
        }
    });
}
