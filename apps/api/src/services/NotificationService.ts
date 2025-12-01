import { PrismaClient, NotificationType, NotificationChannel, NotificationStatus, User } from '@prisma/client';
import { Resend } from 'resend';
import { normalizeLocale } from './emailTranslations';

const prisma = new PrismaClient();

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Configuration
const APP_NAME = 'Afflyt';
const APP_URL = process.env.APP_URL || 'https://afflyt.io';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@afflyt.io';
const FROM_NAME = process.env.FROM_NAME || 'Afflyt';

// Notification templates configuration
interface NotificationTemplate {
  subject: (data: any, locale: string) => string;
  html: (data: any, locale: string) => string;
  text: (data: any, locale: string) => string;
}

// Email templates for each notification type
const EMAIL_TEMPLATES: Partial<Record<NotificationType, NotificationTemplate>> = {
  // === SECURITY ===
  PASSWORD_CHANGED: {
    subject: (_, locale) => locale === 'it' ? '🔐 Password modificata' : '🔐 Password Changed',
    html: (data, locale) => generateSecurityEmailHTML({
      title: locale === 'it' ? 'Password Modificata' : 'Password Changed',
      message: locale === 'it'
        ? 'La tua password è stata modificata con successo. Se non sei stato tu, contattaci immediatamente.'
        : 'Your password has been changed successfully. If this wasn\'t you, please contact us immediately.',
      color: '#f59e0b',
      locale,
    }),
    text: (data, locale) => locale === 'it'
      ? 'La tua password è stata modificata. Se non sei stato tu, contattaci.'
      : 'Your password has been changed. If this wasn\'t you, contact us.',
  },

  NEW_LOGIN: {
    subject: (data, locale) => locale === 'it' ? '🔔 Nuovo accesso rilevato' : '🔔 New Login Detected',
    html: (data, locale) => generateSecurityEmailHTML({
      title: locale === 'it' ? 'Nuovo Accesso' : 'New Login',
      message: locale === 'it'
        ? `È stato rilevato un nuovo accesso al tuo account da ${data.device || 'dispositivo sconosciuto'} (${data.location || 'posizione sconosciuta'}).`
        : `A new login was detected on your account from ${data.device || 'unknown device'} (${data.location || 'unknown location'}).`,
      color: '#3b82f6',
      locale,
      details: [
        { label: locale === 'it' ? 'Dispositivo' : 'Device', value: data.device || '-' },
        { label: 'IP', value: data.ip || '-' },
        { label: locale === 'it' ? 'Data/Ora' : 'Date/Time', value: new Date().toLocaleString(locale) },
      ],
    }),
    text: (data, locale) => locale === 'it'
      ? `Nuovo accesso rilevato da ${data.device || 'dispositivo sconosciuto'}.`
      : `New login detected from ${data.device || 'unknown device'}.`,
  },

  API_KEY_CREATED: {
    subject: (_, locale) => locale === 'it' ? '🔑 Nuova API Key creata' : '🔑 New API Key Created',
    html: (data, locale) => generateSecurityEmailHTML({
      title: locale === 'it' ? 'API Key Creata' : 'API Key Created',
      message: locale === 'it'
        ? `Una nuova API Key "${data.keyName || 'senza nome'}" è stata creata nel tuo account.`
        : `A new API Key "${data.keyName || 'unnamed'}" has been created in your account.`,
      color: '#10b981',
      locale,
    }),
    text: (data, locale) => locale === 'it'
      ? `Nuova API Key creata: ${data.keyName || 'senza nome'}`
      : `New API Key created: ${data.keyName || 'unnamed'}`,
  },

  API_KEY_DELETED: {
    subject: (_, locale) => locale === 'it' ? '🗑️ API Key eliminata' : '🗑️ API Key Deleted',
    html: (data, locale) => generateSecurityEmailHTML({
      title: locale === 'it' ? 'API Key Eliminata' : 'API Key Deleted',
      message: locale === 'it'
        ? `L'API Key "${data.keyName || 'senza nome'}" è stata eliminata dal tuo account.`
        : `The API Key "${data.keyName || 'unnamed'}" has been deleted from your account.`,
      color: '#ef4444',
      locale,
    }),
    text: (data, locale) => locale === 'it'
      ? `API Key eliminata: ${data.keyName || 'senza nome'}`
      : `API Key deleted: ${data.keyName || 'unnamed'}`,
  },

  // === BILLING ===
  SUBSCRIPTION_ACTIVATED: {
    subject: (data, locale) => locale === 'it'
      ? `🎉 Benvenuto nel piano ${data.plan}!`
      : `🎉 Welcome to ${data.plan}!`,
    html: (data, locale) => generateBillingEmailHTML({
      title: locale === 'it' ? 'Abbonamento Attivato!' : 'Subscription Activated!',
      message: locale === 'it'
        ? `Congratulazioni! Il tuo abbonamento ${data.plan} è ora attivo.`
        : `Congratulations! Your ${data.plan} subscription is now active.`,
      color: '#10b981',
      locale,
      ctaText: locale === 'it' ? 'Vai alla Dashboard' : 'Go to Dashboard',
      ctaUrl: `${APP_URL}/dashboard`,
    }),
    text: (data, locale) => locale === 'it'
      ? `Il tuo abbonamento ${data.plan} è attivo!`
      : `Your ${data.plan} subscription is active!`,
  },

  PAYMENT_SUCCESS: {
    subject: (data, locale) => locale === 'it'
      ? `✅ Pagamento ricevuto - €${data.amount}`
      : `✅ Payment Received - €${data.amount}`,
    html: (data, locale) => generateBillingEmailHTML({
      title: locale === 'it' ? 'Pagamento Ricevuto' : 'Payment Received',
      message: locale === 'it'
        ? `Abbiamo ricevuto il tuo pagamento di €${data.amount}.`
        : `We've received your payment of €${data.amount}.`,
      color: '#10b981',
      locale,
      details: [
        { label: locale === 'it' ? 'Importo' : 'Amount', value: `€${data.amount}` },
        { label: locale === 'it' ? 'Piano' : 'Plan', value: data.plan },
        { label: locale === 'it' ? 'Prossimo rinnovo' : 'Next renewal', value: data.nextBillingDate || '-' },
      ],
      ctaText: locale === 'it' ? 'Vedi Fattura' : 'View Invoice',
      ctaUrl: data.invoiceUrl || `${APP_URL}/settings/billing`,
    }),
    text: (data, locale) => locale === 'it'
      ? `Pagamento di €${data.amount} ricevuto per il piano ${data.plan}.`
      : `Payment of €${data.amount} received for ${data.plan} plan.`,
  },

  PAYMENT_FAILED: {
    subject: (_, locale) => locale === 'it'
      ? '⚠️ Pagamento non riuscito - Azione richiesta'
      : '⚠️ Payment Failed - Action Required',
    html: (data, locale) => generateBillingEmailHTML({
      title: locale === 'it' ? 'Pagamento Non Riuscito' : 'Payment Failed',
      message: locale === 'it'
        ? 'Il tuo ultimo pagamento non è andato a buon fine. Aggiorna il metodo di pagamento per evitare interruzioni del servizio.'
        : 'Your last payment was unsuccessful. Please update your payment method to avoid service interruption.',
      color: '#ef4444',
      locale,
      ctaText: locale === 'it' ? 'Aggiorna Metodo di Pagamento' : 'Update Payment Method',
      ctaUrl: `${APP_URL}/settings/billing`,
      urgent: true,
    }),
    text: (data, locale) => locale === 'it'
      ? 'Pagamento non riuscito. Aggiorna il metodo di pagamento.'
      : 'Payment failed. Please update your payment method.',
  },

  TRIAL_ENDING: {
    subject: (data, locale) => locale === 'it'
      ? `⏰ Il tuo trial termina tra ${data.daysLeft} giorni`
      : `⏰ Your trial ends in ${data.daysLeft} days`,
    html: (data, locale) => generateBillingEmailHTML({
      title: locale === 'it' ? 'Trial in Scadenza' : 'Trial Ending Soon',
      message: locale === 'it'
        ? `Il tuo periodo di prova terminerà tra ${data.daysLeft} giorni. Passa a un piano a pagamento per continuare a usare tutte le funzionalità.`
        : `Your trial period will end in ${data.daysLeft} days. Upgrade to a paid plan to continue using all features.`,
      color: '#f59e0b',
      locale,
      ctaText: locale === 'it' ? 'Scegli un Piano' : 'Choose a Plan',
      ctaUrl: `${APP_URL}/settings/billing`,
    }),
    text: (data, locale) => locale === 'it'
      ? `Il tuo trial termina tra ${data.daysLeft} giorni.`
      : `Your trial ends in ${data.daysLeft} days.`,
  },

  // === LIMITS & USAGE ===
  LIMIT_WARNING: {
    subject: (data, locale) => locale === 'it'
      ? `⚠️ Hai raggiunto l'${data.percentage}% del limite ${data.limitType}`
      : `⚠️ You've reached ${data.percentage}% of your ${data.limitType} limit`,
    html: (data, locale) => generateUsageEmailHTML({
      title: locale === 'it' ? 'Limite in Avvicinamento' : 'Approaching Limit',
      message: locale === 'it'
        ? `Hai utilizzato il ${data.percentage}% del tuo limite di ${data.limitType}. Considera l'upgrade per evitare interruzioni.`
        : `You've used ${data.percentage}% of your ${data.limitType} limit. Consider upgrading to avoid interruptions.`,
      color: '#f59e0b',
      locale,
      usage: { current: data.current, limit: data.limit, type: data.limitType },
      ctaText: locale === 'it' ? 'Vedi Piani' : 'View Plans',
      ctaUrl: `${APP_URL}/settings/billing`,
    }),
    text: (data, locale) => locale === 'it'
      ? `Hai raggiunto l'${data.percentage}% del limite ${data.limitType}.`
      : `You've reached ${data.percentage}% of your ${data.limitType} limit.`,
  },

  LIMIT_REACHED: {
    subject: (data, locale) => locale === 'it'
      ? `🚫 Limite ${data.limitType} raggiunto`
      : `🚫 ${data.limitType} Limit Reached`,
    html: (data, locale) => generateUsageEmailHTML({
      title: locale === 'it' ? 'Limite Raggiunto' : 'Limit Reached',
      message: locale === 'it'
        ? `Hai raggiunto il limite massimo di ${data.limitType}. Effettua l'upgrade per continuare.`
        : `You've reached your ${data.limitType} limit. Please upgrade to continue.`,
      color: '#ef4444',
      locale,
      usage: { current: data.current, limit: data.limit, type: data.limitType },
      ctaText: locale === 'it' ? 'Effettua Upgrade' : 'Upgrade Now',
      ctaUrl: `${APP_URL}/settings/billing`,
      urgent: true,
    }),
    text: (data, locale) => locale === 'it'
      ? `Limite ${data.limitType} raggiunto. Effettua l'upgrade.`
      : `${data.limitType} limit reached. Please upgrade.`,
  },

  // === AUTOMATION ===
  AUTOMATION_SUCCESS: {
    subject: (data, locale) => locale === 'it'
      ? `✅ Automazione "${data.ruleName}" completata`
      : `✅ Automation "${data.ruleName}" completed`,
    html: (data, locale) => generateAutomationEmailHTML({
      title: locale === 'it' ? 'Automazione Completata' : 'Automation Completed',
      message: locale === 'it'
        ? `La tua regola "${data.ruleName}" è stata eseguita con successo.`
        : `Your rule "${data.ruleName}" has been executed successfully.`,
      color: '#10b981',
      locale,
      stats: data.stats,
    }),
    text: (data, locale) => locale === 'it'
      ? `Automazione "${data.ruleName}" completata. ${data.stats?.dealsFound || 0} deal trovati.`
      : `Automation "${data.ruleName}" completed. ${data.stats?.dealsFound || 0} deals found.`,
  },

  AUTOMATION_ERROR: {
    subject: (data, locale) => locale === 'it'
      ? `❌ Errore automazione "${data.ruleName}"`
      : `❌ Automation error "${data.ruleName}"`,
    html: (data, locale) => generateAutomationEmailHTML({
      title: locale === 'it' ? 'Errore Automazione' : 'Automation Error',
      message: locale === 'it'
        ? `Si è verificato un errore durante l'esecuzione della regola "${data.ruleName}": ${data.error}`
        : `An error occurred while executing rule "${data.ruleName}": ${data.error}`,
      color: '#ef4444',
      locale,
      error: data.error,
      ctaText: locale === 'it' ? 'Verifica Automazione' : 'Check Automation',
      ctaUrl: `${APP_URL}/dashboard/automations`,
    }),
    text: (data, locale) => locale === 'it'
      ? `Errore automazione "${data.ruleName}": ${data.error}`
      : `Automation error "${data.ruleName}": ${data.error}`,
  },

  CHANNEL_DISCONNECTED: {
    subject: (data, locale) => locale === 'it'
      ? `⚠️ Canale "${data.channelName}" disconnesso`
      : `⚠️ Channel "${data.channelName}" disconnected`,
    html: (data, locale) => generateAutomationEmailHTML({
      title: locale === 'it' ? 'Canale Disconnesso' : 'Channel Disconnected',
      message: locale === 'it'
        ? `Il canale "${data.channelName}" è stato disconnesso. Le tue automazioni non potranno pubblicare fino a quando non lo riconnetterai.`
        : `The channel "${data.channelName}" has been disconnected. Your automations won't be able to publish until you reconnect it.`,
      color: '#f59e0b',
      locale,
      ctaText: locale === 'it' ? 'Riconnetti Canale' : 'Reconnect Channel',
      ctaUrl: `${APP_URL}/dashboard/channels`,
    }),
    text: (data, locale) => locale === 'it'
      ? `Canale "${data.channelName}" disconnesso. Riconnettilo per riprendere le pubblicazioni.`
      : `Channel "${data.channelName}" disconnected. Reconnect it to resume publishing.`,
  },
};

