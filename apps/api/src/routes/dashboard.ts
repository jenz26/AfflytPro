import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function dashboardRoutes(fastify: FastifyInstance) {
    // Protect all routes
    fastify.addHook('onRequest', fastify.authenticate);

    /**
     * GET /user/dashboard/stats
     * Returns aggregated KPI data for the dashboard
     */
    fastify.get('/stats', async (request, reply) => {
        const userId = request.user.id;

        try {
            // 1. Check onboarding progress
            const [channelsCount, credentialsCount, automationsCount] = await Promise.all([
                prisma.channel.count({ where: { userId } }),
                prisma.credential.count({ where: { userId } }),
                prisma.automationRule.count({ where: { userId } })
            ]);

            const onboardingProgress = {
                channelConnected: channelsCount > 0,
                credentialsSet: credentialsCount > 0,
                automationCreated: automationsCount > 0
            };

            // 2. Get user account data
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    plan: true,
                    // ttl: true // TODO: Add ttl field to User model
                }
            });

            // 3. Calculate performance metrics
            const affiliateLinks = await prisma.affiliateLink.findMany({
                where: { userId },
                select: {
                    clicks: true,
                    createdAt: true
                }
            });

            const totalClicks = affiliateLinks.reduce((sum, link) => sum + link.clicks, 0);

            // Estimate revenue (assuming €0.28 per click - typical Amazon affiliate)
            const revenue = totalClicks * 0.28;

            // Get last click time (most recent link with clicks > 0)
            const lastClickLink = await prisma.affiliateLink.findFirst({
                where: {
                    userId,
                    clicks: { gt: 0 }
                },
                orderBy: { createdAt: 'desc' }
            });

            // 4. Get recent high-score deals
            const recentDeals = await prisma.product.findMany({
                where: {
                    // Only products with high discount (proxy for high score)
                    discount: { gte: 60 }
                },
                orderBy: { lastPriceCheckAt: 'desc' },
                take: 5,
                select: {
                    asin: true,
                    title: true,
                    discount: true,
                    lastPriceCheckAt: true,
                    scoreComponents: true
                }
            });

            // Calculate time ago for deals
            const dealsWithTime = recentDeals.map(deal => {
                const now = new Date();
                const dealTime = new Date(deal.lastPriceCheckAt);
                const hoursAgo = Math.floor((now.getTime() - dealTime.getTime()) / 3600000);

                // Parse score from scoreComponents if available
                let score = deal.discount; // Fallback to discount
                if (deal.scoreComponents) {
                    try {
                        const components = deal.scoreComponents as any;
                        score = Math.round(
                            (components.discountScore || 0) +
                            (components.salesRankScore || 0) +
                            (components.ratingScore || 0) +
                            (components.priceDropScore || 0)
                        );
                    } catch (e) {
                        // Use discount as fallback
                    }
                }

                return {
                    score,
                    title: deal.title,
                    time: hoursAgo === 0 ? 'Ora' : hoursAgo === 1 ? '1h fa' : `${hoursAgo}h fa`
                };
            });

            // 5. Get Keepa budget for current month
            const currentMonth = new Date().toISOString().slice(0, 7);
            const keepaBudget = await prisma.keepaMonthlyBudget.findUnique({
                where: {
                    userId_month: {
                        userId,
                        month: currentMonth
                    }
                }
            });

            const keepaBudgetData = keepaBudget ? {
                used: keepaBudget.tokensUsed * 0.0235, // Assuming €0.0235 per token
                total: keepaBudget.tokensLimit * 0.0235,
                daysRemaining: Math.ceil(
                    (new Date(keepaBudget.resetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
            } : {
                used: 0,
                total: 879.00, // Default budget
                daysRemaining: 30
            };

            // 6. Calculate limits (hardcoded for now - TODO: make configurable)
            const limits = {
                rules: { used: automationsCount, max: 10 },
                offers: { used: affiliateLinks.length, max: 500 },
                channels: { used: channelsCount, max: 5 }
            };

            // 7. Assemble response
            return {
                onboardingProgress,
                accountData: {
                    plan: user?.plan || 'PRO',
                    ttl: 72, // TODO: Get from user.ttl
                    limits,
                    keepaBudget: keepaBudgetData
                },
                performance: {
                    totalClicks,
                    revenue: parseFloat(revenue.toFixed(2)),
                    conversionRate: totalClicks > 0 ? parseFloat((Math.random() * 5).toFixed(1)) : 0, // Mock for now
                    activeAutomations: automationsCount,
                    lastDealPublished: recentDeals[0]?.lastPriceCheckAt || new Date(),
                    lastClick: lastClickLink?.createdAt || new Date()
                },
                recentDeals: dealsWithTime.slice(0, 3)
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to fetch dashboard stats' });
        }
    });
}
