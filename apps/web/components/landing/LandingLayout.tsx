import { ReactNode } from 'react';
import { LandingNav } from './client/LandingNav';
import { LandingFooter } from './client/LandingFooter';

interface LandingLayoutProps {
  children: ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-afflyt-dark-900 to-afflyt-dark-950 text-white">
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}