/**
 * NotificationService - Centralized notification management
 */
export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async send(
    userId: string,
    type: NotificationType,
    data: Record<string, any> = {},
    channels: NotificationChannel[] = [NotificationChannel.EMAIL]
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Determine locale (could be stored in user preferences)
      const locale = normalizeLocale(data.locale);

      // Get template
      const template = EMAIL_TEMPLATES[type];
      if (!template) {
        console.warn(`No email template for notification type: ${type}`);
        return { success: false, error: `No template for type: ${type}` };
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.PENDING,
          title: template.subject(data, locale),
          body: template.text(data, locale),
          data: data as any,
        },
      });

      // Send email
      if (channels.includes(NotificationChannel.EMAIL)) {
        const emailResult = await this.sendEmail(
          user.email,
          template.subject(data, locale),
          template.html(data, locale),
          template.text(data, locale)
        );

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: emailResult.success
            ? { status: NotificationStatus.SENT, sentAt: new Date() }
            : {
                status: NotificationStatus.FAILED,
                failedAt: new Date(),
                error: emailResult.error,
                attempts: { increment: 1 },
              },
        });

        if (!emailResult.success) {
          return { success: false, notificationId: notification.id, error: emailResult.error };
        }
      }

      // TODO: Handle IN_APP and PUSH channels

      return { success: true, notificationId: notification.id };
    } catch (error: any) {
      console.error('NotificationService.send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email via Resend
   */
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      console.warn('Resend not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html,
        text,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ) {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    return prisma.notification.findMany({
      where: {
        userId,
        status: { not: 'DISMISSED' }, // Exclude dismissed
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        category: true,
        priority: true,
        status: true,
        title: true,
        body: true,
        icon: true,
        actionUrl: true,
        actionLabel: true,
        autoDismissMs: true,
        createdAt: true,
        readAt: true,
        dismissedAt: true,
      }
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, readAt: null, status: { notIn: ['DISMISSED'] } },
    });
  }

  /**
   * Dismiss (soft delete) a notification
   */
  static async dismissNotification(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: {
        status: NotificationStatus.DISMISSED,
        dismissedAt: new Date()
      },
    });
  }

  /**
   * Create an in-app notification (without sending email)
   */
  static async createInApp(
    userId: string,
    type: NotificationType,
    data: {
      title: string;
      body: string;
      icon?: string;
      actionUrl?: string;
      actionLabel?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      category?: 'SYSTEM' | 'AUTOMATION' | 'ANALYTICS' | 'PRODUCT';
      autoDismissMs?: number;
    }
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: data.title,
        body: data.body,
        icon: data.icon,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        priority: data.priority || 'MEDIUM',
        category: data.category || 'SYSTEM',
        autoDismissMs: data.autoDismissMs,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Retry failed notifications
   */
  static async retryFailed(): Promise<number> {
    const failedNotifications = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.FAILED,
        attempts: { lt: prisma.notification.fields.maxRetries },
      },
      include: { user: { select: { email: true } } },
    });

    let retried = 0;
    for (const notification of failedNotifications) {
      const template = EMAIL_TEMPLATES[notification.type];
      if (!template) continue;

      const locale = normalizeLocale((notification.data as any)?.locale);
      const result = await this.sendEmail(
        notification.user.email,
        notification.title,
        template.html(notification.data, locale),
        notification.body
      );

      await prisma.notification.update({
        where: { id: notification.id },
        data: result.success
          ? { status: NotificationStatus.SENT, sentAt: new Date() }
          : { attempts: { increment: 1 }, error: result.error },
      });

      if (result.success) retried++;
    }

    return retried;
  }
}

