'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'afflyt_redirect_consent';
const CONSENT_TIMESTAMP_KEY = 'afflyt_redirect_consent_timestamp';
const CONSENT_EXPIRY_DAYS = 365; // 1 year

export type RedirectConsent = 'auto' | 'manual' | null;

export const useRedirectConsent = () => {
  const [consent, setConsent] = useState<RedirectConsent>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read consent from localStorage
    const storedConsent = localStorage.getItem(CONSENT_KEY) as RedirectConsent;
    const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);

    if (storedConsent && timestamp) {
      const consentDate = new Date(timestamp);
      const expiryDate = new Date(
        consentDate.getTime() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );

      // Check if consent is still valid
      if (new Date() < expiryDate) {
        setConsent(storedConsent);
      } else {
        // Consent expired, clear it
        localStorage.removeItem(CONSENT_KEY);
        localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
        setConsent(null);
      }
    }

    setIsLoading(false);
  }, []);

  const saveConsent = (choice: RedirectConsent) => {
    if (choice) {
      localStorage.setItem(CONSENT_KEY, choice);
      localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    }
    setConsent(choice);
  };

  const clearConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
    setConsent(null);
  };

  return {
    consent,
    saveConsent,
    clearConsent,
    isLoading,
    hasConsent: consent !== null,
    shouldAutoRedirect: consent === 'auto',
  };
};
