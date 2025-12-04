import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth';
import { credentialRoutes } from './routes/credentials';
import { productRoutes } from './routes/products';
import { linkRoutes } from './routes/links';
import { channelRoutes } from './routes/channels';
import { dashboardRoutes } from './routes/dashboard';
import trackingRoutes from './routes/tracking';
import automationRoutes from './routes/automations';
import analyticsRoutes from './routes/analytics';
import validationRoutes from './routes/validation';
import dealsRoutes from './routes/deals';
import templatesRoutes from './routes/templates';
import internalLinkRoutes from './routes/internal-links';
import internalKeepaRoutes from './routes/internal-keepa';
import keepaPublicRoutes from './routes/keepa-public';
import { startAutomationScheduler } from './jobs/automation-scheduler';
import { startKeepaPopulateScheduler } from './jobs/keepa-populate-scheduler';
// Keepa Queue System v2
import { KeepaWorker } from './services/keepa/KeepaWorker';
import { AutomationScheduler, setSchedulerInstance } from './services/keepa';
import { KeepaPrefetch } from './services/keepa/KeepaPrefetch';
import { KeepaTokenManager } from './services/keepa/KeepaTokenManager';
import { DEFAULT_CONFIG } from './types/keepa';
import { connectRedis } from './lib/redis';
// Scheduler Queue System (BullMQ-based, separate from Keepa)
import { SchedulerQueue, SchedulerCron, setSchedulerCronInstance } from './services/scheduler';
// Email Report Cron (Weekly/Daily reports)
import { EmailReportCron } from './services/EmailReportCron';
import prisma from './lib/prisma';
import billingRoutes from './routes/billing';
import notificationRoutes from './routes/notifications';
import { schedulerRoutes } from './routes/scheduler';
import { bountyTemplateRoutes } from './routes/bounty-templates';
import { affiliateTagRoutes } from './routes/affiliate-tags';
import { betaRoutes } from './routes/beta';
import { securityRoutes } from './routes/security';
import adminRoutes from './routes/admin';
import trackingIdsRoutes from './routes/tracking-ids';
import amazonImportRoutes from './routes/amazon-import';
import memberTrackingRoutes from './routes/member-tracking';
import { trackingIdPool } from './services/TrackingIdPoolService';
import { getScheduledPublisher, SchedulerService } from './services/scheduling';
import { getInsightsCalculator } from './services/insights';
import { MemberTrackingService } from './services/MemberTrackingService';
import { initSentry, captureException, setUser, Sentry } from './lib/sentry';

// ==================== SENTRY INITIALIZATION ====================
// Initialize Sentry before anything else
initSentry();

// ==================== ENVIRONMENT CHECKS ====================

// JWT Secret is required for security
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET not set in environment variables');
    console.error('Generate one with: openssl rand -hex 32');
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters');
    process.exit(1);
}

// Encryption secret is required for credential vault
if (!process.env.ENCRYPTION_SECRET) {
    console.error('FATAL: ENCRYPTION_SECRET not set in environment variables');
    console.error('Generate one with: openssl rand -hex 16');
    process.exit(1);
}

const app = Fastify({
    logger: true
});

// ==================== CORS ====================
// Configure based on environment
const corsOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS?.split(',') || ['https://afflyt.io'])
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

// ==================== JWT ====================
app.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: {
        expiresIn: '7d' // Token expires in 7 days
    }
});

