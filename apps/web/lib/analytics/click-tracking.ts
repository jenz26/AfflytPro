/**
 * Click Tracking Analytics
 * Collects comprehensive client-side data for click tracking
 */

export interface ClickTrackingData {
  // Device & Browser
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;

  // Screen & Display
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  touchEnabled: boolean;

  // Locale & Time
  language: string;
  timezone: string;

  // Connection
  connectionType: string | null;
  connectionSpeed: string | null;

  // UTM Tracking
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;

  // Visitor Tracking
  visitorId: string;
  sessionId: string;

  // Telegram Source Tracking
  telegramChannelId: string | null;  // ch param
  telegramMessageId: string | null;  // mid param
  postTimestamp: string | null;      // t param (ISO timestamp)
}

/**
 * Get or create persistent visitor ID (stored in cookie for 2 years)
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  const cookieName = 'afflyt_vid';
  const match = document.cookie.match(new RegExp(`(^| )${cookieName}=([^;]+)`));

  if (match) {
    return match[2];
  }

  // Generate new visitor ID
  const visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  // Set cookie for 2 years
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 2);
  document.cookie = `${cookieName}=${visitorId};expires=${expiry.toUTCString()};path=/;SameSite=Lax;Secure`;

  return visitorId;
}

/**
 * Generate session ID (unique per browser session)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const storageKey = 'afflyt_sid';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = `s_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';

  const ua = navigator.userAgent;

  // Check for tablets first (more specific)
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  // Check for mobile
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Parse browser info from user agent
 */
function getBrowserInfo(): { name: string; version: string } {
  if (typeof navigator === 'undefined') return { name: 'Unknown', version: '' };

  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '';

  // Order matters - check more specific browsers first
  if (ua.includes('Firefox/')) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    name = 'Edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || '';
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    name = 'Opera';
    version = ua.match(/(?:OPR|Opera)\/(\d+)/)?.[1] || '';
  } else if (ua.includes('SamsungBrowser/')) {
    name = 'Samsung';
    version = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('MSIE') || ua.includes('Trident/')) {
    name = 'IE';
    version = ua.match(/(?:MSIE |rv:)(\d+)/)?.[1] || '';
  }

  return { name, version };
}

/**
 * Parse OS info from user agent
 */
function getOSInfo(): { name: string; version: string } {
  if (typeof navigator === 'undefined') return { name: 'Unknown', version: '' };

  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '';

  if (ua.includes('Windows NT')) {
    name = 'Windows';
    const ntVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    // Map NT versions to Windows versions
    const versionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
    };
    version = ntVersion ? versionMap[ntVersion] || ntVersion : '';
  } else if (ua.includes('Mac OS X')) {
    name = 'macOS';
    version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
    name = 'iOS';
    version = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Android')) {
    name = 'Android';
    version = ua.match(/Android (\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Linux')) {
    name = 'Linux';
  } else if (ua.includes('CrOS')) {
    name = 'Chrome OS';
  }

  return { name, version };
}

/**
 * Get connection info (if available)
 */
function getConnectionInfo(): { type: string | null; speed: string | null } {
  if (typeof navigator === 'undefined') return { type: null, speed: null };

  // @ts-ignore - Navigator connection API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return { type: null, speed: null };

  return {
    type: connection.type || connection.effectiveType || null,
    speed: connection.effectiveType || null,
  };
}

/**
 * Extract UTM parameters from URL
 */
function getUTMParams(): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
} {
  if (typeof window === 'undefined') {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmTerm: params.get('utm_term'),
    utmContent: params.get('utm_content'),
  };
}

/**
 * Extract Telegram source tracking parameters from URL
 * - ch: Channel ID or username
 * - mid: Message ID of the post
 * - t: Timestamp when post was published (Unix timestamp in seconds)
 */
function getTelegramParams(): {
  telegramChannelId: string | null;
  telegramMessageId: string | null;
  postTimestamp: string | null;
} {
  if (typeof window === 'undefined') {
    return { telegramChannelId: null, telegramMessageId: null, postTimestamp: null };
  }

  const params = new URLSearchParams(window.location.search);

  const ch = params.get('ch');
  const mid = params.get('mid');
  const t = params.get('t');

  // Convert Unix timestamp to ISO string if provided
  let postTimestamp: string | null = null;
  if (t) {
    const timestamp = parseInt(t, 10);
    if (!isNaN(timestamp)) {
      // Handle both seconds and milliseconds
      const ms = timestamp > 9999999999 ? timestamp : timestamp * 1000;
      postTimestamp = new Date(ms).toISOString();
    }
  }

  return {
    telegramChannelId: ch,
    telegramMessageId: mid,
    postTimestamp,
  };
}

/**
 * Collect all tracking data
 */
export function collectClickTrackingData(): ClickTrackingData {
  const browserInfo = getBrowserInfo();
  const osInfo = getOSInfo();
  const connectionInfo = getConnectionInfo();
  const utmParams = getUTMParams();
  const telegramParams = getTelegramParams();

  return {
    // Device & Browser
    deviceType: getDeviceType(),
    browser: browserInfo.name,
    browserVersion: browserInfo.version,
    os: osInfo.name,
    osVersion: osInfo.version,

    // Screen & Display
    screenWidth: typeof screen !== 'undefined' ? screen.width : 0,
    screenHeight: typeof screen !== 'undefined' ? screen.height : 0,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    touchEnabled: typeof navigator !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false,

    // Locale & Time
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',

    // Connection
    connectionType: connectionInfo.type,
    connectionSpeed: connectionInfo.speed,

    // UTM Tracking
    ...utmParams,

    // Visitor Tracking
    visitorId: getVisitorId(),
    sessionId: getSessionId(),

    // Telegram Source Tracking
    ...telegramParams,
  };
}
