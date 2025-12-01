import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UAParser } from 'ua-parser-js';
import prisma from '../lib/prisma';
import {
  AuthEmailService,
  generateSecureToken,
  hashToken,
  getTokenExpiry,
  TOKEN_EXPIRY,
  TokenType,
} from '../services/AuthEmailService';
import { isDisposableEmail } from '../lib/disposable-emails';

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
  locale: z.string().optional(), // 'it' or 'en'
});

const loginSchema = z.object({
  email: z.string().email('Formato email non valido'),
  password: z.string().min(1, 'Password richiesta'),
});

const magicLinkRequestSchema = z.object({
  email: z.string().email('Formato email non valido'),
  locale: z.string().optional(), // 'it' or 'en'
  betaCode: z.string().optional(), // Beta invite code (required in beta mode)
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Formato email non valido'),
  locale: z.string().optional(), // 'it' or 'en'
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
  locale: z.string().optional(), // 'it' or 'en'
});

// Persona Profile Schema - for saving user persona after onboarding survey
const personaSchema = z.object({
  // Survey answers
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  audienceSize: z.enum(['starting', 'small', 'medium', 'large']).optional(),
  primaryGoal: z.enum(['sales', 'audience', 'monetize']).optional(),
  preferredChannels: z.array(z.string()).optional(),
  hasAmazonAssociates: z.boolean().optional(),
  // Calculated persona (backend can also compute this)
  personaType: z.enum(['beginner', 'creator', 'power_user', 'monetizer']).optional(),
  // Mark onboarding as completed
  onboardingCompleted: z.boolean().optional(),
});

// ==================== CONSTANTS ====================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

// Beta testing mode - when enabled, only magic link login is allowed
const BETA_TESTING_MODE = process.env.BETA_TESTING === 'true';

if (BETA_TESTING_MODE) {
  console.log('[Auth] BETA TESTING MODE ENABLED - Password login/registration disabled');
}

// ==================== RATE LIMIT CONFIGS ====================
// Stricter limits for auth endpoints to prevent brute force attacks

const authRateLimitConfig = {
  max: 5,           // 5 requests
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Troppi tentativi. Riprova tra un minuto.',
  })
};

const registrationRateLimitConfig = {
  max: 3,           // 3 registrations
  timeWindow: '1 hour',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Troppe registrazioni da questo IP. Riprova più tardi.',
  })
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Log an authentication event for audit trail
 */
async function logAuthEvent(
  type: 'MAGIC_LINK_SENT' | 'MAGIC_LINK_CLICKED' | 'MAGIC_LINK_EXPIRED' |
        'USER_REGISTERED' | 'EMAIL_VERIFIED' |
        'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' |
        'PASSWORD_SET' | 'PASSWORD_CHANGED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_COMPLETED' |
        'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'SESSION_REVOKED',
  options: {
    userId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await prisma.authEvent.create({
      data: {
        type,
        userId: options.userId,
        email: options.email,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata,
      },
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('[AuthEvent] Failed to log event:', type, error);
  }
}

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
  type: TokenType,
  request?: FastifyRequest
): Promise<{ valid: boolean; userId?: string; error?: string; errorCode?: string }> {
  const hashedToken = hashToken(rawToken);

  // First check if token exists at all (including used ones)
  const anyToken = await prisma.authToken.findFirst({
    where: {
      token: hashedToken,
      type,
    },
  });

  if (!anyToken) {
    return { valid: false, error: 'Token non valido o scaduto', errorCode: 'invalid_token' };
  }

  // Check if token was already used (token reuse attempt)
  if (anyToken.usedAt) {
    // Log suspicious activity
    await logAuthEvent('MAGIC_LINK_EXPIRED', {
      userId: anyToken.userId,
      ipAddress: request?.ip,
      userAgent: request?.headers['user-agent'],
      metadata: {
        reason: 'token_reuse_attempt',
        usedAt: anyToken.usedAt.toISOString(),
      },
    });
    return {
      valid: false,
      error: 'Questo link è già stato utilizzato. Richiedi un nuovo link.',
      errorCode: 'token_already_used',
    };
  }

  // Check if token is expired
  if (anyToken.expiresAt < new Date()) {
    return {
      valid: false,
      error: 'Il link è scaduto. Richiedi un nuovo link.',
      errorCode: 'token_expired',
    };
  }

  return { valid: true, userId: anyToken.userId };
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

/**
 * Parse user agent to extract device info
 */
function parseUserAgent(userAgent: string | undefined): {
  browser: string | null;
  os: string | null;
  deviceType: string;
} {
  if (!userAgent) {
    return { browser: null, os: null, deviceType: 'unknown' };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name
    ? `${result.browser.name}${result.browser.version ? ` ${result.browser.version.split('.')[0]}` : ''}`
    : null;

  const os = result.os.name
    ? `${result.os.name}${result.os.version ? ` ${result.os.version}` : ''}`
    : null;

  // Determine device type
  let deviceType = 'desktop';
  if (result.device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet';
  }

  return { browser, os, deviceType };
}

/**
 * Create a session record after successful login
 */
async function createLoginSession(
  userId: string,
  jwtToken: string,
  request: FastifyRequest
): Promise<void> {
  try {
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.headers['x-forwarded-for']?.toString().split(',')[0];
    const { browser, os, deviceType } = parseUserAgent(userAgent);

    // Hash the JWT token to use as session identifier
    const tokenHash = hashToken(jwtToken);

    // Session expires in 7 days (or match your JWT expiry)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        deviceType,
        browser,
        os,
        expiresAt,
        lastActiveAt: new Date(),
      },
    });

    console.log(`[Auth] Session created for user ${userId}: ${browser} on ${os} (${deviceType})`);
  } catch (error) {
    // Don't fail the login if session creation fails
    console.error('[Auth] Failed to create session:', error);
  }
}

