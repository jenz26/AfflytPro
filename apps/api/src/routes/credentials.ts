import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { SecurityService } from '../services/SecurityService';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createCredentialSchema = z.object({
    provider: z.string().min(1, 'Provider is required').max(50),
    key: z.string().min(10, 'API key must be at least 10 characters'),
    label: z.string().max(100).optional()
});

const idParamSchema = z.object({
    id: z.string().uuid('Invalid ID format')
});

export async function credentialRoutes(fastify: FastifyInstance) {
    const securityService = new SecurityService();

    // Protect all routes in this plugin
    fastify.addHook('onRequest', fastify.authenticate);

    // Create Credential
    fastify.post<{ Body: { provider: string; key: string; label?: string } }>('/', async (request, reply) => {
        const userId = request.user.id;

        try {
            const { provider, key, label } = createCredentialSchema.parse(request.body);
            const encryptedKey = securityService.encrypt(key);

            const credential = await prisma.credential.create({
                data: {
                    userId,
                    provider,
                    key: encryptedKey,
                    label,
                },
            });

            return {
                id: credential.id,
                provider: credential.provider,
                label: credential.label,
                createdAt: credential.createdAt,
                status: 'active'
            };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    message: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to secure credential' });
        }
    });

    // Get Credentials (Masked)
    fastify.get('/', async (request, reply) => {
        const userId = request.user.id;

        const credentials = await prisma.credential.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return credentials.map(cred => ({
            id: cred.id,
            provider: cred.provider,
            label: cred.label,
            // Return masked key for UI preview
            maskedKey: '••••••••••••••••',
            createdAt: cred.createdAt,
            updatedAt: cred.updatedAt
        }));
    });

    // Delete Credential
    fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const userId = request.user.id;

        try {
            const { id } = idParamSchema.parse(request.params);

            const credential = await prisma.credential.findUnique({
                where: { id },
            });

            if (!credential || credential.userId !== userId) {
                return reply.code(404).send({ message: 'Credential not found' });
            }

            await prisma.credential.delete({
                where: { id },
            });

            return { message: 'Credential deleted successfully' };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    message: 'Validation error',
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to delete credential' });
        }
    });
}
