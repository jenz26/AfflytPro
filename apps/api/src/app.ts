import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';

const app = fastify({ logger: true });

// Register plugins
app.register(cors, {
    origin: true, // Allow all origins for dev, restrict in prod
});

app.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
});

app.register(authPlugin);

// Register routes
app.register(authRoutes, { prefix: '/auth' });

// Health check
app.get('/health', async () => {
    return { status: 'ok' };
});

const start = async () => {
    try {
        await app.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server listening on http://localhost:3001');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
