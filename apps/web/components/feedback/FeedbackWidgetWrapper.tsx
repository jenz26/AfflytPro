'use client';

import { useEffect, useState } from 'react';
import { FeedbackWidget } from './FeedbackWidget';
import { API_BASE } from '@/lib/api/config';

/**
 * Wrapper component that fetches user plan and renders FeedbackWidget
 * Only shows for beta users
 */
export function FeedbackWidgetWrapper() {
  const [userPlan, setUserPlan] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.user?.plan);
        }
      } catch (error) {
        // Silently fail - widget just won't show
      }
    };

    fetchUserPlan();
  }, []);

  // Only render if we have the plan info
  if (!userPlan) return null;

  return <FeedbackWidget userPlan={userPlan} />;
}

export default FeedbackWidgetWrapper;
