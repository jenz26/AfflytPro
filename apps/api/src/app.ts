import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
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
import { startAutomationScheduler } from './jobs/automation-scheduler';

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

// Health check
app.get('/health', async () => {
    return { status: 'ok' };
});

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001', 10);
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);

        // Start background automation scheduler
        startAutomationScheduler();
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
