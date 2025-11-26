/**
 * Email Translations
 * Supports: Italian (it), English (en)
 */

export type SupportedLocale = 'it' | 'en';

export const emailTranslations = {
  // ==================== WELCOME EMAIL ====================
  welcome: {
    it: {
      subject: '🎉 Benvenuto su {{appName}}! Verifica la tua email',
      title: 'Benvenuto su {{appName}}',
      greeting: 'Ciao {{name}}! 👋',
      intro: 'Grazie per esserti registrato su <strong style="color: #00E5E0;">{{appName}}</strong>! Sei a un passo dall\'accedere alla piattaforma di affiliate marketing più avanzata.',
      cta: 'Per completare la registrazione e attivare il tuo account, clicca il pulsante qui sotto:',
      buttonText: '✨ Verifica Email',
      expiry: 'Il link scadrà tra <strong>24 ore</strong>.',
      fallbackLink: 'Se non riesci a cliccare il pulsante, copia e incolla questo link nel browser:',
      featuresTitle: 'Cosa potrai fare con {{appName}}:',
      features: [
        'Trovare i migliori deal Amazon automaticamente',
        'Pubblicare su Telegram con un click',
        'Tracciare click e conversioni in tempo reale',
        'Automatizzare completamente il tuo canale'
      ],
      footer: 'Non hai richiesto questa email? Puoi ignorarla in sicurezza.',
      copyright: '© {{year}} {{appName}}. Tutti i diritti riservati.',
      // Plain text version
      plainIntro: 'Grazie per esserti registrato su {{appName}}!',
      plainCta: 'Per completare la registrazione e attivare il tuo account, visita questo link:',
      plainExpiry: 'Il link scadrà tra 24 ore.',
      plainFooter: 'Se non hai richiesto questa email, puoi ignorarla in sicurezza.'
    },
    en: {
      subject: '🎉 Welcome to {{appName}}! Verify your email',
      title: 'Welcome to {{appName}}',
      greeting: 'Hi {{name}}! 👋',
      intro: 'Thank you for signing up to <strong style="color: #00E5E0;">{{appName}}</strong>! You\'re one step away from accessing the most advanced affiliate marketing platform.',
      cta: 'To complete your registration and activate your account, click the button below:',
      buttonText: '✨ Verify Email',
      expiry: 'This link will expire in <strong>24 hours</strong>.',
      fallbackLink: 'If you can\'t click the button, copy and paste this link in your browser:',
      featuresTitle: 'What you can do with {{appName}}:',
      features: [
        'Find the best Amazon deals automatically',
        'Publish to Telegram with one click',
        'Track clicks and conversions in real-time',
        'Fully automate your channel'
      ],
      footer: 'Didn\'t request this email? You can safely ignore it.',
      copyright: '© {{year}} {{appName}}. All rights reserved.',
      // Plain text version
      plainIntro: 'Thank you for signing up to {{appName}}!',
      plainCta: 'To complete your registration and activate your account, visit this link:',
      plainExpiry: 'This link will expire in 24 hours.',
      plainFooter: 'If you didn\'t request this email, you can safely ignore it.'
    }
  },

  // ==================== MAGIC LINK EMAIL ====================
  magicLink: {
    it: {
      subject: '✨ Il tuo link di accesso a {{appName}}',
      headerTitle: '✨ Magic Link',
      headerSubtitle: 'Accesso istantaneo senza password',
      greeting: 'Ciao {{name}}! 👋',
      intro: 'Hai richiesto un link magico per accedere a <strong style="color: #9f7aea;">{{appName}}</strong>.',
      cta: 'Clicca il pulsante qui sotto per accedere istantaneamente:',
      buttonText: '🚀 Accedi a {{appName}}',
      expiry: '⏱️ Questo link scadrà tra <strong>15 minuti</strong>.',
      footer: 'Se non hai richiesto questo link, puoi ignorare questa email in sicurezza.',
      fallbackLink: 'Link diretto:',
      securityNote: '🔒 I Magic Link sono monouso e sicuri',
      copyright: '© {{year}} {{appName}}. Tutti i diritti riservati.',
      // Plain text
      plainIntro: 'Hai richiesto un link magico per accedere a {{appName}}.',
      plainCta: 'Per accedere, visita questo link:',
      plainExpiry: 'Questo link scadrà tra 15 minuti.',
      plainFooter: 'Se non hai richiesto questo link, puoi ignorarlo in sicurezza.'
    },
    en: {
      subject: '✨ Your {{appName}} login link',
      headerTitle: '✨ Magic Link',
      headerSubtitle: 'Instant passwordless access',
      greeting: 'Hi {{name}}! 👋',
      intro: 'You requested a magic link to access <strong style="color: #9f7aea;">{{appName}}</strong>.',
      cta: 'Click the button below to sign in instantly:',
      buttonText: '🚀 Sign in to {{appName}}',
      expiry: '⏱️ This link will expire in <strong>15 minutes</strong>.',
      footer: 'If you didn\'t request this link, you can safely ignore this email.',
      fallbackLink: 'Direct link:',
      securityNote: '🔒 Magic Links are single-use and secure',
      copyright: '© {{year}} {{appName}}. All rights reserved.',
      // Plain text
      plainIntro: 'You requested a magic link to access {{appName}}.',
      plainCta: 'To sign in, visit this link:',
      plainExpiry: 'This link will expire in 15 minutes.',
      plainFooter: 'If you didn\'t request this link, you can safely ignore it.'
    }
  },

  // ==================== PASSWORD RESET EMAIL ====================
  passwordReset: {
    it: {
      subject: '🔐 Reimposta la tua password - {{appName}}',
      headerTitle: '🔐 Reset Password',
      greeting: 'Ciao {{name}},',
      intro: 'Abbiamo ricevuto una richiesta per reimpostare la password del tuo account {{appName}}.',
      cta: 'Se hai richiesto tu il reset, clicca il pulsante qui sotto:',
      buttonText: '🔑 Reimposta Password',
      expiry: '⚠️ Questo link scadrà tra <strong>1 ora</strong> per motivi di sicurezza.',
      ignoreNote: 'Se non hai richiesto il reset della password, ignora questa email. La tua password rimarrà invariata.',
      fallbackLink: 'Link diretto:',
      securityTip: '🛡️ <strong>Suggerimento di sicurezza:</strong> Non condividere mai questo link con nessuno. Il team di {{appName}} non ti chiederà mai la password.',
      emailSentTo: 'Email inviata a {{email}}',
      copyright: '© {{year}} {{appName}}. Tutti i diritti riservati.',
      // Plain text
      plainIntro: 'Abbiamo ricevuto una richiesta per reimpostare la password del tuo account {{appName}}.',
      plainCta: 'Per reimpostare la password, visita questo link:',
      plainExpiry: 'Questo link scadrà tra 1 ora per motivi di sicurezza.',
      plainIgnore: 'Se non hai richiesto il reset della password, ignora questa email.'
    },
    en: {
      subject: '🔐 Reset your password - {{appName}}',
      headerTitle: '🔐 Reset Password',
      greeting: 'Hi {{name}},',
      intro: 'We received a request to reset the password for your {{appName}} account.',
      cta: 'If you requested this reset, click the button below:',
      buttonText: '🔑 Reset Password',
      expiry: '⚠️ This link will expire in <strong>1 hour</strong> for security reasons.',
      ignoreNote: 'If you didn\'t request a password reset, ignore this email. Your password will remain unchanged.',
      fallbackLink: 'Direct link:',
      securityTip: '🛡️ <strong>Security tip:</strong> Never share this link with anyone. The {{appName}} team will never ask for your password.',
      emailSentTo: 'Email sent to {{email}}',
      copyright: '© {{year}} {{appName}}. All rights reserved.',
      // Plain text
      plainIntro: 'We received a request to reset the password for your {{appName}} account.',
      plainCta: 'To reset your password, visit this link:',
      plainExpiry: 'This link will expire in 1 hour for security reasons.',
      plainIgnore: 'If you didn\'t request a password reset, ignore this email.'
    }
  },

  // ==================== VERIFICATION REMINDER EMAIL ====================
  verificationReminder: {
    it: {
      subject: '⏰ Ricordati di verificare la tua email - {{appName}}',
      headerTitle: '⏰ Email non ancora verificata',
      intro: 'Ciao {{name}}, abbiamo notato che non hai ancora verificato la tua email. Per accedere a tutte le funzionalità di {{appName}}, verifica il tuo account:',
      buttonText: '✨ Verifica Email',
      copyright: '© {{year}} {{appName}}',
      // Plain text
      plainIntro: 'Non hai ancora verificato la tua email per {{appName}}.',
      plainCta: 'Verifica qui:'
    },
    en: {
      subject: '⏰ Remember to verify your email - {{appName}}',
      headerTitle: '⏰ Email not verified yet',
      intro: 'Hi {{name}}, we noticed you haven\'t verified your email yet. To access all {{appName}} features, please verify your account:',
      buttonText: '✨ Verify Email',
      copyright: '© {{year}} {{appName}}',
      // Plain text
      plainIntro: 'You haven\'t verified your email for {{appName}} yet.',
      plainCta: 'Verify here:'
    }
  }
};

/**
 * Get translations for a specific email type and locale
 */
export function getEmailTranslation<T extends keyof typeof emailTranslations>(
  emailType: T,
  locale: SupportedLocale = 'it'
): typeof emailTranslations[T][SupportedLocale] {
  const translations = emailTranslations[emailType];
  return translations[locale] || translations['it']; // Fallback to Italian
}

/**
 * Replace template variables in a string
 */
export function replaceVariables(template: string, variables: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

/**
 * Detect locale from string (validates and normalizes)
 */
export function normalizeLocale(locale?: string | null): SupportedLocale {
  if (!locale) return 'it';
  const normalized = locale.toLowerCase().substring(0, 2);
  if (normalized === 'en') return 'en';
  return 'it'; // Default to Italian
}
