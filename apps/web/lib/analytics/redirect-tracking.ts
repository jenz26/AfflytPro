/**
 * Redirect Funnel Analytics
 * Tracks user journey through the interstitial redirect page
 */

export type FunnelEventType =
  | 'page_view'
  | 'page_ready'
  | 'consent_shown'
  | 'consent_accepted'
  | 'consent_declined'
  | 'auto_redirect_start'
  | 'manual_click'
  | 'redirect_complete'
  | 'redirect_cancelled'
  | 'preference_changed';

export interface FunnelEventData {
  eventType: FunnelEventType;
  linkId?: string;
  shortCode?: string;
  sessionId: string;
  visitorId?: string;
  eventData?: Record<string, any>;
  hasConsent?: boolean;
  consentType?: 'auto' | 'manual';
  timeOnPage?: number;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
}

// Generate unique session ID
export const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create visitor ID (cookie-based)
export const getVisitorId = (): string => {
  const cookieName = 'afflyt_visitor_id';

  // Try to get existing visitor ID from cookie
  const match = document.cookie.match(new RegExp(`(^| )${cookieName}=([^;]+)`));
  if (match) {
    return match[2];
  }

  // Generate new visitor ID
  const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set cookie (365 days)
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 365);
  document.cookie = `${cookieName}=${visitorId};expires=${expiry.toUTCString()};path=/;SameSite=Lax`;

  return visitorId;
};

// Detect device type
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Detect browser
export const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  if (ua.indexOf('Trident') > -1) return 'IE';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  return 'Unknown';
};

// Detect OS
export const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
  return 'Unknown';
};

/**
 * Track funnel event
 * Sends event to API and optionally to external analytics
 */
export const trackFunnelEvent = async (data: FunnelEventData): Promise<void> => {
  try {
    // Enrich event data with device info
    const enrichedData: FunnelEventData = {
      ...data,
      device: data.device || getDeviceType(),
      browser: data.browser || getBrowser(),
      os: data.os || getOS(),
      visitorId: data.visitorId || getVisitorId(),
    };

    // Send to API
    await fetch('/api/analytics/funnel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedData),
      // Don't wait for response, fire and forget
      keepalive: true,
    }).catch(err => {
      // Silent fail for analytics
      console.warn('Analytics error:', err);
    });

    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', data.eventType, {
        event_category: 'redirect_funnel',
        event_label: data.shortCode,
        value: data.timeOnPage,
        ...data.eventData,
      });
    }

    // Also send to any other analytics providers
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(data.eventType, {
        props: {
          shortCode: data.shortCode,
          consent: data.consentType,
          device: enrichedData.device,
        },
      });
    }
  } catch (error) {
    // Silent fail for analytics
    console.warn('Failed to track event:', error);
  }
};

/**
 * Create a funnel tracker instance for a specific link
 */
export class FunnelTracker {
  private sessionId: string;
  private shortCode: string;
  private linkId?: string;
  private startTime: number;
  private hasConsent: boolean | null = null;
  private consentType: 'auto' | 'manual' | null = null;

  constructor(shortCode: string, linkId?: string) {
    this.sessionId = generateSessionId();
    this.shortCode = shortCode;
    this.linkId = linkId;
    this.startTime = Date.now();
  }

  private track(eventType: FunnelEventType, eventData?: Record<string, any>) {
    trackFunnelEvent({
      eventType,
      linkId: this.linkId,
      shortCode: this.shortCode,
      sessionId: this.sessionId,
      hasConsent: this.hasConsent ?? undefined,
      consentType: this.consentType ?? undefined,
      timeOnPage: Date.now() - this.startTime,
      eventData,
    });
  }

  pageView() {
    this.track('page_view');
  }

  pageReady() {
    this.track('page_ready');
  }

  consentShown() {
    this.track('consent_shown');
  }

  consentAccepted() {
    this.hasConsent = true;
    this.consentType = 'auto';
    this.track('consent_accepted', { choice: 'auto' });
  }

  consentDeclined() {
    this.hasConsent = false;
    this.consentType = 'manual';
    this.track('consent_declined', { choice: 'manual' });
  }

  autoRedirectStart(countdown: number) {
    this.track('auto_redirect_start', { countdown });
  }

  manualClick() {
    this.track('manual_click');
  }

  redirectComplete(amazonUrl: string) {
    this.track('redirect_complete', { amazonUrl });
  }

  redirectCancelled() {
    this.track('redirect_cancelled');
  }

  preferenceChanged(newPreference: 'auto' | 'manual') {
    this.consentType = newPreference;
    this.track('preference_changed', { newPreference });
  }
}
