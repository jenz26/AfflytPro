import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type HeroType = 'welcome' | 'deals_found' | 'hot_deal' | 'warning' | 'idle' | 'paused';
type ItemStatus = 'active' | 'paused' | 'error' | 'incomplete' | 'online' | 'offline';
type SuggestionType = 'complete_setup' | 'hot_deal' | 'channel_issue' | 'low_credits' | 'create_automation' | 'connect_channel' | 'idle_warning';
type SuggestionPriority = 'high' | 'medium' | 'low';
type ActivityType = 'deal_published' | 'deal_found' | 'click' | 'channel_verified' | 'automation_executed' | 'error';

interface HeroData {
    type: HeroType;
    message: string;
    metric?: number;
    ctaLink: string;
    ctaLabel: string;
    secondaryCtaLink?: string;
    secondaryCtaLabel?: string;
}

interface AutomationStatus {
    id: string;
    name: string;
    status: ItemStatus;
    lastRun?: Date;
    dealsFound24h: number;
}

interface ChannelStatusData {
    id: string;
    name: string;
    platform: string;
    status: ItemStatus;
    lastActivity?: Date;
}

interface Suggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    ctaLink: string;
    ctaLabel: string;
    priority: SuggestionPriority;
}

interface RecentDeal {
    id: string;
    title: string;
    score: number;
    discount: number;
    foundAt: Date;
    published: boolean;
    asin?: string;
}

