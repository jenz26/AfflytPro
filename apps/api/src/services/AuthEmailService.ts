import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Configuration
const APP_NAME = 'Afflyt Pro';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@afflyt.io';
const FROM_NAME = process.env.FROM_NAME || 'Afflyt Pro';

// Token expiration times (in minutes)
export const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60, // 24 hours
  PASSWORD_RESET: 60,          // 1 hour
  MAGIC_LINK: 15,              // 15 minutes
} as const;

export type TokenType = keyof typeof TOKEN_EXPIRY;

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiry(type: TokenType): Date {
  const minutes = TOKEN_EXPIRY[type];
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * AuthEmailService - Handles all authentication-related emails using Resend
 */
export class AuthEmailService {
  /**
   * Validate Resend API key
   */
  static async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const testClient = new Resend(apiKey);
      // Send a test request to validate the key
      await testClient.emails.send({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev',
        subject: 'API Key Validation',
        text: 'This is a test email to validate the API key.',
      });
      return { valid: true };
    } catch (error: any) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return { valid: false, error: 'Invalid API key' };
      }
      // Other errors might be OK (rate limits, etc.)
      return { valid: true };
    }
  }

  /**
   * Check if email service is configured
   */
  static isConfigured(): boolean {
    return resend !== null;
  }

  /**
   * Send welcome email with verification link
   */
  static async sendWelcomeEmail(
    to: string,
    name: string | null,
    verificationToken: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Email service not configured. Skipping welcome email.');
      return { success: false, error: 'Email service not configured' };
    }

    const verificationUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`;
    const displayName = name || 'there';

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: `🎉 Benvenuto su ${APP_NAME}! Verifica la tua email`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto su ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0b0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #14151c 0%, #1a1b26 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(0, 229, 224, 0.2);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #0a0b0f; margin: 0; font-size: 28px; font-weight: bold;">
                🚀 ${APP_NAME}
              </h1>
              <p style="color: #0a0b0f; margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">
                Command Center
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                Ciao ${displayName}! 👋
              </h2>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Grazie per esserti registrato su <strong style="color: #00E5E0;">${APP_NAME}</strong>!
                Sei a un passo dall'accedere alla piattaforma di affiliate marketing più avanzata.
              </p>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Per completare la registrazione e attivare il tuo account, clicca il pulsante qui sotto:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); color: #0a0b0f; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 229, 224, 0.3);">
                      ✨ Verifica Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                Il link scadrà tra <strong>24 ore</strong>.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                Se non riesci a cliccare il pulsante, copia e incolla questo link nel browser:
              </p>
              <p style="color: #00E5E0; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
                ${verificationUrl}
              </p>
            </td>
          </tr>

          <!-- Features Preview -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 229, 224, 0.05); border-radius: 12px; padding: 24px; border: 1px solid rgba(0, 229, 224, 0.1);">
                <tr>
                  <td>
                    <p style="color: #ffffff; font-size: 14px; font-weight: bold; margin: 0 0 16px 0;">
                      Cosa potrai fare con ${APP_NAME}:
                    </p>
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                      ✅ Trovare i migliori deal Amazon automaticamente<br>
                      ✅ Pubblicare su Telegram con un click<br>
                      ✅ Tracciare click e conversioni in tempo reale<br>
                      ✅ Automatizzare completamente il tuo canale
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Non hai richiesto questa email? Puoi ignorarla in sicurezza.
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `
Ciao ${displayName}!

Grazie per esserti registrato su ${APP_NAME}!

Per completare la registrazione e attivare il tuo account, visita questo link:
${verificationUrl}

Il link scadrà tra 24 ore.

Se non hai richiesto questa email, puoi ignorarla in sicurezza.