// ==================== HTML GENERATORS ====================

function generateBaseEmailHTML(content: string, locale: string): string {
  const year = new Date().getFullYear();
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
          ${content}
          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 40px; text-align: center;">
              <p style="color: #4b5563; font-size: 11px; margin: 0;">
                © ${year} ${APP_NAME}. ${locale === 'it' ? 'Tutti i diritti riservati.' : 'All rights reserved.'}
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

function generateSecurityEmailHTML(opts: {
  title: string;
  message: string;
  color: string;
  locale: string;
  details?: Array<{ label: string; value: string }>;
}): string {
  const detailsHTML = opts.details
    ? `<table width="100%" style="margin-top: 20px;">
        ${opts.details.map(d => `
          <tr>
            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">${d.label}:</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${d.value}</td>
          </tr>
        `).join('')}
       </table>`
    : '';

  return generateBaseEmailHTML(`
    <tr>
      <td style="background: linear-gradient(135deg, ${opts.color} 0%, ${opts.color}dd 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔐 ${opts.title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0;">
          ${opts.message}
        </p>
        ${detailsHTML}
        <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">
          ${opts.locale === 'it'
            ? 'Se non hai effettuato questa azione, contattaci immediatamente.'
            : 'If you didn\'t perform this action, please contact us immediately.'}
        </p>
      </td>
    </tr>
  `, opts.locale);
}

function generateBillingEmailHTML(opts: {
  title: string;
  message: string;
  color: string;
  locale: string;
  details?: Array<{ label: string; value: string }>;
  ctaText?: string;
  ctaUrl?: string;
  urgent?: boolean;
}): string {
  const detailsHTML = opts.details
    ? `<table width="100%" style="margin: 20px 0; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
        ${opts.details.map(d => `
          <tr>
            <td style="color: #6b7280; font-size: 14px; padding: 8px 16px;">${d.label}:</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 16px; text-align: right; font-weight: bold;">${d.value}</td>
          </tr>
        `).join('')}
       </table>`
    : '';

  const ctaHTML = opts.ctaText && opts.ctaUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
        <tr>
          <td align="center">
            <a href="${opts.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, ${opts.color} 0%, ${opts.color}dd 100%); color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              ${opts.ctaText}
            </a>
          </td>
        </tr>
       </table>`
    : '';

  return generateBaseEmailHTML(`
    <tr>
      <td style="background: linear-gradient(135deg, ${opts.color} 0%, ${opts.color}dd 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${opts.title}</h1>
      </td>
    </tr>
    ${opts.urgent ? `
    <tr>
      <td style="background: rgba(239, 68, 68, 0.1); padding: 12px 40px; text-align: center;">
        <p style="color: #ef4444; font-size: 13px; margin: 0; font-weight: bold;">
          ⚠️ ${opts.locale === 'it' ? 'AZIONE RICHIESTA' : 'ACTION REQUIRED'}
        </p>
      </td>
    </tr>
    ` : ''}
    <tr>
      <td style="padding: 40px;">
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0;">
          ${opts.message}
        </p>
        ${detailsHTML}
        ${ctaHTML}
      </td>
    </tr>
  `, opts.locale);
}

function generateUsageEmailHTML(opts: {
  title: string;
  message: string;
  color: string;
  locale: string;
  usage: { current: number; limit: number; type: string };
  ctaText?: string;
  ctaUrl?: string;
  urgent?: boolean;
}): string {
  const percentage = Math.round((opts.usage.current / opts.usage.limit) * 100);

  return generateBaseEmailHTML(`
    <tr>
      <td style="background: linear-gradient(135deg, ${opts.color} 0%, ${opts.color}dd 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${opts.title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          ${opts.message}
        </p>

        <!-- Usage Bar -->
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #ffffff; font-size: 14px;">${opts.usage.type}</span>
            <span style="color: #ffffff; font-size: 14px; font-weight: bold;">${opts.usage.current} / ${opts.usage.limit}</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="background: ${opts.color}; width: ${percentage}%; height: 100%; border-radius: 4px;"></div>
          </div>
        </div>

        ${opts.ctaText && opts.ctaUrl ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
          <tr>
            <td align="center">
              <a href="${opts.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); color: #0a0b0f; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                ${opts.ctaText}
              </a>
            </td>
          </tr>
        </table>
        ` : ''}
      </td>
    </tr>
  `, opts.locale);
}

function generateAutomationEmailHTML(opts: {
  title: string;
  message: string;
  color: string;
  locale: string;
  stats?: { dealsFound?: number; dealsPublished?: number };
  error?: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const statsHTML = opts.stats
    ? `<table width="100%" style="margin: 20px 0; background: rgba(255,255,255,0.05); border-radius: 8px;">
        <tr>
          <td style="padding: 20px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1);">
            <div style="color: #00E5E0; font-size: 28px; font-weight: bold;">${opts.stats.dealsFound || 0}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">${opts.locale === 'it' ? 'Deal Trovati' : 'Deals Found'}</div>
          </td>
          <td style="padding: 20px; text-align: center;">
            <div style="color: #10b981; font-size: 28px; font-weight: bold;">${opts.stats.dealsPublished || 0}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">${opts.locale === 'it' ? 'Pubblicati' : 'Published'}</div>
          </td>
        </tr>
       </table>`
    : '';

  const errorHTML = opts.error
    ? `<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #ef4444; font-size: 14px; margin: 0; font-family: monospace;">${opts.error}</p>
       </div>`
    : '';

  return generateBaseEmailHTML(`
    <tr>
      <td style="background: linear-gradient(135deg, ${opts.color} 0%, ${opts.color}dd 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚡ ${opts.title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0;">
          ${opts.message}
        </p>
        ${statsHTML}
        ${errorHTML}
        ${opts.ctaText && opts.ctaUrl ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
          <tr>
            <td align="center">
              <a href="${opts.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #00E5E0 0%, #0891b2 100%); color: #0a0b0f; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                ${opts.ctaText}
              </a>
            </td>
          </tr>
        </table>
        ` : ''}
      </td>
    </tr>
  `, opts.locale);
}

export default NotificationService;
