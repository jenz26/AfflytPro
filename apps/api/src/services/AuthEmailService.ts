import { Resend } from 'resend';
import crypto from 'crypto';
import {
  getEmailTranslation,
  replaceVariables,
  normalizeLocale,
  generateGreeting,
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
const LOGO_URL = 'https://afflyt.io/images/logo.webp';

// Debug logging at startup
console.log('[AuthEmailService] Configuration:', {
  resendConfigured: !!resend,
  apiKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET',
  fromEmail: FROM_EMAIL,
  fromName: FROM_NAME,
  appUrl: APP_URL,
});

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
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: name || '', year };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generateWelcomeHTML(t, vars, verificationUrl, name),
        text: generateWelcomeText(t, vars, verificationUrl, name),
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
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: name || '', year, email: to };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generatePasswordResetHTML(t, vars, resetUrl, name),
        text: generatePasswordResetText(t, vars, resetUrl, name),
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
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: name || '', year };

    try {
      console.log('[AuthEmailService] Sending magic link email:', {
        to,
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        subject: replaceVariables(t.subject, vars),
        magicUrl,
      });

      const result = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generateMagicLinkHTML(t, vars, magicUrl, name),
        text: generateMagicLinkText(t, vars, magicUrl, name),
      });

      console.log('[AuthEmailService] Magic link email sent successfully:', result);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthEmailService] Failed to send magic link email:', {
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        name: error.name,
      });
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
    const year = new Date().getFullYear().toString();

    const vars = { appName: APP_NAME, name: name || '', year };

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: replaceVariables(t.subject, vars),
        html: generateVerificationReminderHTML(t, vars, verificationUrl, name),
        text: generateVerificationReminderText(t, vars, verificationUrl, name),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send verification reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==================== SHARED EMAIL TEMPLATE ====================

/**
 * Generate base email HTML with consistent styling
 */
function generateEmailHTML(options: {
  greeting: string;
  content: string;
  buttonText: string;
  buttonUrl: string;
  footer: string;
  copyright: string;
  buttonColor?: 'cyan' | 'amber';
}): string {
  const { greeting, content, buttonText, buttonUrl, footer, copyright, buttonColor = 'cyan' } = options;

  const buttonGradient = buttonColor === 'amber'
    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Afflyt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: #0A0E1A; padding: 24px 32px; text-align: center;">
              <img src="${LOGO_URL}"
                   alt="Afflyt"
                   style="height: 32px; width: auto;"
                   height="32">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="color: #0A0E1A; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;">
                ${greeting}
              </p>

              ${content}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="${buttonUrl}"
                       style="display: inline-block; background: ${buttonGradient}; color: #FFFFFF; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.5; margin: 0;">
                ${footer}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">
                ${copyright} ·
                <a href="https://afflyt.io/privacy" style="color: #06B6D4; text-decoration: none;">Privacy</a> ·
                <a href="https://afflyt.io/help" style="color: #06B6D4; text-decoration: none;">Help</a>
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

// ==================== WELCOME EMAIL ====================

function generateWelcomeHTML(t: any, vars: Record<string, string>, verificationUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  const content = `
    <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
      ${replaceVariables(t.intro, vars)}
    </p>
  `;

  const footer = `
    ${t.expiry}<br><br>
    ${t.footer}
  `;

  return generateEmailHTML({
    greeting,
    content,
    buttonText: t.buttonText,
    buttonUrl: verificationUrl,
    footer,
    copyright: replaceVariables(t.copyright, vars),
  });
}

function generateWelcomeText(t: any, vars: Record<string, string>, verificationUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  return `
${greeting}

${replaceVariables(t.plainIntro, vars)}

${verificationUrl}

${t.plainExpiry}

${t.plainFooter}

${replaceVariables(t.copyright, vars)}
  `.trim();
}

// ==================== MAGIC LINK EMAIL ====================

function generateMagicLinkHTML(t: any, vars: Record<string, string>, magicUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  const content = `
    <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0;">
      ${replaceVariables(t.intro, vars)}
    </p>
  `;

  const footer = `
    ${t.expiry}<br><br>
    ${t.footer}
  `;

  return generateEmailHTML({
    greeting,
    content,
    buttonText: replaceVariables(t.buttonText, vars),
    buttonUrl: magicUrl,
    footer,
    copyright: replaceVariables(t.copyright, vars),
  });
}

function generateMagicLinkText(t: any, vars: Record<string, string>, magicUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  return `
${greeting}

${replaceVariables(t.plainIntro, vars)}

${magicUrl}

${t.plainExpiry}

${t.plainFooter}

${replaceVariables(t.copyright, vars)}
  `.trim();
}

// ==================== PASSWORD RESET EMAIL ====================

function generatePasswordResetHTML(t: any, vars: Record<string, string>, resetUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  const content = `
    <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
      ${replaceVariables(t.intro, vars)}
    </p>
    <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0;">
      ${t.cta}
    </p>
  `;

  const footer = `
    ${t.expiry}<br><br>
    ${t.ignoreNote}<br><br>
    <span style="color: #6B7280; font-size: 13px;">${replaceVariables(t.securityTip, vars)}</span>
  `;

  return generateEmailHTML({
    greeting,
    content,
    buttonText: t.buttonText,
    buttonUrl: resetUrl,
    footer,
    copyright: replaceVariables(t.copyright, vars),
    buttonColor: 'amber',
  });
}

function generatePasswordResetText(t: any, vars: Record<string, string>, resetUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  return `
${greeting}

${replaceVariables(t.plainIntro, vars)}

${t.plainCta}
${resetUrl}

${t.plainExpiry}

${t.plainIgnore}

${replaceVariables(t.copyright, vars)}
  `.trim();
}

// ==================== VERIFICATION REMINDER EMAIL ====================

function generateVerificationReminderHTML(t: any, vars: Record<string, string>, verificationUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  const content = `
    <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0;">
      ${replaceVariables(t.intro, vars)}
    </p>
  `;

  const footer = `
    ${t.expiry}<br><br>
    ${t.footer}
  `;

  return generateEmailHTML({
    greeting,
    content,
    buttonText: t.buttonText,
    buttonUrl: verificationUrl,
    footer,
    copyright: replaceVariables(t.copyright, vars),
  });
}

function generateVerificationReminderText(t: any, vars: Record<string, string>, verificationUrl: string, name: string | null): string {
  const greeting = generateGreeting(t.greeting, name);

  return `
${greeting}

${replaceVariables(t.plainIntro, vars)}

${verificationUrl}

${t.plainExpiry}

${t.plainFooter}

${replaceVariables(t.copyright, vars)}
  `.trim();
}
