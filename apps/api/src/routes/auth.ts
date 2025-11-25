import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import {
  AuthEmailService,
  generateSecureToken,
  hashToken,
  getTokenExpiry,
  TOKEN_EXPIRY,
  TokenType,
} from '../services/AuthEmailService';

// ==================== VALIDATION SCHEMAS ====================

const registerSchema = z.object({
  email: z.string().email('Formato email non valido'),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Formato email non valido'),
  password: z.string().min(1, 'Password richiesta'),
});

const magicLinkRequestSchema = z.object({
  email: z.string().email('Formato email non valido'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Formato email non valido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token richiesto'),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token richiesto'),
});

const verifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token richiesto'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Formato email non valido'),
});

// ==================== CONSTANTS ====================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

// ==================== HELPER FUNCTIONS ====================

/**
 * Create an auth token and store it in the database
 */
async function createAuthToken(
  userId: string,
  type: TokenType,
  request: FastifyRequest
): Promise<string> {
  const rawToken = generateSecureToken();
  const hashedToken = hashToken(rawToken);
  const expiresAt = getTokenExpiry(type);

  // Delete any existing tokens of the same type for this user
  await prisma.authToken.deleteMany({
    where: { userId, type },
  });

  // Create new token
  await prisma.authToken.create({
    data: {
      userId,
      token: hashedToken,
      type,
      expiresAt,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    },
  });

  return rawToken;
}

/**
 * Verify an auth token
 */
async function verifyAuthToken(
  rawToken: string,
  type: TokenType
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const hashedToken = hashToken(rawToken);

  const token = await prisma.authToken.findFirst({
    where: {
      token: hashedToken,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!token) {
    return { valid: false, error: 'Token non valido o scaduto' };
  }

  return { valid: true, userId: token.userId };
}

/**
 * Mark a token as used
 */
async function markTokenAsUsed(rawToken: string): Promise<void> {
  const hashedToken = hashToken(rawToken);
  await prisma.authToken.updateMany({
    where: { token: hashedToken },
    data: { usedAt: new Date() },
  });
}

/**
 * Check if user is locked out
 */
function isUserLockedOut(user: { lockedUntil: Date | null }): boolean {
  if (!user.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

/**
 * Handle failed login attempt
 */
async function handleFailedLogin(userId: string): Promise<{ locked: boolean; remainingAttempts: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };

  const newAttempts = user.failedLoginAttempts + 1;

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the account
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
      },
    });
    return { locked: true, remainingAttempts: 0 };
  }

  // Increment failed attempts
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: newAttempts },
  });

  return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttempts };
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

/**
 * Sanitize user object for response (remove sensitive fields)
 */
function sanitizeUser(user: any) {
  const { password, failedLoginAttempts, lockedUntil, ...safeUser } = user;
  return safeUser;
}

