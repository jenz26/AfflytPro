import { FastifyInstance } from 'fastify';
import { PrismaClient, ChannelPlatform } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createChannelSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    platform: z.enum(['TELEGRAM', 'DISCORD']),
    channelId: z.string().min(1, 'Channel ID is required'),
    credentialId: z.string().uuid().optional()
});

const idParamSchema = z.object({
    id: z.string().uuid('Invalid ID format')
});

export async function channelRoutes(fastify: FastifyInstance) {
    // Protect all routes
    fastify.addHook('onRequest', fastify.authenticate);

    // Create Channel
    fastify.post<{ Body: { name: string; platform: string; channelId: string; credentialId?: string } }>('/', async (request, reply) => {
        const userId = request.user.id;

        try {
            const { name, platform, channelId, credentialId } = createChannelSchema.parse(request.body);
            // Verify credential ownership if provided
            if (credentialId) {
                const credential = await prisma.credential.findUnique({
                    where: { id: credentialId },
                });
                if (!credential || credential.userId !== userId) {
                    return reply.code(403).send({ message: 'Invalid credential' });
                }
            }

            const channel = await prisma.channel.create({
                data: {
                    userId,
                    name,
                    platform: platform as ChannelPlatform,
                    channelId,
                    credentialId,
                    status: 'CONNECTED', // Assuming connected if created via wizard
                },
            });

            return channel;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    message: 'Validation error',
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to create channel' });
        }
    });

    // Get Channels
    fastify.get('/', async (request, reply) => {
        const userId = request.user.id;

        const channels = await prisma.channel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                credential: {
                    select: {
                        id: true,
                        label: true,
                        provider: true
                    }
                }
            }
        });

        return { channels };
    });

    // Delete Channel
    fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const userId = request.user.id;

        try {
            const { id } = idParamSchema.parse(request.params);

            const channel = await prisma.channel.findUnique({
                where: { id },
            });

            if (!channel || channel.userId !== userId) {
                return reply.code(404).send({ message: 'Channel not found' });
            }

            await prisma.channel.delete({
                where: { id },
            });

            return { message: 'Channel deleted successfully' };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    message: 'Validation error',
                    errors: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to delete channel' });
        }
    });
}
