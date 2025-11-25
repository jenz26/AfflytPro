import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import '@fastify/jwt';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { id: string; email: string; brandId?: string | null; plan?: string };
        user: { id: string; email: string; brandId?: string | null; plan?: string };
    }
}

export default fp(async (fastify) => {
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});