// ==================== ROUTE HANDLERS ====================

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/register
   * Register a new user with email/password
   */
  fastify.post<{ Body: z.infer<typeof registerSchema> }>(
    '/register',
    async (request, reply) => {
      try {
        const { email, password, name } = registerSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          // Don't reveal if email exists - security best practice
          // But still send verification email if unverified
          if (!existingUser.emailVerified) {
            const verificationToken = await createAuthToken(
              existingUser.id,
              'EMAIL_VERIFICATION',
              request
            );
            await AuthEmailService.sendWelcomeEmail(
              normalizedEmail,
              existingUser.name,
              verificationToken
            );
          }

          return reply.code(200).send({
            message: 'Se questa email non è registrata, riceverai un link di verifica.',
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            name,
            emailVerified: false,
          },
        });

        // Create verification token
        const verificationToken = await createAuthToken(
          user.id,
          'EMAIL_VERIFICATION',
          request
        );

        // Send welcome email with verification link
        const emailResult = await AuthEmailService.sendWelcomeEmail(
          normalizedEmail,
          name || null,
          verificationToken
        );

        if (!emailResult.success) {
          fastify.log.warn({ email: normalizedEmail }, 'Failed to send welcome email');
        }

        return reply.code(201).send({
          message: 'Registrazione completata! Controlla la tua email per verificare l\'account.',
          emailSent: emailResult.success,
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante la registrazione' });
      }
    }
  );

  /**
   * POST /auth/verify-email
   * Verify email address with token
   */
  fastify.post<{ Body: z.infer<typeof verifyEmailSchema> }>(
    '/verify-email',
    async (request, reply) => {
      try {
        const { token } = verifyEmailSchema.parse(request.body);

        const verification = await verifyAuthToken(token, 'EMAIL_VERIFICATION');
        if (!verification.valid) {
          return reply.code(400).send({ message: verification.error });
        }

        // Mark email as verified
        const user = await prisma.user.update({
          where: { id: verification.userId },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });

        // Mark token as used
        await markTokenAsUsed(token);

        // Generate JWT for auto-login
        const jwtToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          brandId: user.brandId,
        });

        return reply.send({
          message: 'Email verificata con successo!',
          token: jwtToken,
          user: sanitizeUser(user),
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Token non valido',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante la verifica' });
      }
    }
  );

  /**
   * POST /auth/resend-verification
   * Resend verification email
   */
  fastify.post<{ Body: z.infer<typeof resendVerificationSchema> }>(
    '/resend-verification',
    async (request, reply) => {
      try {
        const { email } = resendVerificationSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Always return success to prevent email enumeration
        if (!user || user.emailVerified) {
          return reply.send({
            message: 'Se l\'account esiste e non è verificato, riceverai una nuova email.',
          });
        }

        // Create new verification token
        const verificationToken = await createAuthToken(
          user.id,
          'EMAIL_VERIFICATION',
          request
        );

        // Send verification email
        await AuthEmailService.sendVerificationReminder(
          normalizedEmail,
          user.name,
          verificationToken
        );

        return reply.send({
          message: 'Se l\'account esiste e non è verificato, riceverai una nuova email.',
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante l\'invio' });
      }
    }
  );

  /**
   * POST /auth/login
   * Login with email/password
   */
  fastify.post<{ Body: z.infer<typeof loginSchema> }>(
    '/login',
    async (request, reply) => {
      try {
        const { email, password } = loginSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Generic error message to prevent email enumeration
        const genericError = 'Email o password non corretti';

        if (!user) {
          return reply.code(401).send({ message: genericError });
        }

        // Check if account is locked
        if (isUserLockedOut(user)) {
          const lockExpiry = user.lockedUntil!;
          const minutesRemaining = Math.ceil(
            (lockExpiry.getTime() - Date.now()) / 60000
          );
          return reply.code(423).send({
            message: `Account temporaneamente bloccato. Riprova tra ${minutesRemaining} minuti.`,
            lockedUntil: lockExpiry.toISOString(),
          });
        }

        // Check if account is active
        if (!user.isActive) {
          return reply.code(403).send({
            message: 'Account disattivato. Contatta il supporto.',
          });
        }

        // Check if password exists (user might have only magic link)
        if (!user.password) {
          return reply.code(401).send({
            message: 'Questo account usa solo Magic Link. Usa "Accedi con Magic Link".',
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          const { locked, remainingAttempts } = await handleFailedLogin(user.id);

          if (locked) {
            return reply.code(423).send({
              message: `Troppi tentativi falliti. Account bloccato per ${LOCKOUT_DURATION_MINUTES} minuti.`,
            });
          }

          return reply.code(401).send({
            message: genericError,
            remainingAttempts,
          });
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Send verification reminder
          const verificationToken = await createAuthToken(
            user.id,
            'EMAIL_VERIFICATION',
            request
          );
          await AuthEmailService.sendVerificationReminder(
            normalizedEmail,
            user.name,
            verificationToken
          );

          return reply.code(403).send({
            message: 'Devi verificare la tua email prima di accedere. Ti abbiamo inviato un nuovo link.',
            requiresVerification: true,
          });
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(user.id);

        // Generate JWT token
        const token = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          brandId: user.brandId,
          plan: user.plan,
        });

        return reply.send({
          message: 'Login effettuato con successo',
          token,
          user: sanitizeUser(user),
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante il login' });
      }
    }
  );

  /**
   * POST /auth/magic-link
   * Request a magic link for passwordless login
   */
  fastify.post<{ Body: z.infer<typeof magicLinkRequestSchema> }>(
    '/magic-link',
    async (request, reply) => {
      try {
        const { email } = magicLinkRequestSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Always return success to prevent email enumeration
        const successMessage = 'Se l\'email è registrata, riceverai un link di accesso.';

        if (!user) {
          return reply.send({ message: successMessage });
        }

        // Check if account is active
        if (!user.isActive) {
          return reply.send({ message: successMessage });
        }

        // Create magic link token
        const magicToken = await createAuthToken(user.id, 'MAGIC_LINK', request);

        // Send magic link email
        const emailResult = await AuthEmailService.sendMagicLinkEmail(
          normalizedEmail,
          user.name,
          magicToken
        );

        if (!emailResult.success) {
          fastify.log.warn({ email: normalizedEmail }, 'Failed to send magic link email');
        }

        return reply.send({
          message: successMessage,
          expiresInMinutes: TOKEN_EXPIRY.MAGIC_LINK,
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante l\'invio del magic link' });
      }
    }
  );

  /**
   * POST /auth/magic-link/verify
   * Verify magic link and login
   */
  fastify.post<{ Body: z.infer<typeof verifyMagicLinkSchema> }>(
    '/magic-link/verify',
    async (request, reply) => {
      try {
        const { token } = verifyMagicLinkSchema.parse(request.body);

        const verification = await verifyAuthToken(token, 'MAGIC_LINK');
        if (!verification.valid) {
          return reply.code(400).send({ message: verification.error });
        }

        // Get user and update last login
        const user = await prisma.user.update({
          where: { id: verification.userId },
          data: {
            lastLoginAt: new Date(),
            emailVerified: true, // Magic link also verifies email
            emailVerifiedAt: new Date(),
          },
        });

        // Mark token as used
        await markTokenAsUsed(token);

        // Generate JWT token
        const jwtToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          brandId: user.brandId,
          plan: user.plan,
        });

        return reply.send({
          message: 'Accesso effettuato con successo',
          token: jwtToken,
          user: sanitizeUser(user),
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Token non valido',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante la verifica' });
      }
    }
  );

  /**
   * POST /auth/forgot-password
   * Request password reset
   */
  fastify.post<{ Body: z.infer<typeof forgotPasswordSchema> }>(
    '/forgot-password',
    async (request, reply) => {
      try {
        const { email } = forgotPasswordSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Always return success to prevent email enumeration
        const successMessage = 'Se l\'email è registrata, riceverai le istruzioni per il reset.';

        if (!user) {
          return reply.send({ message: successMessage });
        }

        // Create password reset token
        const resetToken = await createAuthToken(user.id, 'PASSWORD_RESET', request);

        // Send password reset email
        const emailResult = await AuthEmailService.sendPasswordResetEmail(
          normalizedEmail,
          user.name,
          resetToken
        );

        if (!emailResult.success) {
          fastify.log.warn({ email: normalizedEmail }, 'Failed to send password reset email');
        }

        return reply.send({
          message: successMessage,
          expiresInMinutes: TOKEN_EXPIRY.PASSWORD_RESET,
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues,
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante l\'invio' });
      }
    }
  );

  /**
   * POST /auth/reset-password
   * Reset password with token
   */
  fastify.post<{ Body: z.infer<typeof resetPasswordSchema> }>(
    '/reset-password',
    async (request, reply) => {
      try {
        const { token, password } = resetPasswordSchema.parse(request.body);

        const verification = await verifyAuthToken(token, 'PASSWORD_RESET');
        if (!verification.valid) {
          return reply.code(400).send({ message: verification.error });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Update password and reset failed attempts
        const user = await prisma.user.update({
          where: { id: verification.userId },
          data: {
            password: hashedPassword,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        // Mark token as used
        await markTokenAsUsed(token);

        // Invalidate all existing magic links and reset tokens
        await prisma.authToken.deleteMany({
          where: {
            userId: user.id,
            type: { in: ['MAGIC_LINK', 'PASSWORD_RESET'] },
          },
        });

        return reply.send({
          message: 'Password reimpostata con successo! Ora puoi accedere.',
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante il reset' });
      }
    }
  );

  /**
   * GET /auth/me
   * Get current user profile (protected)
   */
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        });

        if (!user) {
          return reply.code(404).send({ message: 'Utente non trovato' });
        }

        return reply.send({ user: sanitizeUser(user) });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante il recupero del profilo' });
      }
    }
  );

  /**
   * POST /auth/change-password
   * Change password for authenticated user
   */
  fastify.post<{
    Body: { currentPassword: string; newPassword: string };
  }>(
    '/change-password',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const changePasswordSchema = z.object({
          currentPassword: z.string().min(1, 'Password corrente richiesta'),
          newPassword: z
            .string()
            .min(8, 'La password deve contenere almeno 8 caratteri')
            .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
            .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
            .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
        });

        const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);

        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        });

        if (!user || !user.password) {
          return reply.code(400).send({
            message: 'Impossibile cambiare la password per questo account',
          });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return reply.code(401).send({ message: 'Password corrente non corretta' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Update password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        return reply.send({ message: 'Password cambiata con successo' });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            message: 'Errore di validazione',
            errors: err.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante il cambio password' });
      }
    }
  );

  /**
   * POST /auth/logout
   * Logout (client-side token removal, but we can track it)
   */
  fastify.post(
    '/logout',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      // In a more complex setup, we could blacklist the JWT here
      // For now, the client just removes the token
      return reply.send({ message: 'Logout effettuato' });
    }
  );
}
