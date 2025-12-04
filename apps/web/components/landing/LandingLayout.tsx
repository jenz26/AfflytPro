'use client';

import { ReactNode } from 'react';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';

interface LandingLayoutProps {
  children: ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-afflyt-dark-900 to-afflyt-dark-950">
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}
