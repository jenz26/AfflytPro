/**
 * Email Provider Detection Utility
 * Detects email providers and returns relevant information for user guidance
 */

export type EmailProviderType =
  | 'gmail'
  | 'outlook'
  | 'hotmail'
  | 'yahoo'
  | 'icloud'
  | 'protonmail'
  | 'corporate'
  | 'other';

export interface EmailProviderInfo {
  type: EmailProviderType;
  name: string;
  webmailUrl?: string;
  /**
   * Known delivery issues or special handling needed
   */
  hasDeliveryIssues: boolean;
  /**
   * Specific tips for this provider
   */
  tips: string[];
}

const PROVIDER_DOMAINS: Record<string, EmailProviderInfo> = {
  // Gmail
  'gmail.com': {
    type: 'gmail',
    name: 'Gmail',
    webmailUrl: 'https://mail.google.com',
    hasDeliveryIssues: false,
    tips: ['checkPromotions', 'checkSpam'],
  },
  'googlemail.com': {
    type: 'gmail',
    name: 'Gmail',
    webmailUrl: 'https://mail.google.com',
    hasDeliveryIssues: false,
    tips: ['checkPromotions', 'checkSpam'],
  },

  // Microsoft - Known for aggressive filtering
  'outlook.com': {
    type: 'outlook',
    name: 'Outlook',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },
  'outlook.it': {
    type: 'outlook',
    name: 'Outlook',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },
  'hotmail.com': {
    type: 'hotmail',
    name: 'Hotmail',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },
  'hotmail.it': {
    type: 'hotmail',
    name: 'Hotmail',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },
  'live.com': {
    type: 'hotmail',
    name: 'Microsoft Live',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },
  'live.it': {
    type: 'hotmail',
    name: 'Microsoft Live',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },
  'msn.com': {
    type: 'hotmail',
    name: 'MSN',
    webmailUrl: 'https://outlook.live.com',
    hasDeliveryIssues: true,
    tips: ['checkJunk', 'checkFocused', 'addToContacts'],
  },

  // Yahoo
  'yahoo.com': {
    type: 'yahoo',
    name: 'Yahoo Mail',
    webmailUrl: 'https://mail.yahoo.com',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  },
  'yahoo.it': {
    type: 'yahoo',
    name: 'Yahoo Mail',
    webmailUrl: 'https://mail.yahoo.com',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  },
  'ymail.com': {
    type: 'yahoo',
    name: 'Yahoo Mail',
    webmailUrl: 'https://mail.yahoo.com',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  },

  // iCloud
  'icloud.com': {
    type: 'icloud',
    name: 'iCloud Mail',
    webmailUrl: 'https://www.icloud.com/mail',
    hasDeliveryIssues: false,
    tips: ['checkJunk'],
  },
  'me.com': {
    type: 'icloud',
    name: 'iCloud Mail',
    webmailUrl: 'https://www.icloud.com/mail',
    hasDeliveryIssues: false,
    tips: ['checkJunk'],
  },
  'mac.com': {
    type: 'icloud',
    name: 'iCloud Mail',
    webmailUrl: 'https://www.icloud.com/mail',
    hasDeliveryIssues: false,
    tips: ['checkJunk'],
  },

  // ProtonMail
  'protonmail.com': {
    type: 'protonmail',
    name: 'ProtonMail',
    webmailUrl: 'https://mail.proton.me',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  },
  'proton.me': {
    type: 'protonmail',
    name: 'ProtonMail',
    webmailUrl: 'https://mail.proton.me',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  },
  'pm.me': {
    type: 'protonmail',
    name: 'ProtonMail',
    webmailUrl: 'https://mail.proton.me',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  },

  // Italian ISPs
  'libero.it': {
    type: 'other',
    name: 'Libero Mail',
    webmailUrl: 'https://mail.libero.it',
    hasDeliveryIssues: true,
    tips: ['checkSpam', 'checkPromotions'],
  },
  'virgilio.it': {
    type: 'other',
    name: 'Virgilio Mail',
    webmailUrl: 'https://mail.virgilio.it',
    hasDeliveryIssues: true,
    tips: ['checkSpam'],
  },
  'alice.it': {
    type: 'other',
    name: 'Alice Mail',
    webmailUrl: 'https://mail.tim.it',
    hasDeliveryIssues: true,
    tips: ['checkSpam'],
  },
  'tim.it': {
    type: 'other',
    name: 'TIM Mail',
    webmailUrl: 'https://mail.tim.it',
    hasDeliveryIssues: true,
    tips: ['checkSpam'],
  },
  'fastweb.it': {
    type: 'other',
    name: 'Fastweb Mail',
    hasDeliveryIssues: true,
    tips: ['checkSpam'],
  },
  'tiscali.it': {
    type: 'other',
    name: 'Tiscali Mail',
    webmailUrl: 'https://mail.tiscali.it',
    hasDeliveryIssues: true,
    tips: ['checkSpam'],
  },
  'aruba.it': {
    type: 'other',
    name: 'Aruba Mail',
    webmailUrl: 'https://webmail.aruba.it',
    hasDeliveryIssues: true,
    tips: ['checkSpam'],
  },
  'pec.it': {
    type: 'corporate',
    name: 'PEC',
    hasDeliveryIssues: true,
    tips: ['pecWarning'],
  },
};

// Patterns that indicate corporate/business email
const CORPORATE_PATTERNS = [
  /^[a-z]+\.[a-z]+$/, // company.com pattern (no numbers, simple)
  /\.co$/,
  /\.io$/,
  /\.ai$/,
  /\.tech$/,
  /\.dev$/,
  /\.agency$/,
  /\.studio$/,
  /\.digital$/,
];

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string | null {
  const match = email.toLowerCase().trim().match(/@([^@]+)$/);
  return match ? match[1] : null;
}

/**
 * Check if domain looks like corporate email
 */
function isCorporateDomain(domain: string): boolean {
  // Known consumer domains are not corporate
  if (PROVIDER_DOMAINS[domain]) {
    return false;
  }

  // Check corporate patterns
  return CORPORATE_PATTERNS.some(pattern => pattern.test(domain));
}

/**
 * Detect email provider from email address
 */
export function detectEmailProvider(email: string): EmailProviderInfo {
  const domain = extractDomain(email);

  if (!domain) {
    return {
      type: 'other',
      name: 'Email',
      hasDeliveryIssues: false,
      tips: ['checkSpam'],
    };
  }

  // Check known providers first
  const knownProvider = PROVIDER_DOMAINS[domain];
  if (knownProvider) {
    return knownProvider;
  }

  // Check if it looks like corporate email
  if (isCorporateDomain(domain)) {
    return {
      type: 'corporate',
      name: 'Corporate Email',
      hasDeliveryIssues: true,
      tips: ['corporateWarning', 'checkQuarantine', 'contactIT'],
    };
  }

  // Default for unknown providers
  return {
    type: 'other',
    name: 'Email',
    hasDeliveryIssues: false,
    tips: ['checkSpam'],
  };
}

/**
 * Check if email is from a Microsoft provider (known for delivery issues)
 */
export function isMicrosoftEmail(email: string): boolean {
  const provider = detectEmailProvider(email);
  return provider.type === 'outlook' || provider.type === 'hotmail';
}

/**
 * Check if email provider has known delivery issues
 */
export function hasDeliveryIssues(email: string): boolean {
  return detectEmailProvider(email).hasDeliveryIssues;
}

/**
 * Get webmail URL for the email provider
 */
export function getWebmailUrl(email: string): string | undefined {
  return detectEmailProvider(email).webmailUrl;
}
