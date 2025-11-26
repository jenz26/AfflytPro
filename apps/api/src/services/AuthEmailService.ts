import { Resend } from 'resend';
import crypto from 'crypto';
import {
  getEmailTranslation,
  replaceVariables,
  normalizeLocale,
  SupportedLocale
} from './emailTranslations';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Configuration
const APP_NAME = 'Afflyt';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@afflyt.io';
const FROM_NAME = process.env.FROM_NAME || 'Afflyt';

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
 * Supports multiple languages (IT, EN)
 */
export class AuthEmailService {
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
    verificationToken: string,
    locale?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Email service not configured. Skipping welcome email.');
      return { success: false, error: 'Email service not configured' };
    }

    const lang = normalizeLocale(locale);
    const t = getEmailTranslation('welcome', lang);
    const verificationUrl = `${APP_URL}/${lang}/auth/verify-email?token=${verificationToken}`;
    const displayName = name || (lang === 'en' ? 'there' : 'utente');
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: displayName, year };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generateWelcomeHTML(t, vars, verificationUrl),
        text: generateWelcomeText(t, vars, verificationUrl),
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
    resetToken: string,
    locale?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Email service not configured. Skipping password reset email.');
      return { success: false, error: 'Email service not configured' };
    }

    const lang = normalizeLocale(locale);
    const t = getEmailTranslation('passwordReset', lang);
    const resetUrl = `${APP_URL}/${lang}/auth/reset-password?token=${resetToken}`;
    const displayName = name || (lang === 'en' ? 'there' : 'utente');
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: displayName, year, email: to };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generatePasswordResetHTML(t, vars, resetUrl),
        text: generatePasswordResetText(t, vars, resetUrl),
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
    magicToken: string,
    locale?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Email service not configured. Skipping magic link email.');
      return { success: false, error: 'Email service not configured' };
    }

    const lang = normalizeLocale(locale);
    const t = getEmailTranslation('magicLink', lang);
    const magicUrl = `${APP_URL}/${lang}/auth/magic-link?token=${magicToken}`;
    const displayName = name || (lang === 'en' ? 'there' : 'utente');
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: displayName, year };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generateMagicLinkHTML(t, vars, magicUrl),
        text: generateMagicLinkText(t, vars, magicUrl),
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
    verificationToken: string,
    locale?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const lang = normalizeLocale(locale);
    const t = getEmailTranslation('verificationReminder', lang);
    const verificationUrl = `${APP_URL}/${lang}/auth/verify-email?token=${verificationToken}`;
    const displayName = name || (lang === 'en' ? 'there' : 'utente');
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: displayName, year };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generateVerificationReminderHTML(t, vars, verificationUrl),
        text: generateVerificationReminderText(t, vars, verificationUrl),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send verification reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==================== HTML GENERATORS ====================

function generateWelcomeHTML(t: any, vars: Record<string, string>, verificationUrl: string): string {
  const featuresHTML = t.features.map((f: string) => `✅ ${f}`).join('<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replaceVariables(t.title, vars)}</title>
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
                🚀 ${vars.appName}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                ${replaceVariables(t.greeting, vars)}
              </h2>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${replaceVariables(t.intro, vars)}
              </p>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                ${t.cta}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); color: #0a0b0f; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(0, 229, 224, 0.3);">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                ${t.expiry}
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                ${t.fallbackLink}
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
                      ${replaceVariables(t.featuresTitle, vars)}
                    </p>
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                      ${featuresHTML}
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
                ${t.footer}
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0 0;">
                ${replaceVariables(t.copyright, vars)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateWelcomeText(t: any, vars: Record<string, string>, verificationUrl: string): string {
  const featuresText = t.features.map((f: string) => `✅ ${f}`).join('\n');

  return `
${replaceVariables(t.greeting, vars)}

${replaceVariables(t.plainIntro, vars)}

${t.plainCta}
${verificationUrl}

${t.plainExpiry}

${replaceVariables(t.featuresTitle, vars)}
${featuresText}

${t.plainFooter}

${replaceVariables(t.copyright, vars)}
  `.trim();
}

function generateMagicLinkHTML(t: any, vars: Record<string, string>, magicUrl: string): string {
  return `
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
                ${t.headerTitle}
              </h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">
                ${t.headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                ${replaceVariables(t.greeting, vars)}
              </h2>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${replaceVariables(t.intro, vars)}
              </p>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                ${t.cta}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #9f7aea 0%, #7c3aed 100%); color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(159, 122, 234, 0.3);">
                      ${replaceVariables(t.buttonText, vars)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                ${t.expiry}
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                ${t.footer}
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                ${t.fallbackLink}
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
                ${t.securityNote}
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0 0;">
                ${replaceVariables(t.copyright, vars)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateMagicLinkText(t: any, vars: Record<string, string>, magicUrl: string): string {
  return `
${replaceVariables(t.greeting, vars)}

${replaceVariables(t.plainIntro, vars)}

${t.plainCta}
${magicUrl}

${t.plainExpiry}

${t.plainFooter}

${replaceVariables(t.copyright, vars)}
  `.trim();
}

function generatePasswordResetHTML(t: any, vars: Record<string, string>, resetUrl: string): string {
  return `
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
                ${t.headerTitle}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px;">
                ${replaceVariables(t.greeting, vars)}
              </h2>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${replaceVariables(t.intro, vars)}
              </p>

              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                ${t.cta}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0b0f; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                ${t.expiry}
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                ${t.ignoreNote}
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                ${t.fallbackLink}
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
                      ${replaceVariables(t.securityTip, vars)}
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
                ${replaceVariables(t.emailSentTo, vars)}
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0 0;">
                ${replaceVariables(t.copyright, vars)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePasswordResetText(t: any, vars: Record<string, string>, resetUrl: string): string {
  return `
${replaceVariables(t.greeting, vars)}

${replaceVariables(t.plainIntro, vars)}

${t.plainCta}
${resetUrl}

${t.plainExpiry}

${t.plainIgnore}

${replaceVariables(t.copyright, vars)}
  `.trim();
}

function generateVerificationReminderHTML(t: any, vars: Record<string, string>, verificationUrl: string): string {
  return `
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
                ${t.headerTitle}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${replaceVariables(t.intro, vars)}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); color: #0a0b0f; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 20px 40px; text-align: center;">
              <p style="color: #4b5563; font-size: 11px; margin: 0;">
                ${replaceVariables(t.copyright, vars)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateVerificationReminderText(t: any, vars: Record<string, string>, verificationUrl: string): string {
  return `
${replaceVariables(t.plainIntro, vars)}

${t.plainCta}
${verificationUrl}

${replaceVariables(t.copyright, vars)}
  `.trim();
}