interface Activity {
    id: string;
    type: ActivityType;
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export async function dashboardRoutes(fastify: FastifyInstance) {
    // Protect all routes
    fastify.addHook('onRequest', fastify.authenticate);

    /**
     * GET /user/dashboard/stats
     * Returns aggregated KPI data for the dashboard (v2 - redesigned)
     */
    fastify.get('/stats', async (request, reply) => {
        const userId = request.user.id;

        try {
            // ═══════════════════════════════════════════════════════════════
            // 1. FETCH BASE DATA
            // ═══════════════════════════════════════════════════════════════

            const [
                user,
                channels,
                automations,
                affiliateLinks,
                recentProducts,
                keepaBudget
            ] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, name: true, plan: true }
                }),
                prisma.channel.findMany({
                    where: { userId },
                    select: { id: true, name: true, platform: true, status: true, createdAt: true }
                }),
                prisma.automationRule.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        lastRunAt: true,
                        channelId: true
                    }
                }),
                prisma.affiliateLink.findMany({
                    where: { userId },
                    select: { clicks: true, createdAt: true }
                }),
                prisma.product.findMany({
                    where: { discount: { gte: 40 } },
                    orderBy: { lastPriceCheckAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        asin: true,
                        title: true,
                        discount: true,
                        lastPriceCheckAt: true,
                        scoreComponents: true
                    }
                }),
                prisma.keepaMonthlyBudget.findUnique({
                    where: {
                        userId_month: { userId, month: new Date().toISOString().slice(0, 7) }
                    }
                })
            ]);

            // ═══════════════════════════════════════════════════════════════
            // 2. CALCULATE METRICS
            // ═══════════════════════════════════════════════════════════════

            const totalClicks = affiliateLinks.reduce((sum, link) => sum + link.clicks, 0);
            const revenue = totalClicks * 0.28; // Estimated €0.28 per click
            const activeAutomations = automations.filter(a => a.isActive).length;

            // Calculate 7-day sparkline
            const now = new Date();
            const sparkline: number[] = [];
            for (let i = 6; i >= 0; i--) {
                const dayStart = new Date(now);
                dayStart.setDate(dayStart.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const dayClicks = affiliateLinks.filter(link => {
                    const created = new Date(link.createdAt);
                    return created >= dayStart && created < dayEnd;
                }).reduce((sum, link) => sum + link.clicks, 0);

                sparkline.push(dayClicks);
            }

            // ═══════════════════════════════════════════════════════════════
            // 3. PROCESS DEALS
            // ═══════════════════════════════════════════════════════════════

            const recentDeals: RecentDeal[] = recentProducts.map(deal => {
                let score = deal.discount;
                if (deal.scoreComponents) {
                    try {
                        const components = deal.scoreComponents as any;
                        score = Math.round(
                            (components.discountScore || 0) +
                            (components.salesRankScore || 0) +
                            (components.ratingScore || 0) +
                            (components.priceDropScore || 0)
                        );
                    } catch (e) { /* use discount */ }
                }

                return {
                    id: deal.id,
                    title: deal.title,
                    score,
                    discount: deal.discount,
                    foundAt: deal.lastPriceCheckAt,
                    published: false, // TODO: Track published status
                    asin: deal.asin
                };
            });

            const hotDealsCount = recentDeals.filter(d => d.score >= 90).length;

            // ═══════════════════════════════════════════════════════════════
            // 4. BUILD AUTOMATIONS STATUS
            // ═══════════════════════════════════════════════════════════════

            const automationStatuses: AutomationStatus[] = automations.map(auto => {
                let status: ItemStatus = 'active';
                if (!auto.isActive) status = 'paused';
                if (!auto.channelId) status = 'incomplete';

                return {
                    id: auto.id,
                    name: auto.name,
                    status,
                    lastRun: auto.lastRunAt || undefined,
                    dealsFound24h: 0 // TODO: Track deals per automation
                };
            });

            // ═══════════════════════════════════════════════════════════════
            // 5. BUILD CHANNELS STATUS
            // ═══════════════════════════════════════════════════════════════

            const channelStatuses: ChannelStatusData[] = channels.map(ch => ({
                id: ch.id,
                name: ch.name,
                platform: ch.platform,
                status: ch.status === 'CONNECTED' ? 'online' as ItemStatus : ch.status === 'ERROR' ? 'error' as ItemStatus : 'offline' as ItemStatus,
                lastActivity: ch.createdAt
            }));

            // ═══════════════════════════════════════════════════════════════
            // 6. BUILD HERO DATA
            // ═══════════════════════════════════════════════════════════════

            let hero: HeroData;

            if (automations.length === 0 && channels.length === 0) {
                // New user
                hero = {
                    type: 'welcome',
                    message: 'Benvenuto! Inizia configurando il tuo primo canale',
                    ctaLink: '/dashboard/channels',
                    ctaLabel: 'Inizia Setup',
                    secondaryCtaLink: '/dashboard/automations',
                    secondaryCtaLabel: 'Crea Automazione'
                };
            } else if (activeAutomations === 0 && automations.length > 0) {
                // All automations paused
                hero = {
                    type: 'paused',
                    message: 'Le tue automazioni sono in pausa',
                    ctaLink: '/dashboard/automations',
                    ctaLabel: 'Attiva'
                };
            } else if (hotDealsCount > 0) {
                // Hot deals available
                hero = {
                    type: 'hot_deal',
                    message: `${hotDealsCount} deal con score 90+ disponibili!`,
                    metric: hotDealsCount,
                    ctaLink: '/dashboard/deals',
                    ctaLabel: 'Pubblica Ora'
                };
            } else if (recentDeals.length > 0) {
                // Normal operation
                hero = {
                    type: 'deals_found',
                    message: `${recentDeals.length} deal trovati nelle ultime 24h`,
                    metric: recentDeals.length,
                    ctaLink: '/dashboard/deals',
                    ctaLabel: 'Vedi Deal',
                    secondaryCtaLink: '/dashboard/automations',
                    secondaryCtaLabel: 'Gestisci'
                };
            } else {
                // Idle
                hero = {
                    type: 'idle',
                    message: 'Nessun deal trovato di recente',
                    ctaLink: '/dashboard/automations',
                    ctaLabel: 'Configura Filtri'
                };
            }

            // ═══════════════════════════════════════════════════════════════
            // 7. BUILD SUGGESTIONS
            // ═══════════════════════════════════════════════════════════════

            const suggestions: Suggestion[] = [];

            // No channels
            if (channels.length === 0) {
                suggestions.push({
                    id: 'connect-channel',
                    type: 'connect_channel',
                    title: 'Connetti un canale',
                    description: 'Collega Telegram, Discord o Email per ricevere i deal',
                    ctaLink: '/dashboard/channels',
                    ctaLabel: 'Connetti',
                    priority: 'high'
                });
            }

            // No automations
            if (automations.length === 0) {
                suggestions.push({
                    id: 'create-automation',
                    type: 'create_automation',
                    title: 'Crea la tua prima automazione',
                    description: 'Configura i filtri per ricevere deal personalizzati',
                    ctaLink: '/dashboard/automations',
                    ctaLabel: 'Crea',
                    priority: 'high'
                });
            }

            // Automation without channel
            const incompleteAuto = automations.find(a => !a.channelId);
            if (incompleteAuto) {
                suggestions.push({
                    id: `complete-${incompleteAuto.id}`,
                    type: 'complete_setup',
                    title: `Completa "${incompleteAuto.name}"`,
                    description: 'Questa automazione non ha un canale associato',
                    ctaLink: `/dashboard/automations?edit=${incompleteAuto.id}`,
                    ctaLabel: 'Configura',
                    priority: 'medium'
                });
            }

            // Hot deal suggestion
            if (hotDealsCount > 0) {
                suggestions.push({
                    id: 'hot-deals',
                    type: 'hot_deal',
                    title: 'Deal Hot disponibili!',
                    description: `${hotDealsCount} prodotti con score 90+ pronti da pubblicare`,
                    ctaLink: '/dashboard/deals',
                    ctaLabel: 'Pubblica',
                    priority: 'high'
                });
            }

            // ═══════════════════════════════════════════════════════════════
            // 8. BUILD ACTIVITY LOG (mock for now)
            // ═══════════════════════════════════════════════════════════════

            const activities: Activity[] = [];

            // Add recent automations runs
            automations.filter(a => a.lastRunAt).slice(0, 3).forEach(auto => {
                activities.push({
                    id: `run-${auto.id}`,
                    type: 'automation_executed',
                    message: `Automazione "${auto.name}" eseguita`,
                    timestamp: auto.lastRunAt!,
                });
            });

            // Add channel connections
            channels.slice(0, 2).forEach(ch => {
                activities.push({
                    id: `ch-${ch.id}`,
                    type: 'channel_verified',
                    message: `Canale ${ch.name} connesso`,
                    timestamp: ch.createdAt,
                });
            });

            // Sort by timestamp
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // ═══════════════════════════════════════════════════════════════
            // 9. BUILD LEGACY DATA (backward compatibility)
            // ═══════════════════════════════════════════════════════════════

            const onboardingProgress = {
                channelConnected: channels.length > 0,
                credentialsSet: true, // Assume true for now
                automationCreated: automations.length > 0
            };

            const keepaBudgetData = keepaBudget ? {
                used: keepaBudget.tokensUsed * 0.0235,
                total: keepaBudget.tokensLimit * 0.0235,
                remaining: (keepaBudget.tokensLimit - keepaBudget.tokensUsed) * 0.0235,
                daysRemaining: Math.ceil(
                    (new Date(keepaBudget.resetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
            } : {
                used: 0,
                total: 879.00,
                remaining: 879.00,
                daysRemaining: 30
            };

            // ═══════════════════════════════════════════════════════════════
            // 10. RETURN RESPONSE
            // ═══════════════════════════════════════════════════════════════

            return {
                // New v2 data
                hero,
                automations: automationStatuses,
                channels: channelStatuses,
                performance: {
                    clicks: totalClicks,
                    revenue: parseFloat(revenue.toFixed(2)),
                    trend: 23, // TODO: Calculate real trend
                    sparkline
                },
                suggestions,
                recentDeals,
                activities,

                // Legacy data (backward compatibility)
                onboardingProgress,
                accountData: {
                    plan: user?.plan || 'PRO',
                    ttl: 72,
                    limits: {
                        rules: { used: automations.length, max: 10 },
                        offers: { used: affiliateLinks.length, max: 500 },
                        channels: { used: channels.length, max: 5 }
                    },
                    credits: keepaBudgetData
                },
                // Legacy performance format
                legacyPerformance: {
                    totalClicks,
                    revenue: parseFloat(revenue.toFixed(2)),
                    conversionRate: totalClicks > 0 ? parseFloat((Math.random() * 5).toFixed(1)) : 0,
                    activeAutomations,
                    lastDealPublished: recentProducts[0]?.lastPriceCheckAt || new Date(),
                    lastClick: new Date()
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to fetch dashboard stats' });
        }
    });
}