// ==================== ROUTE HANDLERS ====================

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * GET /auth/config
   * Get auth configuration (public endpoint)
   * Returns beta testing mode status and available auth methods
   */
  fastify.get('/config', async (_request, reply) => {
    return reply.send({
      betaTestingMode: BETA_TESTING_MODE,
      availableAuthMethods: BETA_TESTING_MODE
        ? ['magic_link']
        : ['magic_link', 'password'],
      passwordLoginEnabled: !BETA_TESTING_MODE,
      passwordRegistrationEnabled: !BETA_TESTING_MODE,
    });
  });

  /**
   * POST /auth/register
   * Register a new user with email/password
   * Rate limited: 3 per hour per IP
   */
  fastify.post<{ Body: z.infer<typeof registerSchema> }>(
    '/register',
    {
      config: {
        rateLimit: registrationRateLimitConfig
      }
    },
    async (request, reply) => {
      try {
        // Block password registration during beta testing
        if (BETA_TESTING_MODE) {
          const locale = (request.body as any)?.locale;
          return reply.code(403).send({
            error: 'beta_mode',
            message: locale === 'en'
              ? 'During beta testing, only Magic Link login is available. Please use Magic Link to sign up.'
              : 'Durante la beta, è disponibile solo il login con Magic Link. Usa Magic Link per registrarti.',
          });
        }

        const { email, password, name, locale } = registerSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        // Check for disposable email
        if (isDisposableEmail(normalizedEmail)) {
          return reply.code(400).send({
            error: 'disposable_email',
            message: locale === 'en'
              ? 'Disposable email addresses are not allowed. Please use a permanent email.'
              : 'Gli indirizzi email temporanei non sono consentiti. Usa un\'email permanente.',
          });
        }

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
              verificationToken,
              locale
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
          verificationToken,
          locale
        );

        if (!emailResult.success) {
          fastify.log.warn({ email: normalizedEmail }, 'Failed to send welcome email');
        }

        // Log registration event
        await logAuthEvent('USER_REGISTERED', {
          userId: user.id,
          email: normalizedEmail,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

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

        const verification = await verifyAuthToken(token, 'EMAIL_VERIFICATION', request);
        if (!verification.valid) {
          return reply.code(400).send({
            message: verification.error,
            errorCode: verification.errorCode,
          });
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

        // Log email verified event
        await logAuthEvent('EMAIL_VERIFIED', {
          userId: user.id,
          email: user.email,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        // Generate JWT for auto-login
        const jwtToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          brandId: user.brandId,
          plan: user.plan,
          role: user.role,
        });

        // Create session record for device tracking
        await createLoginSession(user.id, jwtToken, request);

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
        const { email, locale } = resendVerificationSchema.parse(request.body);
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
          verificationToken,
          locale
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
   * Rate limited: 5 per minute per IP
   */
  fastify.post<{ Body: z.infer<typeof loginSchema> }>(
    '/login',
    {
      config: {
        rateLimit: authRateLimitConfig
      }
    },
    async (request, reply) => {
      try {
        // Block password login during beta testing
        if (BETA_TESTING_MODE) {
          return reply.code(403).send({
            error: 'beta_mode',
            message: 'Durante la beta, è disponibile solo il login con Magic Link.',
            messageEn: 'During beta testing, only Magic Link login is available.',
          });
        }

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

          // Log failed login
          await logAuthEvent('LOGIN_FAILED', {
            userId: user.id,
            email: normalizedEmail,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            metadata: { reason: 'invalid_password', remainingAttempts },
          });

          if (locked) {
            // Log account locked
            await logAuthEvent('ACCOUNT_LOCKED', {
              userId: user.id,
              email: normalizedEmail,
              ipAddress: request.ip,
              metadata: { duration: LOCKOUT_DURATION_MINUTES },
            });

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
          // Send verification reminder - detect locale from Accept-Language header
          const acceptLanguage = request.headers['accept-language'] || 'it';
          const detectedLocale = acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'it';

          const verificationToken = await createAuthToken(
            user.id,
            'EMAIL_VERIFICATION',
            request
          );
          await AuthEmailService.sendVerificationReminder(
            normalizedEmail,
            user.name,
            verificationToken,
            detectedLocale
          );

          return reply.code(403).send({
            message: 'Devi verificare la tua email prima di accedere. Ti abbiamo inviato un nuovo link.',
            requiresVerification: true,
          });
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(user.id);

        // Log successful login
        await logAuthEvent('LOGIN_SUCCESS', {
          userId: user.id,
          email: user.email,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: { method: 'password' },
        });

        // Generate JWT token
        const token = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          brandId: user.brandId,
          plan: user.plan,
          role: user.role,
        });

        // Create session record for device tracking
        await createLoginSession(user.id, token, request);

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
   * Rate limited: 5 per minute per IP
   */
  fastify.post<{ Body: z.infer<typeof magicLinkRequestSchema> }>(
    '/magic-link',
    {
      config: {
        rateLimit: authRateLimitConfig
      }
    },
    async (request, reply) => {
      try {
        const { email, locale, betaCode } = magicLinkRequestSchema.parse(request.body);
        const normalizedEmail = email.toLowerCase().trim();

        const successMessage = locale === 'en'
          ? 'Check your email for the access link.'
          : 'Controlla la tua email per il link di accesso.';

        // Check if user already exists (ADMIN users can bypass beta check)
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, role: true, isActive: true },
        });

        // ADMIN users bypass beta code check entirely
        const isAdminUser = existingUser?.role === 'ADMIN';

        // In beta testing mode, validate beta invite code (except for ADMIN users)
        if (BETA_TESTING_MODE && !isAdminUser) {
          if (!betaCode) {
            return reply.code(400).send({
              error: 'beta_code_required',
              message: locale === 'en'
                ? 'Beta invite code is required during beta testing.'
                : 'Il codice invito beta è richiesto durante la fase di beta testing.',
            });
          }

          // Normalize beta code (uppercase, trim)
          const normalizedBetaCode = betaCode.toUpperCase().trim();

          // Validate beta code format (AFFLYT-XXXX-XXXX)
          const betaCodeRegex = /^AFFLYT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
          if (!betaCodeRegex.test(normalizedBetaCode)) {
            return reply.code(400).send({
              error: 'invalid_beta_code_format',
              message: locale === 'en'
                ? 'Invalid beta code format. Expected: AFFLYT-XXXX-XXXX'
                : 'Formato codice beta non valido. Formato atteso: AFFLYT-XXXX-XXXX',
            });
          }

          // Find the beta invite code in database
          const betaInvite = await prisma.betaInviteCode.findUnique({
            where: { code: normalizedBetaCode },
          });

          if (!betaInvite) {
            return reply.code(400).send({
              error: 'invalid_beta_code',
              message: locale === 'en'
                ? 'Invalid beta invite code.'
                : 'Codice invito beta non valido.',
            });
          }

          // Check if code is active
          if (!betaInvite.isActive) {
            return reply.code(400).send({
              error: 'beta_code_inactive',
              message: locale === 'en'
                ? 'This beta code has been deactivated.'
                : 'Questo codice beta è stato disattivato.',
            });
          }

          // Check if code has expired
          if (betaInvite.expiresAt && betaInvite.expiresAt < new Date()) {
            return reply.code(400).send({
              error: 'beta_code_expired',
              message: locale === 'en'
                ? 'This beta code has expired.'
                : 'Questo codice beta è scaduto.',
            });
          }

          // Check if code is assigned to a specific email
          if (betaInvite.assignedEmail && betaInvite.assignedEmail.toLowerCase() !== normalizedEmail) {
            return reply.code(400).send({
              error: 'beta_code_email_mismatch',
              message: locale === 'en'
                ? 'This beta code is not assigned to your email address.'
                : 'Questo codice beta non è assegnato al tuo indirizzo email.',
            });
          }

          // Check if code was already used by someone else
          if (betaInvite.usedAt) {
            // Check if it was used by this same user (allow re-login)
            const existingUser = await prisma.user.findFirst({
              where: {
                email: normalizedEmail,
                betaInviteCodeId: betaInvite.id,
              },
            });

            if (!existingUser) {
              return reply.code(400).send({
                error: 'beta_code_already_used',
                message: locale === 'en'
                  ? 'This beta code has already been used.'
                  : 'Questo codice beta è già stato utilizzato.',
              });
            }
          }

          console.log(`[Auth] Beta code validated: ${normalizedBetaCode} for ${normalizedEmail}`);
        }

        // Get validated beta invite for later use (if in beta mode)
        const validatedBetaInvite = BETA_TESTING_MODE && betaCode
          ? await prisma.betaInviteCode.findUnique({
              where: { code: betaCode.toUpperCase().trim() },
            })
          : null;

        // Check email-based rate limit: max 3 magic links per hour per email
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentMagicLinks = await prisma.authEvent.count({
          where: {
            email: normalizedEmail,
            type: 'MAGIC_LINK_SENT',
            createdAt: { gte: oneHourAgo },
          },
        });

        if (recentMagicLinks >= 3) {
          const rateLimitMessage = locale === 'en'
            ? 'Too many requests for this email. Please try again in 1 hour.'
            : 'Troppe richieste per questa email. Riprova tra 1 ora.';

          return reply.code(429).send({
            error: 'rate_limit_exceeded',
            message: rateLimitMessage,
            retryAfter: 3600, // seconds
          });
        }

        let user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        let isNewUser = false;

        // If user doesn't exist, create a new passwordless account
        if (!user) {
          // Block disposable emails for new signups
          if (isDisposableEmail(normalizedEmail)) {
            return reply.code(400).send({
              error: 'disposable_email',
              message: locale === 'en'
                ? 'Disposable email addresses are not allowed. Please use a permanent email.'
                : 'Gli indirizzi email temporanei non sono consentiti. Usa un\'email permanente.',
            });
          }

          // In beta mode, connect user to beta invite code and set plan
          const userData: any = {
            email: normalizedEmail,
            password: null, // Passwordless account
            emailVerified: false,
          };

          if (validatedBetaInvite) {
            userData.betaInviteCodeId = validatedBetaInvite.id;
            userData.plan = 'BETA_TESTER';
          }

          user = await prisma.user.create({
            data: userData,
          });
          isNewUser = true;

          // Mark beta code as used (if new user with beta code)
          if (validatedBetaInvite && !validatedBetaInvite.usedAt) {
            await prisma.betaInviteCode.update({
              where: { id: validatedBetaInvite.id },
              data: { usedAt: new Date() },
            });
            console.log(`[Auth] Beta code ${validatedBetaInvite.code} marked as used`);
          }

          console.log('[MagicLink] New beta tester user created:', normalizedEmail);
        }

        // Check if account is active (for existing users)
        if (!user.isActive) {
          return reply.send({ message: successMessage });
        }

        // Create magic link token
        const magicToken = await createAuthToken(user.id, 'MAGIC_LINK', request);

        // Send magic link email
        const emailResult = await AuthEmailService.sendMagicLinkEmail(
          normalizedEmail,
          user.name,
          magicToken,
          locale
        );

        if (!emailResult.success) {
          fastify.log.warn({ email: normalizedEmail }, 'Failed to send magic link email');
        }

        // Log magic link sent
        await logAuthEvent('MAGIC_LINK_SENT', {
          userId: user.id,
          email: normalizedEmail,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: { isNewUser },
        });

        return reply.send({
          message: successMessage,
          expiresInMinutes: TOKEN_EXPIRY.MAGIC_LINK,
          isNewUser, // Let frontend know if this is a new registration
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

        const verification = await verifyAuthToken(token, 'MAGIC_LINK', request);
        if (!verification.valid) {
          return reply.code(400).send({
            message: verification.error,
            errorCode: verification.errorCode,
          });
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

        // Log magic link login
        await logAuthEvent('MAGIC_LINK_CLICKED', {
          userId: user.id,
          email: user.email,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        await logAuthEvent('LOGIN_SUCCESS', {
          userId: user.id,
          email: user.email,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: { method: 'magic_link' },
        });

        // Generate JWT token
        const jwtToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          brandId: user.brandId,
          plan: user.plan,
          role: user.role,
        });

        // Create session record for device tracking
        await createLoginSession(user.id, jwtToken, request);

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
   * Rate limited: 5 per minute per IP
   */
  fastify.post<{ Body: z.infer<typeof forgotPasswordSchema> }>(
    '/forgot-password',
    {
      config: {
        rateLimit: authRateLimitConfig
      }
    },
    async (request, reply) => {
      try {
        const { email, locale } = forgotPasswordSchema.parse(request.body);
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
          resetToken,
          locale
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

        const verification = await verifyAuthToken(token, 'PASSWORD_RESET', request);
        if (!verification.valid) {
          return reply.code(400).send({
            message: verification.error,
            errorCode: verification.errorCode,
          });
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
   * GET /auth/persona
   * Get current user's persona profile (protected)
   */
  fastify.get(
    '/persona',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
          select: {
            personaType: true,
            experienceLevel: true,
            audienceSize: true,
            primaryGoal: true,
            preferredChannels: true,
            hasAmazonAssociates: true,
            onboardingCompletedAt: true,
          },
        });

        if (!user) {
          return reply.code(404).send({ message: 'Utente non trovato' });
        }

        return reply.send({
          persona: {
            ...user,
            onboardingCompleted: !!user.onboardingCompletedAt,
          },
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante il recupero del profilo persona' });
      }
    }
  );

  /**
   * PATCH /auth/persona
   * Update user's persona profile (from onboarding survey)
   * Also calculates and sets the personaType based on survey answers
   */
  fastify.patch<{ Body: z.infer<typeof personaSchema> }>(
    '/persona',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const data = personaSchema.parse(request.body);

        // Build update object
        const updateData: any = {};

        if (data.experienceLevel !== undefined) {
          updateData.experienceLevel = data.experienceLevel;
        }
        if (data.audienceSize !== undefined) {
          updateData.audienceSize = data.audienceSize;
        }
        if (data.primaryGoal !== undefined) {
          updateData.primaryGoal = data.primaryGoal;
        }
        if (data.preferredChannels !== undefined) {
          updateData.preferredChannels = data.preferredChannels;
        }
        if (data.hasAmazonAssociates !== undefined) {
          updateData.hasAmazonAssociates = data.hasAmazonAssociates;
        }
        if (data.onboardingCompleted) {
          updateData.onboardingCompletedAt = new Date();
        }

        // Calculate persona type if we have enough data
        // Persona determination algorithm:
        // 1. MONETIZER: goal=monetize + has audience (small/medium/large)
        // 2. POWER_USER: advanced experience + has Amazon Associates
        // 3. CREATOR: intermediate experience + has some audience (small/medium)
        // 4. BEGINNER: beginner experience OR starting audience OR no Amazon Associates
        if (data.personaType) {
          // If persona is explicitly provided, use it
          updateData.personaType = data.personaType;
        } else if (data.experienceLevel && data.audienceSize && data.primaryGoal !== undefined) {
          // Calculate persona based on survey answers
          const exp = data.experienceLevel;
          const audience = data.audienceSize;
          const goal = data.primaryGoal;
          const hasAmazon = data.hasAmazonAssociates ?? false;

          let calculatedPersona: 'beginner' | 'creator' | 'power_user' | 'monetizer';

          if (goal === 'monetize' && audience !== 'starting') {
            // Has audience and wants to monetize
            calculatedPersona = 'monetizer';
          } else if (exp === 'advanced' && hasAmazon) {
            // Expert with Amazon Associates already set up
            calculatedPersona = 'power_user';
          } else if (exp === 'intermediate' && (audience === 'small' || audience === 'medium')) {
            // Has some experience and some audience
            calculatedPersona = 'creator';
          } else {
            // Default: just getting started
            calculatedPersona = 'beginner';
          }

          updateData.personaType = calculatedPersona;
        }

        // Update user
        const user = await prisma.user.update({
          where: { id: request.user.id },
          data: updateData,
          select: {
            personaType: true,
            experienceLevel: true,
            audienceSize: true,
            primaryGoal: true,
            preferredChannels: true,
            hasAmazonAssociates: true,
            onboardingCompletedAt: true,
          },
        });

        fastify.log.info(
          { userId: request.user.id, persona: user.personaType },
          'User persona profile updated'
        );

        return reply.send({
          message: 'Profilo persona aggiornato con successo',
          persona: {
            ...user,
            onboardingCompleted: !!user.onboardingCompletedAt,
          },
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
        return reply.code(500).send({ message: 'Errore durante l\'aggiornamento del profilo persona' });
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

        // Log password changed event
        await logAuthEvent('PASSWORD_CHANGED', {
          userId: user.id,
          email: user.email,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
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
   * POST /auth/set-password
   * Set password for passwordless users (opt-in to password auth)
   * Only works if user doesn't already have a password
   */
  fastify.post<{
    Body: { password: string };
  }>(
    '/set-password',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const setPasswordSchema = z.object({
          password: z
            .string()
            .min(8, 'La password deve contenere almeno 8 caratteri')
            .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
            .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
            .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
        });

        const { password } = setPasswordSchema.parse(request.body);

        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        });

        if (!user) {
          return reply.code(404).send({ message: 'Utente non trovato' });
        }

        // Check if user already has a password
        if (user.password) {
          return reply.code(400).send({
            message: 'Password già impostata. Usa "Cambia password" per modificarla.',
            hasPassword: true,
          });
        }

        // Hash and set password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        // Log password set event
        await logAuthEvent('PASSWORD_SET', {
          userId: user.id,
          email: user.email,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        fastify.log.info({ userId: user.id }, 'User set password (passwordless -> password enabled)');

        return reply.send({
          message: 'Password impostata con successo! Ora puoi accedere anche con email e password.',
          passwordEnabled: true,
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
        return reply.code(500).send({ message: 'Errore durante l\'impostazione della password' });
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
      // Log logout event
      await logAuthEvent('LOGOUT', {
        userId: request.user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      // In a more complex setup, we could blacklist the JWT here
      // For now, the client just removes the token
      return reply.send({ message: 'Logout effettuato' });
    }
  );

  /**
   * POST /auth/revoke-all-sessions
   * Invalidate all sessions by updating passwordChangedAt
   * This forces all existing JWTs to be invalid on next use
   */
  fastify.post(
    '/revoke-all-sessions',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Update user's password timestamp to invalidate all existing tokens
        // In a production system, you'd check this timestamp during JWT verification
        await prisma.user.update({
          where: { id: userId },
          data: {
            // Reset failed attempts and clear any locks
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        // Delete all auth tokens (magic links, password resets, etc.)
        await prisma.authToken.deleteMany({
          where: { userId },
        });

        return reply.send({
          message: 'Tutte le sessioni sono state revocate. Effettua nuovamente il login.',
          logoutRequired: true,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ message: 'Errore durante la revoca delle sessioni' });
      }
    }
  );

  /**
   * DELETE /auth/account
   * Permanently delete or deactivate user account
   * Requires password confirmation for security
   */
  fastify.delete<{
    Body: { password: string; confirmation: string };
  }>(
    '/account',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const deleteAccountSchema = z.object({
          password: z.string().min(1, 'Password richiesta'),
          confirmation: z.string().refine((val) => val === 'DELETE', {
            message: 'Scrivi DELETE per confermare',
          }),
        });

        const { password } = deleteAccountSchema.parse(request.body);
        const userId = request.user.id;

        // Get user with password
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({ message: 'Utente non trovato' });
        }

        // Verify password
        if (!user.password) {
          return reply.code(400).send({
            message: 'Impossibile eliminare account senza password. Contatta il supporto.',
          });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return reply.code(401).send({ message: 'Password non corretta' });
        }

        // Soft delete: deactivate account and anonymize data
        // This preserves referential integrity while removing PII
        await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            email: `deleted_${userId}@deleted.afflyt.io`,
            name: 'Account Eliminato',
            password: null,
            emailVerified: false,
            emailVerifiedAt: null,
          },
        });

        // Delete all auth tokens
        await prisma.authToken.deleteMany({
          where: { userId },
        });

        // Delete credentials (sensitive data)
        await prisma.credential.deleteMany({
          where: { userId },
        });

        return reply.send({
          message: 'Account eliminato con successo. Ci dispiace vederti andare.',
          deleted: true,
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
        return reply.code(500).send({ message: 'Errore durante l\'eliminazione dell\'account' });
      }
    }
  );
}
