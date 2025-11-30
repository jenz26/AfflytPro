import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';

// ==================== VALIDATION SCHEMAS ====================

const redeemCodeSchema = z.object({
  code: z.string().regex(/^AFFLYT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid code format'),
});

const createCodeSchema = z.object({
  assignedEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a unique beta invite code
 * Format: AFFLYT-XXXX-XXXX
 */
function generateBetaCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for clarity
  const segment = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `AFFLYT-${segment()}-${segment()}`;
}

/**
 * Generate multiple unique codes
 */
async function generateUniqueCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  const maxAttempts = count * 3;
  let attempts = 0;

  while (codes.length < count && attempts < maxAttempts) {
    const code = generateBetaCode();

    // Check if code already exists
    const existing = await prisma.betaInviteCode.findUnique({
      where: { code },
    });

    if (!existing && !codes.includes(code)) {
      codes.push(code);
    }
    attempts++;
  }

  return codes;
}

// ==================== ROUTE HANDLERS ====================

export async function betaRoutes(fastify: FastifyInstance) {
  /**
   * POST /beta/redeem
   * Redeem a beta invite code
   * Requires authentication
   */
  fastify.post<{ Body: z.infer<typeof redeemCodeSchema> }>(
    '/redeem',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { code } = redeemCodeSchema.parse(request.body);
        const userId = request.user.id;

        // Get user
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { betaInviteCode: true },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        // Check if user already has a beta code
        if (user.betaInviteCodeId) {
          return reply.code(400).send({
            message: 'Already a beta tester',
            error: 'already_beta_tester',
          });
        }

        // Check if user is already BETA_TESTER
        if (user.plan === 'BETA_TESTER') {
          return reply.code(400).send({
            message: 'Already a beta tester',
            error: 'already_beta_tester',
          });
        }

        // Find the invite code
        const inviteCode = await prisma.betaInviteCode.findUnique({
          where: { code: code.toUpperCase() },
        });

        if (!inviteCode) {
          return reply.code(404).send({
            message: 'Invalid code',
            error: 'invalid_code',
          });
        }

        // Check if code is active
        if (!inviteCode.isActive) {
          return reply.code(400).send({
            message: 'This code is no longer valid',
            error: 'code_inactive',
          });
        }

        // Check if code has expired
        if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
          return reply.code(400).send({
            message: 'This code has expired',
            error: 'code_expired',
          });
        }

        // Check if code was already used
        if (inviteCode.usedAt) {
          return reply.code(400).send({
            message: 'This code has already been used',
            error: 'code_used',
          });
        }

        // Check if code is assigned to a specific email
        if (inviteCode.assignedEmail && inviteCode.assignedEmail.toLowerCase() !== user.email.toLowerCase()) {
          return reply.code(403).send({
            message: 'This code is assigned to a different email',
            error: 'code_wrong_email',
          });
        }

        // Redeem the code - update user and code in a transaction
        const [updatedUser] = await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'BETA_TESTER',
              betaInviteCodeId: inviteCode.id,
            },
          }),
          prisma.betaInviteCode.update({
            where: { id: inviteCode.id },
            data: {
              usedAt: new Date(),
            },
          }),
        ]);

        fastify.log.info({ userId, code }, 'Beta code redeemed successfully');

        return reply.send({
          message: 'Welcome to the beta program!',
          plan: updatedUser.plan,
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Invalid code format. Expected: AFFLYT-XXXX-XXXX',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error redeeming code' });
      }
    }
  );

  /**
   * GET /beta/status
   * Get current user's beta status
   * Requires authentication
   */
  fastify.get(
    '/status',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            betaInviteCode: {
              select: {
                code: true,
                usedAt: true,
              },
            },
          },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        return reply.send({
          isBetaTester: user.plan === 'BETA_TESTER',
          plan: user.plan,
          betaCode: user.betaInviteCode?.code || null,
          redeemedAt: user.betaInviteCode?.usedAt || null,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error fetching beta status' });
      }
    }
  );

  // ==================== ADMIN ROUTES ====================

  /**
   * POST /beta/admin/generate
   * Generate new beta invite codes (ADMIN only)
   */
  fastify.post<{ Body: { count?: number } & z.infer<typeof createCodeSchema> }>(
    '/admin/generate',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN') {
          return reply.code(403).send({ message: 'Admin access required' });
        }

        const { count = 1, assignedEmail, notes, expiresAt } = request.body;

        if (count < 1 || count > 100) {
          return reply.code(400).send({ message: 'Count must be between 1 and 100' });
        }

        // Generate unique codes
        const codes = await generateUniqueCodes(count);

        if (codes.length < count) {
          return reply.code(500).send({ message: 'Could not generate enough unique codes' });
        }

        // Create codes in database
        const createdCodes = await prisma.betaInviteCode.createMany({
          data: codes.map((code) => ({
            code,
            assignedEmail: assignedEmail?.toLowerCase(),
            notes,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: userId,
          })),
        });

        fastify.log.info({ count: createdCodes.count, createdBy: userId }, 'Beta codes generated');

        return reply.send({
          message: `Generated ${createdCodes.count} beta code(s)`,
          codes,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error generating codes' });
      }
    }
  );

  /**
   * GET /beta/admin/codes
   * List all beta invite codes (ADMIN only)
   */
  fastify.get<{ Querystring: { page?: number; limit?: number; status?: string } }>(
    '/admin/codes',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN') {
          return reply.code(403).send({ message: 'Admin access required' });
        }

        const { page = 1, limit = 50, status } = request.query;
        const skip = (page - 1) * limit;

        // Build filter
        const where: any = {};
        if (status === 'active') {
          where.isActive = true;
          where.usedAt = null;
        } else if (status === 'used') {
          where.usedAt = { not: null };
        } else if (status === 'inactive') {
          where.isActive = false;
        }

        const [codes, total] = await Promise.all([
          prisma.betaInviteCode.findMany({
            where,
            include: {
              users: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.betaInviteCode.count({ where }),
        ]);

        return reply.send({
          codes,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error fetching codes' });
      }
    }
  );

  /**
   * PATCH /beta/admin/codes/:codeId
   * Update a beta invite code (ADMIN only)
   */
  fastify.patch<{ Params: { codeId: string }; Body: { isActive?: boolean; notes?: string } }>(
    '/admin/codes/:codeId',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { codeId } = request.params;
        const { isActive, notes } = request.body;

        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN') {
          return reply.code(403).send({ message: 'Admin access required' });
        }

        const updatedCode = await prisma.betaInviteCode.update({
          where: { id: codeId },
          data: {
            ...(isActive !== undefined && { isActive }),
            ...(notes !== undefined && { notes }),
          },
        });

        return reply.send({ code: updatedCode });
      } catch (err: any) {
        if (err.code === 'P2025') {
          return reply.code(404).send({ message: 'Code not found' });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error updating code' });
      }
    }
  );

  /**
   * DELETE /beta/admin/revoke/:userId
   * Revoke beta access from a user (ADMIN only)
   */
  fastify.delete<{ Params: { userId: string } }>(
    '/admin/revoke/:userId',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const adminId = request.user.id;
        const { userId } = request.params;

        // Check if user is admin
        const admin = await prisma.user.findUnique({
          where: { id: adminId },
        });

        if (!admin || admin.role !== 'ADMIN') {
          return reply.code(403).send({ message: 'Admin access required' });
        }

        // Get the target user
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          return reply.code(404).send({ message: 'User not found' });
        }

        if (targetUser.plan !== 'BETA_TESTER') {
          return reply.code(400).send({ message: 'User is not a beta tester' });
        }

        // Revoke beta access - set plan back to FREE
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'FREE',
            betaInviteCodeId: null,
          },
        });

        fastify.log.info({ adminId, userId }, 'Beta access revoked');

        return reply.send({ message: 'Beta access revoked' });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error revoking beta access' });
      }
    }
  );
}
