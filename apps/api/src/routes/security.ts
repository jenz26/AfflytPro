import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';

// ==================== VALIDATION SCHEMAS ====================

const verifyTotpSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
});

const disableTotpSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
  password: z.string().min(1, 'Password required'),
});

const useBackupCodeSchema = z.object({
  backupCode: z.string().min(1, 'Backup code required'),
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Format: XXXX-XXXX
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 */
async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

/**
 * Verify a backup code
 */
async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(code.toUpperCase(), hashedCodes[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse user agent for device info
 */
function parseUserAgent(ua: string | undefined): { deviceType: string; browser: string; os: string } {
  if (!ua) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  // Simple parser - in production use a proper UA parser library
  let deviceType = 'desktop';
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

  let browser = 'unknown';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';

  return { deviceType, browser, os };
}

/**
 * Hash a session token for storage
 */
function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ==================== ROUTE HANDLERS ====================

export async function securityRoutes(fastify: FastifyInstance) {
  // ==================== 2FA TOTP ROUTES ====================

  /**
   * POST /security/2fa/setup
   * Start 2FA setup - generate secret and QR code
   * Requires authentication
   */
  fastify.post(
    '/2fa/setup',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        if (user.totpEnabled) {
          return reply.code(400).send({
            message: '2FA is already enabled',
            error: '2fa_already_enabled',
          });
        }

        // Generate new TOTP secret
        const secret = authenticator.generateSecret();

        // Generate otpauth URI for QR code
        const otpauthUrl = authenticator.keyuri(user.email, 'Afflyt', secret);

        // Store secret temporarily (not enabled yet)
        await prisma.user.update({
          where: { id: userId },
          data: {
            totpSecret: secret, // In production, encrypt this
            totpEnabled: false,
          },
        });

        return reply.send({
          secret,
          otpauthUrl,
          message: 'Scan the QR code with your authenticator app, then verify with a code',
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error setting up 2FA' });
      }
    }
  );

  /**
   * POST /security/2fa/verify
   * Verify TOTP code and enable 2FA
   * Requires authentication
   */
  fastify.post<{ Body: z.infer<typeof verifyTotpSchema> }>(
    '/2fa/verify',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { code } = verifyTotpSchema.parse(request.body);
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        if (!user.totpSecret) {
          return reply.code(400).send({
            message: 'Please start 2FA setup first',
            error: 'no_secret',
          });
        }

        if (user.totpEnabled) {
          return reply.code(400).send({
            message: '2FA is already enabled',
            error: '2fa_already_enabled',
          });
        }

        // Verify the code
        const isValid = authenticator.verify({
          token: code,
          secret: user.totpSecret,
        });

        if (!isValid) {
          return reply.code(400).send({
            message: 'Invalid code. Please try again.',
            error: 'invalid_code',
          });
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedBackupCodes = await hashBackupCodes(backupCodes);

        // Enable 2FA
        await prisma.user.update({
          where: { id: userId },
          data: {
            totpEnabled: true,
            totpVerifiedAt: new Date(),
            backupCodes: hashedBackupCodes,
          },
        });

        fastify.log.info({ userId }, '2FA enabled');

        return reply.send({
          message: '2FA enabled successfully',
          backupCodes, // Return backup codes only once!
          warning: 'Save these backup codes in a secure place. They will not be shown again.',
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Invalid code format',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error verifying 2FA' });
      }
    }
  );

  /**
   * POST /security/2fa/disable
   * Disable 2FA
   * Requires authentication + TOTP code + password
   */
  fastify.post<{ Body: z.infer<typeof disableTotpSchema> }>(
    '/2fa/disable',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { code, password } = disableTotpSchema.parse(request.body);
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        if (!user.totpEnabled) {
          return reply.code(400).send({
            message: '2FA is not enabled',
            error: '2fa_not_enabled',
          });
        }

        // Verify password
        if (!user.password) {
          return reply.code(400).send({
            message: 'Cannot disable 2FA without password. Set a password first.',
            error: 'no_password',
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return reply.code(401).send({
            message: 'Invalid password',
            error: 'invalid_password',
          });
        }

        // Verify TOTP code
        const isCodeValid = authenticator.verify({
          token: code,
          secret: user.totpSecret!,
        });

        if (!isCodeValid) {
          return reply.code(400).send({
            message: 'Invalid 2FA code',
            error: 'invalid_code',
          });
        }

        // Disable 2FA
        await prisma.user.update({
          where: { id: userId },
          data: {
            totpEnabled: false,
            totpSecret: null,
            totpVerifiedAt: null,
            backupCodes: [],
          },
        });

        fastify.log.info({ userId }, '2FA disabled');

        return reply.send({
          message: '2FA disabled successfully',
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Validation error',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error disabling 2FA' });
      }
    }
  );

  /**
   * GET /security/2fa/status
   * Get 2FA status
   * Requires authentication
   */
  fastify.get(
    '/2fa/status',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            totpEnabled: true,
            totpVerifiedAt: true,
            backupCodes: true,
          },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        return reply.send({
          enabled: user.totpEnabled,
          enabledAt: user.totpVerifiedAt,
          backupCodesRemaining: user.backupCodes.length,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error fetching 2FA status' });
      }
    }
  );

  /**
   * POST /security/2fa/regenerate-backup-codes
   * Regenerate backup codes
   * Requires authentication + TOTP code
   */
  fastify.post<{ Body: z.infer<typeof verifyTotpSchema> }>(
    '/2fa/regenerate-backup-codes',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { code } = verifyTotpSchema.parse(request.body);
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({ message: 'User not found' });
        }

        if (!user.totpEnabled) {
          return reply.code(400).send({
            message: '2FA is not enabled',
            error: '2fa_not_enabled',
          });
        }

        // Verify TOTP code
        const isValid = authenticator.verify({
          token: code,
          secret: user.totpSecret!,
        });

        if (!isValid) {
          return reply.code(400).send({
            message: 'Invalid 2FA code',
            error: 'invalid_code',
          });
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedBackupCodes = await hashBackupCodes(backupCodes);

        // Update backup codes
        await prisma.user.update({
          where: { id: userId },
          data: {
            backupCodes: hashedBackupCodes,
          },
        });

        fastify.log.info({ userId }, 'Backup codes regenerated');

        return reply.send({
          message: 'Backup codes regenerated',
          backupCodes,
          warning: 'Save these backup codes in a secure place. They will not be shown again.',
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Invalid code format',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error regenerating backup codes' });
      }
    }
  );

  // ==================== SESSION MANAGEMENT ROUTES ====================

  /**
   * GET /security/sessions
   * Get all active sessions
   * Requires authentication
   */
  fastify.get(
    '/sessions',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Get current session token from JWT
        const currentTokenHash = hashSessionToken(request.headers.authorization?.replace('Bearer ', '') || '');

        const sessions = await prisma.session.findMany({
          where: {
            userId,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { lastActiveAt: 'desc' },
          select: {
            id: true,
            deviceType: true,
            browser: true,
            os: true,
            ipAddress: true,
            location: true,
            lastActiveAt: true,
            createdAt: true,
            tokenHash: true,
          },
        });

        // Mark which session is current
        const sessionsWithCurrent = sessions.map((session) => ({
          ...session,
          isCurrent: session.tokenHash === currentTokenHash,
          tokenHash: undefined, // Don't expose hash
        }));

        return reply.send({
          sessions: sessionsWithCurrent,
          count: sessions.length,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error fetching sessions' });
      }
    }
  );

  /**
   * DELETE /security/sessions/:sessionId
   * Revoke a specific session
   * Requires authentication
   */
  fastify.delete<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { sessionId } = request.params;

        // Verify session belongs to user
        const session = await prisma.session.findFirst({
          where: {
            id: sessionId,
            userId,
          },
        });

        if (!session) {
          return reply.code(404).send({ message: 'Session not found' });
        }

        // Revoke session
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'User revoked',
          },
        });

        fastify.log.info({ userId, sessionId }, 'Session revoked');

        return reply.send({ message: 'Session revoked' });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error revoking session' });
      }
    }
  );

  /**
   * DELETE /security/sessions
   * Revoke all sessions except current
   * Requires authentication
   */
  fastify.delete(
    '/sessions',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Get current session token from JWT
        const currentTokenHash = hashSessionToken(request.headers.authorization?.replace('Bearer ', '') || '');

        // Revoke all sessions except current
        const result = await prisma.session.updateMany({
          where: {
            userId,
            isRevoked: false,
            tokenHash: { not: currentTokenHash },
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'User revoked all sessions',
          },
        });

        fastify.log.info({ userId, count: result.count }, 'All other sessions revoked');

        return reply.send({
          message: `Revoked ${result.count} session(s)`,
          revokedCount: result.count,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error revoking sessions' });
      }
    }
  );

  /**
   * POST /security/sessions/create
   * Create a session record (called during login)
   * Internal use - called from auth routes
   */
  fastify.post(
    '/sessions/create',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const token = request.headers.authorization?.replace('Bearer ', '') || '';

        if (!token) {
          return reply.code(400).send({ message: 'No token provided' });
        }

        const tokenHash = hashSessionToken(token);
        const { deviceType, browser, os } = parseUserAgent(request.headers['user-agent']);

        // Check if session already exists
        const existingSession = await prisma.session.findUnique({
          where: { tokenHash },
        });

        if (existingSession) {
          // Update last active
          await prisma.session.update({
            where: { tokenHash },
            data: { lastActiveAt: new Date() },
          });
          return reply.send({ message: 'Session updated', sessionId: existingSession.id });
        }

        // Create new session
        const session = await prisma.session.create({
          data: {
            userId,
            tokenHash,
            userAgent: request.headers['user-agent'],
            ipAddress: request.ip,
            deviceType,
            browser,
            os,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        return reply.send({
          message: 'Session created',
          sessionId: session.id,
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Duplicate session - ignore
          return reply.send({ message: 'Session already exists' });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Error creating session' });
      }
    }
  );
}
