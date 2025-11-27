'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

// Tawk.to TypeScript declarations
declare global {
  interface Window {
    Tawk_API?: {
      toggle?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      setAttributes?: (attributes: Record<string, string>, callback?: (error?: Error) => void) => void;
      addEvent?: (eventName: string, metadata?: Record<string, any>, callback?: (error?: Error) => void) => void;
      onLoad?: () => void;
      onStatusChange?: (status: string) => void;
    };
    Tawk_LoadStart?: Date;
  }
}

const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '';
const TAWK_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '';

interface TawkChatProps {
  /**
   * User info to pass to Tawk for context
   */
  user?: {
    name?: string;
    email?: string;
    plan?: string;
  };
}

/**
 * Tawk.to Live Chat Widget
 * Loads the Tawk.to chat widget on the page
 */
export function TawkChat({ user }: TawkChatProps) {
  const locale = useLocale();

  useEffect(() => {
    // Skip if not configured
    if (!TAWK_PROPERTY_ID || !TAWK_WIDGET_ID) {
      console.warn('[Tawk] Missing TAWK_PROPERTY_ID or TAWK_WIDGET_ID');
      return;
    }

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Set user attributes when widget loads
    window.Tawk_API.onLoad = function () {
      if (user && window.Tawk_API?.setAttributes) {
        window.Tawk_API.setAttributes(
          {
            name: user.name || 'Visitor',
            email: user.email || '',
            plan: user.plan || 'free',
            locale: locale,
          },
          function (error) {
            if (error) {
              console.error('[Tawk] Error setting attributes:', error);
            }
          }
        );
      }
    };

    // Load Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

    // Cleanup
    return () => {
      // Remove script on unmount if needed
      const tawkScript = document.querySelector(`script[src*="embed.tawk.to"]`);
      if (tawkScript) {
        tawkScript.remove();
      }
    };
  }, [user, locale]);

  return null; // This component doesn't render anything visible
}

/**
 * Helper functions to control Tawk.to widget programmatically
 */
export const TawkActions = {
  /**
   * Open the chat widget
   */
  open: () => {
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize();
    }
  },

  /**
   * Close/minimize the chat widget
   */
  close: () => {
    if (window.Tawk_API?.minimize) {
      window.Tawk_API.minimize();
    }
  },

  /**
   * Toggle the chat widget
   */
  toggle: () => {
    if (window.Tawk_API?.toggle) {
      window.Tawk_API.toggle();
    }
  },

  /**
   * Hide the widget completely
   */
  hide: () => {
    if (window.Tawk_API?.hideWidget) {
      window.Tawk_API.hideWidget();
    }
  },

  /**
   * Show the widget
   */
  show: () => {
    if (window.Tawk_API?.showWidget) {
      window.Tawk_API.showWidget();
    }
  },

  /**
   * Track a custom event
   */
  trackEvent: (eventName: string, metadata?: Record<string, any>) => {
    if (window.Tawk_API?.addEvent) {
      window.Tawk_API.addEvent(eventName, metadata, (error) => {
        if (error) {
          console.error('[Tawk] Error tracking event:', error);
        }
      });
    }
  },

  /**
   * Open chat with context (e.g., from login page)
   */
  openWithContext: (context: 'magic_link_issue' | 'login_problem' | 'general') => {
    // Track the context
    TawkActions.trackEvent('support_requested', { context });
    // Open the chat
    TawkActions.open();
  },
};
