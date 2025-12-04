/**
 * Email Translations - Afflyt Pro
 * Professional, concise, brand-aligned copy
 * Supports: Italian (it), English (en)
 */

export type SupportedLocale = 'it' | 'en';

export const emailTranslations = {
  // ==================== WELCOME EMAIL ====================
  welcome: {
    it: {
      subject: 'Benvenuto su {{appName}}',
      title: 'Verifica la tua email',
      greeting: 'Ciao{{name}},',
      intro: 'Benvenuto su {{appName}}. Per attivare il tuo account, verifica la tua email:',
      buttonText: 'Verifica Email',
      expiry: 'Il link è valido per <strong>24 ore</strong>.',
      footer: 'Se non hai richiesto questa registrazione, ignora questa email.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text version
      plainIntro: 'Benvenuto su {{appName}}. Per attivare il tuo account, verifica la tua email:',
      plainExpiry: 'Il link è valido per 24 ore.',
      plainFooter: 'Se non hai richiesto questa registrazione, ignora questa email.'
    },
    en: {
      subject: 'Welcome to {{appName}}',
      title: 'Verify your email',
      greeting: 'Hi{{name}},',
      intro: 'Welcome to {{appName}}. To activate your account, verify your email:',
      buttonText: 'Verify Email',
      expiry: 'This link is valid for <strong>24 hours</strong>.',
      footer: 'If you didn\'t request this registration, you can ignore this email.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text version
      plainIntro: 'Welcome to {{appName}}. To activate your account, verify your email:',
      plainExpiry: 'This link is valid for 24 hours.',
      plainFooter: 'If you didn\'t request this registration, you can ignore this email.'
    }
  },

  // ==================== MAGIC LINK EMAIL ====================
  magicLink: {
    it: {
      subject: 'Accedi ad {{appName}}',
      title: 'Accedi al tuo account',
      greeting: 'Ciao{{name}},',
      intro: 'Accedi al tuo account cliccando il pulsante qui sotto:',
      buttonText: 'Accedi ad {{appName}}',
      expiry: 'Questo link è valido per <strong>15 minuti</strong> e può essere usato una sola volta.',
      footer: 'Se non hai richiesto questo accesso, ignora questa email.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text
      plainIntro: 'Accedi al tuo account {{appName}} visitando questo link:',
      plainExpiry: 'Questo link è valido per 15 minuti e può essere usato una sola volta.',
      plainFooter: 'Se non hai richiesto questo accesso, ignora questa email.'
    },
    en: {
      subject: 'Sign in to {{appName}}',
      title: 'Access your account',
      greeting: 'Hi{{name}},',
      intro: 'Access your account by clicking the button below:',
      buttonText: 'Sign in to {{appName}}',
      expiry: 'This link is valid for <strong>15 minutes</strong> and can be used only once.',
      footer: 'If you didn\'t request this, you can ignore this email.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text
      plainIntro: 'Access your {{appName}} account by visiting this link:',
      plainExpiry: 'This link is valid for 15 minutes and can be used only once.',
      plainFooter: 'If you didn\'t request this, you can ignore this email.'
    }
  },

  // ==================== PASSWORD RESET EMAIL ====================
  passwordReset: {
    it: {
      subject: 'Reimposta la tua password',
      title: 'Reset Password',
      greeting: 'Ciao{{name}},',
      intro: 'Hai richiesto il reset della password per il tuo account {{appName}}.',
      cta: 'Clicca il pulsante per reimpostare:',
      buttonText: 'Reimposta Password',
      expiry: 'Questo link scadrà tra <strong>1 ora</strong>.',
      ignoreNote: 'Se non hai richiesto questo reset, ignora questa email. La tua password rimarrà invariata.',
      securityTip: '<strong>Nota di sicurezza:</strong> Non condividere mai questo link. Il team {{appName}} non ti chiederà mai la password.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text
      plainIntro: 'Hai richiesto il reset della password per il tuo account {{appName}}.',
      plainCta: 'Per reimpostare la password, visita questo link:',
      plainExpiry: 'Questo link scadrà tra 1 ora.',
      plainIgnore: 'Se non hai richiesto questo reset, ignora questa email.'
    },
    en: {
      subject: 'Reset your password',
      title: 'Reset Password',
      greeting: 'Hi{{name}},',
      intro: 'You requested a password reset for your {{appName}} account.',
      cta: 'Click the button to reset:',
      buttonText: 'Reset Password',
      expiry: 'This link will expire in <strong>1 hour</strong>.',
      ignoreNote: 'If you didn\'t request this reset, ignore this email. Your password will remain unchanged.',
      securityTip: '<strong>Security note:</strong> Never share this link. The {{appName}} team will never ask for your password.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text
      plainIntro: 'You requested a password reset for your {{appName}} account.',
      plainCta: 'To reset your password, visit this link:',
      plainExpiry: 'This link will expire in 1 hour.',
      plainIgnore: 'If you didn\'t request this reset, ignore this email.'
    }
  },

  // ==================== BETA WAITLIST CONFIRMATION EMAIL ====================
  betaWaitlist: {
    it: {
      subject: '🚀 Ci sei! Benvenuto nella beta di Afflyt',
      greeting: 'Ciao!',
      intro: 'Grazie per aver richiesto l\'accesso alla beta di Afflyt. Sei tra i primi a voler provare qualcosa di diverso — e questo mi piace.',
      founderIntro: 'Sono Marco, il founder. Ho costruito Afflyt perché ero stufo di vedere canali Telegram che sparano offerte a caso senza sapere cosa funziona. Tu probabilmente conosci la sensazione.',
      whatNextTitle: 'Cosa succede ora:',
      whatNextBody: 'Ti contatterò personalmente nei prossimi giorni con il tuo codice di accesso. Nel frattempo, se hai domande o vuoi raccontarmi del tuo canale, rispondi direttamente a questa email — la leggo io.',
      askTitle: 'Una cosa sola ti chiedo:',
      askBody: 'Quando avrai accesso, usalo davvero e dimmi cosa pensi. Feedback onesto, anche brutale. È l\'unico modo per costruire qualcosa che funziona.',
      closing: 'A presto,',
      signature: 'Marco',
      signatureTitle: 'Founder, Afflyt',
      ps: 'P.S. Se hai un canale Telegram attivo e non l\'hai inserito nel form, rispondimi con il link — ti metto in cima alla lista.',
      buttonText: 'Unisciti al canale Afflyt Updates',
      buttonUrl: 'https://t.me/afflyt',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        support: 'Supporto'
      },
      // Plain text
      plainIntro: 'Grazie per aver richiesto l\'accesso alla beta di Afflyt. Sei tra i primi a voler provare qualcosa di diverso.',
      plainBody: 'Sono Marco, il founder. Ti contatterò personalmente nei prossimi giorni con il tuo codice di accesso.',
      plainFooter: 'A presto, Marco'
    },
    en: {
      subject: '🚀 You\'re in! Welcome to the Afflyt beta',
      greeting: 'Hey!',
      intro: 'Thanks for requesting access to the Afflyt beta. You\'re among the first to want to try something different — and I like that.',
      founderIntro: 'I\'m Marco, the founder. I built Afflyt because I was tired of seeing Telegram channels posting random deals without knowing what actually works. You probably know the feeling.',
      whatNextTitle: 'What happens now:',
      whatNextBody: 'I\'ll personally reach out in the next few days with your access code. In the meantime, if you have questions or want to tell me about your channel, just reply to this email — I read them all.',
      askTitle: 'One thing I ask:',
      askBody: 'When you get access, actually use it and tell me what you think. Honest feedback, even brutal. It\'s the only way to build something that works.',
      closing: 'Talk soon,',
      signature: 'Marco',
      signatureTitle: 'Founder, Afflyt',
      ps: 'P.S. If you have an active Telegram channel and didn\'t include it in the form, reply with the link — I\'ll bump you to the top of the list.',
      buttonText: 'Join Afflyt Updates Channel',
      buttonUrl: 'https://t.me/afflyt',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        support: 'Support'
      },
      // Plain text
      plainIntro: 'Thanks for requesting access to the Afflyt beta. You\'re among the first to want to try something different.',
      plainBody: 'I\'m Marco, the founder. I\'ll personally reach out in the next few days with your access code.',
      plainFooter: 'Talk soon, Marco'
    }
  },

  // ==================== VERIFICATION REMINDER EMAIL ====================
  verificationReminder: {
    it: {
      subject: 'Verifica la tua email - {{appName}}',
      title: 'Verifica la tua email',
      greeting: 'Ciao{{name}},',
      intro: 'Verifica la tua email per accedere a tutte le funzionalità di {{appName}}:',
      buttonText: 'Verifica Email',
      expiry: 'Il link è valido per <strong>24 ore</strong>.',
      footer: 'Se hai già verificato, ignora questa email.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text
      plainIntro: 'Verifica la tua email per accedere a {{appName}}:',
      plainExpiry: 'Il link è valido per 24 ore.',
      plainFooter: 'Se hai già verificato, ignora questa email.'
    },
    en: {
      subject: 'Verify your email - {{appName}}',
      title: 'Verify your email',
      greeting: 'Hi{{name}},',
      intro: 'Verify your email to access all {{appName}} features:',
      buttonText: 'Verify Email',
      expiry: 'This link is valid for <strong>24 hours</strong>.',
      footer: 'If you\'ve already verified, you can ignore this email.',
      copyright: '© {{year}} {{appName}}',
      links: {
        privacy: 'Privacy',
        help: 'Help'
      },
      // Plain text
      plainIntro: 'Verify your email to access {{appName}}:',
      plainExpiry: 'This link is valid for 24 hours.',
      plainFooter: 'If you\'ve already verified, you can ignore this email.'
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
export function replaceVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
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

/**
 * Generate greeting with proper name handling
 * If name is present: "Ciao Marco,"
 * If name is absent: "Ciao,"
 */
export function generateGreeting(
  greetingTemplate: string,
  name?: string | null
): string {
  if (!name || name.trim() === '') {
    return greetingTemplate.replace(/{{name}}/g, '');
  }
  return greetingTemplate.replace(/{{name}}/g, ` ${name}`);
}