© ${new Date().getFullYear()} ${APP_NAME}
        `,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    name: string | null,
    resetToken: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Email service not configured. Skipping password reset email.');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;
    const displayName = name || 'there';

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: `🔐 Reimposta la tua password - ${APP_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0b0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #14151c 0%, #1a1b26 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(0, 229, 224, 0.2);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <h1 style="color: #0a0b0f; margin: 0; font-size: 28px; font-weight: bold;">
                🔐 Reset Password
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                Ciao ${displayName},
              </h2>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Abbiamo ricevuto una richiesta per reimpostare la password del tuo account ${APP_NAME}.
              </p>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Se hai richiesto tu il reset, clicca il pulsante qui sotto:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0b0f; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                      🔑 Reimposta Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                ⚠️ Questo link scadrà tra <strong>1 ora</strong> per motivi di sicurezza.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Se non hai richiesto il reset della password, ignora questa email. La tua password rimarrà invariata.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                Link diretto:
              </p>
              <p style="color: #f59e0b; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(239, 68, 68, 0.2);">
                <tr>
                  <td>
                    <p style="color: #ef4444; font-size: 13px; margin: 0;">
                      🛡️ <strong>Suggerimento di sicurezza:</strong> Non condividere mai questo link con nessuno. Il team di ${APP_NAME} non ti chiederà mai la password.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Email inviata a ${to}
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `
Ciao ${displayName},

Abbiamo ricevuto una richiesta per reimpostare la password del tuo account ${APP_NAME}.

Per reimpostare la password, visita questo link:
${resetUrl}

Questo link scadrà tra 1 ora per motivi di sicurezza.

Se non hai richiesto il reset della password, ignora questa email.

© ${new Date().getFullYear()} ${APP_NAME}
        `,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send magic link email
   */
  static async sendMagicLinkEmail(
    to: string,
    name: string | null,
    magicToken: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Email service not configured. Skipping magic link email.');
      return { success: false, error: 'Email service not configured' };
    }

    const magicUrl = `${APP_URL}/auth/magic-link?token=${magicToken}`;
    const displayName = name || 'there';

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: `✨ Il tuo link di accesso a ${APP_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0b0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #14151c 0%, #1a1b26 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(0, 229, 224, 0.2);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9f7aea 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                ✨ Magic Link
              </h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">
                Accesso istantaneo senza password
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                Ciao ${displayName}! 👋
              </h2>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hai richiesto un link magico per accedere a <strong style="color: #9f7aea;">${APP_NAME}</strong>.
              </p>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Clicca il pulsante qui sotto per accedere istantaneamente:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #9f7aea 0%, #7c3aed 100%); color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(159, 122, 234, 0.3);">
                      🚀 Accedi a ${APP_NAME}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                ⏱️ Questo link scadrà tra <strong>15 minuti</strong>.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Se non hai richiesto questo link, puoi ignorare questa email in sicurezza.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                Link diretto:
              </p>
              <p style="color: #9f7aea; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
                ${magicUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                🔒 I Magic Link sono monouso e sicuri
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `
Ciao ${displayName}!

Hai richiesto un link magico per accedere a ${APP_NAME}.

Per accedere, visita questo link:
${magicUrl}

Questo link scadrà tra 15 minuti.

Se non hai richiesto questo link, puoi ignorarlo in sicurezza.

© ${new Date().getFullYear()} ${APP_NAME}
        `,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send magic link email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email verification reminder
   */
  static async sendVerificationReminder(
    to: string,
    name: string | null,
    verificationToken: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const verificationUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`;
    const displayName = name || 'there';

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: `⏰ Ricordati di verificare la tua email - ${APP_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0b0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #14151c 0%, #1a1b26 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(0, 229, 224, 0.2);">

          <tr>
            <td style="background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #0a0b0f; margin: 0; font-size: 24px;">
                ⏰ Email non ancora verificata
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Ciao ${displayName}, abbiamo notato che non hai ancora verificato la tua email.
                Per accedere a tutte le funzionalità di ${APP_NAME}, verifica il tuo account:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); color: #0a0b0f; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      ✨ Verifica Email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 20px 40px; text-align: center;">
              <p style="color: #4b5563; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} ${APP_NAME}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `
Ciao ${displayName},

Non hai ancora verificato la tua email per ${APP_NAME}.

Verifica qui: ${verificationUrl}

© ${new Date().getFullYear()} ${APP_NAME}
        `,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send verification reminder:', error);
      return { success: false, error: error.message };
    }
  }
}
