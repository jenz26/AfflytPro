import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: { email: string; password?: string; name?: string } }>('/register', async (request, reply) => {
        const { email, password, name } = request.body;

        try {
            const user = await prisma.user.create({
                data: {
                    email,
                    password, // In a real app, hash this!
                    name,
                },
            });

            const token = fastify.jwt.sign({ id: user.id, email: user.email, brandId: user.brandId });

            return { token, user };
        } catch (err) {
            reply.code(400).send({ message: 'User already exists or invalid data' });
        }
    });

    fastify.post<{ Body: { email: string; password?: string } }>('/login', async (request, reply) => {
        const { email, password } = request.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        // Simple password check (if password provided)
        if (password && user.password !== password) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        const token = fastify.jwt.sign({ id: user.id, email: user.email, brandId: user.brandId });

        return { token, user };
    });

    fastify.get('/profile', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = await prisma.user.findUnique({
            where: { id: request.user.id },
        });
        return user;
    });
}
