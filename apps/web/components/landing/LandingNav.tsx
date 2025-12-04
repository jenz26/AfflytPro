'use client';

import Image from 'next/image';
import { LandingButton } from './LandingButton';

export function LandingNav() {
  const scrollToForm = () => {
    document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-afflyt-dark-900/80 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.webp" alt="Afflyt" width={32} height={32} />
          <span className="font-space-grotesk font-bold text-xl text-white">Afflyt</span>
        </div>
        <LandingButton onClick={scrollToForm} size="sm">
          Richiedi Accesso
        </LandingButton>
      </div>
    </nav>
  );
}
