'use client';

import { useEffect, useRef } from 'react';

export const useAnalytics = () => {
  const sessionId = useRef(
    typeof window !== 'undefined'
      ? sessionStorage.getItem('sessionId') || crypto.randomUUID()
      : 'ssr'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sessionId', sessionId.current);
    }
  }, []);

  const track = async (
    eventName: string,
    eventCategory: string,
    properties?: Record<string, any>
  ) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch('http://localhost:3001/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          sessionId: sessionId.current,
          eventName,
          eventCategory,
          properties,
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const trackPageView = (pageName: string) => {
    track('page_viewed', 'navigation', { page: pageName });
  };

  const trackOnboardingStep = (step: string, action: 'viewed' | 'completed', metadata?: any) => {
    track(`onboarding_step_${action}`, 'onboarding', { step, ...metadata });
  };

  return { track, trackPageView, trackOnboardingStep, sessionId: sessionId.current };
};

export const useStepTimer = (stepName: string) => {
  const { track } = useAnalytics();
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      track('step_duration', 'onboarding', { step: stepName, duration });
    };
  }, [stepName, track]);
};