// ==================== RATE LIMITING ====================
// Global rate limit: 100 requests per minute per IP
app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Troppo richieste. Riprova tra ${Math.ceil(context.ttl / 1000)} secondi.`,
        retryAfter: Math.ceil(context.ttl / 1000)
    })
});

// Auth decorator
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

// Public routes (no auth required)
app.register(trackingRoutes, { prefix: '/track' });
app.register(analyticsRoutes, { prefix: '/analytics' });
app.register(validationRoutes, { prefix: '/validate' });
app.register(keepaPublicRoutes, { prefix: '/keepa' });

// Internal routes (protected by internal API key, not JWT)
app.register(internalLinkRoutes, { prefix: '/internal' });
app.register(internalKeepaRoutes, { prefix: '/internal/keepa' });

// Protected routes
app.register(authRoutes, { prefix: '/auth' });
app.register(credentialRoutes, { prefix: '/user/credentials' });
app.register(channelRoutes, { prefix: '/user/channels' });
app.register(productRoutes, { prefix: '/products' });
app.register(linkRoutes, { prefix: '/links' });
app.register(dashboardRoutes, { prefix: '/user/dashboard' });
app.register(automationRoutes, { prefix: '/automation' });
app.register(dealsRoutes, { prefix: '/api' });
app.register(templatesRoutes, { prefix: '/user' });
app.register(billingRoutes, { prefix: '/api' });
app.register(notificationRoutes, { prefix: '/api' });
app.register(schedulerRoutes, { prefix: '/api/scheduler' });
app.register(bountyTemplateRoutes, { prefix: '/api/bounty-templates' });
app.register(affiliateTagRoutes, { prefix: '/user/affiliate-tags' });
app.register(betaRoutes, { prefix: '/beta' });
app.register(securityRoutes, { prefix: '/security' });
app.register(adminRoutes, { prefix: '/admin' });
app.register(trackingIdsRoutes, { prefix: '/user/tracking-ids' });
app.register(amazonImportRoutes, { prefix: '/user/amazon-import' });
app.register(memberTrackingRoutes, { prefix: '/user' });

// Health check
app.get('/health', async () => {
    return { status: 'ok' };
});

// ==================== SENTRY ERROR HANDLER ====================
// Global error handler to capture errors with Sentry
app.setErrorHandler((error, request, reply) => {
    // Set user context if authenticated
    if (request.user) {
        setUser({
            id: request.user.id,
            email: request.user.email,
            plan: request.user.plan,
        });
    }

    // Only capture 5xx errors (server errors) to Sentry
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
        captureException(error as Error, {
            url: request.url,
            method: request.method,
            params: request.params,
            query: request.query,
        });
    }

    // Log error
    app.log.error(error);

    // Send response
    reply.status(statusCode).send({
        statusCode,
        error: error.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' && statusCode >= 500
            ? 'Si è verificato un errore interno'
            : error.message,
    });
});

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001', 10);
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);

        // NOTE: Legacy automation-scheduler disabled in favor of Keepa Queue System v2
        // The new AutomationScheduler in services/keepa/ handles AutomationRule execution
        // startAutomationScheduler();

        // NOTE: Keepa populate scheduler disabled in favor of Keepa Queue System v2
        // The new system uses AutomationScheduler + KeepaWorker for smarter caching
        // startKeepaPopulateScheduler();

        // ==================== KEEPA QUEUE SYSTEM V2 ====================
        // Start only if REDIS_URL and KEEPA_API_KEY are configured
        if (process.env.REDIS_URL && process.env.KEEPA_API_KEY) {
            console.log('[Keepa v2] Starting queue system...');

            // Connect to Redis and wait for it to be ready BEFORE starting workers
            const redis = await connectRedis();
            console.log('[Keepa v2] Redis connected, starting workers...');

            const config = DEFAULT_CONFIG;
            const keepaApiKey = process.env.KEEPA_API_KEY;

            // Initialize token manager
            const tokenManager = new KeepaTokenManager(redis, config, keepaApiKey);

            // Start the Keepa worker (processes queue jobs with multi-priceType + BuyBox verification)
            const keepaWorker = new KeepaWorker(redis, prisma, config, keepaApiKey);
            keepaWorker.start();

            // Start the automation scheduler (checks AutomationRules every minute)
            const automationScheduler = new AutomationScheduler(prisma, redis, config);
            automationScheduler.start();

            // Register scheduler instance globally for route access
            setSchedulerInstance(automationScheduler);

            // Initialize prefetch (will be called by worker during idle)
            const keepaPrefetch = new KeepaPrefetch(redis, prisma, config, tokenManager);

            // Periodic prefetch check (every 30 seconds when idle)
            const prefetchInterval = setInterval(async () => {
                try {
                    await keepaPrefetch.runIfIdle();
                } catch (error) {
                    console.error('[Prefetch] Error:', error);
                }
            }, 30000);

            // Graceful shutdown
            const shutdown = () => {
                console.log('[Keepa v2] Shutting down...');
                keepaWorker.stop();
                automationScheduler.stop();
                clearInterval(prefetchInterval);
            };

            process.on('SIGTERM', shutdown);
            process.on('SIGINT', shutdown);

            console.log('[Keepa v2] Queue system started successfully');

            // ==================== SCHEDULER QUEUE SYSTEM ====================
            // Start the scheduled posts queue (BullMQ-based)
            console.log('[Scheduler] Starting scheduled posts queue...');

            const schedulerQueue = new SchedulerQueue(redis, prisma);
            await schedulerQueue.start();

            const schedulerCron = new SchedulerCron(prisma, redis, schedulerQueue);
            schedulerCron.start();

            // Initialize posts without nextRunAt
            await schedulerCron.initializeNextRunTimes();

            // Register cron instance globally for route access
            setSchedulerCronInstance(schedulerCron);

            // Extend graceful shutdown
            const originalShutdown = shutdown;
            const extendedShutdown = async () => {
                console.log('[Scheduler] Shutting down...');
                schedulerCron.stop();
                await schedulerQueue.stop();
                originalShutdown();
            };

            process.removeListener('SIGTERM', shutdown);
            process.removeListener('SIGINT', shutdown);
            process.on('SIGTERM', extendedShutdown);
            process.on('SIGINT', extendedShutdown);

            console.log('[Scheduler] Scheduled posts queue started successfully');

            // ==================== EMAIL REPORT CRON ====================
            // Start the email report scheduler (Weekly/Daily reports)
            console.log('[EmailReport] Starting email report scheduler...');
            const emailReportCron = new EmailReportCron(prisma);
            emailReportCron.start();

            // Extend graceful shutdown for email reports
            const schedulerShutdown = extendedShutdown;
            const emailShutdown = async () => {
                console.log('[EmailReport] Shutting down...');
                emailReportCron.stop();
                await schedulerShutdown();
            };

            process.removeListener('SIGTERM', extendedShutdown);
            process.removeListener('SIGINT', extendedShutdown);
            process.on('SIGTERM', emailShutdown);
            process.on('SIGINT', emailShutdown);

            console.log('[EmailReport] Email report scheduler started successfully');

            // ==================== TRACKING ID CLEANUP CRON ====================
            // Release expired tracking IDs every 5 minutes
            console.log('[TrackingIdPool] Starting tracking ID cleanup scheduler...');
            const trackingIdCleanupInterval = setInterval(async () => {
                try {
                    const released = await trackingIdPool.releaseExpiredTrackingIds();
                    if (released > 0) {
                        console.log(`[TrackingIdPool] Released ${released} expired tracking IDs`);
                    }
                } catch (error) {
                    console.error('[TrackingIdPool] Cleanup error:', error);
                }
            }, 5 * 60 * 1000); // Every 5 minutes

            // Extend graceful shutdown for tracking ID cleanup
            const emailShutdownRef = emailShutdown;
            const trackingIdShutdown = async () => {
                console.log('[TrackingIdPool] Shutting down...');
                clearInterval(trackingIdCleanupInterval);
                await emailShutdownRef();
            };

            process.removeListener('SIGTERM', emailShutdown);
            process.removeListener('SIGINT', emailShutdown);
            process.on('SIGTERM', trackingIdShutdown);
            process.on('SIGINT', trackingIdShutdown);

            console.log('[TrackingIdPool] Tracking ID cleanup scheduler started successfully');

            // ==================== SMART SCHEDULING CRON ====================
            // Process scheduled deals every minute
            console.log('[SmartScheduler] Starting scheduled deals processor...');
            const scheduledPublisher = getScheduledPublisher(redis);

            const scheduledDealsInterval = setInterval(async () => {
                try {
                    const stats = await scheduledPublisher.processScheduledDeals();
                    if (stats.processed > 0) {
                        console.log(`[SmartScheduler] Processed: ${stats.published} published, ${stats.failed} failed, ${stats.cancelled} cancelled`);
                    }
                } catch (error) {
                    console.error('[SmartScheduler] Error processing scheduled deals:', error);
                }
            }, 60 * 1000); // Every minute

            // Cleanup stale deals every hour
            const staleCleanupInterval = setInterval(async () => {
                try {
                    const cleaned = await SchedulerService.cleanupStaleDeals();
                    if (cleaned > 0) {
                        console.log(`[SmartScheduler] Cleaned up ${cleaned} stale scheduled deals`);
                    }
                } catch (error) {
                    console.error('[SmartScheduler] Stale cleanup error:', error);
                }
            }, 60 * 60 * 1000); // Every hour

            // Extend graceful shutdown for smart scheduler
            const trackingIdShutdownRef = trackingIdShutdown;
            const smartSchedulerShutdown = async () => {
                console.log('[SmartScheduler] Shutting down...');
                clearInterval(scheduledDealsInterval);
                clearInterval(staleCleanupInterval);
                await trackingIdShutdownRef();
            };

            process.removeListener('SIGTERM', trackingIdShutdown);
            process.removeListener('SIGINT', trackingIdShutdown);
            process.on('SIGTERM', smartSchedulerShutdown);
            process.on('SIGINT', smartSchedulerShutdown);

            console.log('[SmartScheduler] Smart scheduling started successfully');

            // ==================== INSIGHTS CALCULATOR CRON ====================
            // Recalculate channel insights every 6 hours
            console.log('[InsightsCalculator] Starting insights recalculation scheduler...');
            const insightsCalculator = getInsightsCalculator(prisma);

            const insightsInterval = setInterval(async () => {
                try {
                    console.log('[InsightsCalculator] Starting scheduled recalculation...');
                    const result = await insightsCalculator.recalculateAllChannels();
                    console.log(`[InsightsCalculator] Completed: ${result.processed} channels recalculated (${result.errors} errors)`);
                } catch (error) {
                    console.error('[InsightsCalculator] Recalculation error:', error);
                }
            }, 6 * 60 * 60 * 1000); // Every 6 hours

            // Cleanup old ProductPriceHistory (older than 180 days) - weekly on Sunday at 3 AM
            const priceHistoryCleanupInterval = setInterval(async () => {
                // Only run on Sunday
                if (new Date().getDay() !== 0) return;
                // Only run around 3 AM
                if (new Date().getHours() !== 3) return;

                try {
                    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
                    const deleted = await prisma.productPriceHistory.deleteMany({
                        where: { recordedAt: { lt: cutoffDate } }
                    });
                    if (deleted.count > 0) {
                        console.log(`[InsightsCalculator] Cleaned up ${deleted.count} old price history records`);
                    }
                } catch (error) {
                    console.error('[InsightsCalculator] Price history cleanup error:', error);
                }
            }, 60 * 60 * 1000); // Check every hour (runs only on Sunday at 3 AM)

            // Extend graceful shutdown for insights
            const smartSchedulerShutdownRef = smartSchedulerShutdown;
            const insightsShutdown = async () => {
                console.log('[InsightsCalculator] Shutting down...');
                clearInterval(insightsInterval);
                clearInterval(priceHistoryCleanupInterval);
                await smartSchedulerShutdownRef();
            };

            process.removeListener('SIGTERM', smartSchedulerShutdown);
            process.removeListener('SIGINT', smartSchedulerShutdown);
            process.on('SIGTERM', insightsShutdown);
            process.on('SIGINT', insightsShutdown);

            console.log('[InsightsCalculator] Insights recalculation scheduler started successfully');

            // ==================== MEMBER TRACKING CRON ====================
            // Daily member snapshots at 9:00 AM (every day)
            console.log('[MemberTracking] Starting member tracking scheduler...');

            // Check if it's time for the daily snapshot (runs every hour, triggers at 9 AM)
            const memberSnapshotInterval = setInterval(async () => {
                const now = new Date();
                // Only run at 9 AM (hour 9)
                if (now.getHours() !== 9) return;
                // Only run once per day - check if minute is less than 5 (within first 5 minutes of 9 AM)
                if (now.getMinutes() >= 5) return;

                try {
                    console.log('[MemberTracking] Starting daily member snapshot...');
                    const result = await MemberTrackingService.recordAllChannelSnapshots();
                    console.log(`[MemberTracking] Snapshot complete: ${result.success} success, ${result.failed} failed`);
                } catch (error) {
                    console.error('[MemberTracking] Snapshot error:', error);
                }
            }, 60 * 60 * 1000); // Check every hour

            // Update growth metrics at 10:00 AM (after snapshots are done)
            const memberMetricsInterval = setInterval(async () => {
                const now = new Date();
                // Only run at 10 AM
                if (now.getHours() !== 10) return;
                // Only run once per day
                if (now.getMinutes() >= 5) return;

                try {
                    console.log('[MemberTracking] Starting growth metrics update...');
                    const result = await MemberTrackingService.updateAllChannelMetrics();
                    console.log(`[MemberTracking] Metrics update complete: ${result.processed} processed, ${result.errors} errors`);
                } catch (error) {
                    console.error('[MemberTracking] Metrics update error:', error);
                }
            }, 60 * 60 * 1000); // Check every hour

            // Extend graceful shutdown for member tracking
            const insightsShutdownRef = insightsShutdown;
            const memberTrackingShutdown = async () => {
                console.log('[MemberTracking] Shutting down...');
                clearInterval(memberSnapshotInterval);
                clearInterval(memberMetricsInterval);
                await insightsShutdownRef();
            };

            process.removeListener('SIGTERM', insightsShutdown);
            process.removeListener('SIGINT', insightsShutdown);
            process.on('SIGTERM', memberTrackingShutdown);
            process.on('SIGINT', memberTrackingShutdown);

            console.log('[MemberTracking] Member tracking scheduler started successfully');
        } else {
            if (!process.env.REDIS_URL) {
                console.log('[Keepa v2] REDIS_URL not configured, queue system disabled');
                console.log('[Scheduler] Scheduled posts disabled (requires Redis)');
            }
            if (!process.env.KEEPA_API_KEY) {
                console.log('[Keepa v2] KEEPA_API_KEY not configured, queue system disabled');
            }
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
