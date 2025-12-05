'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LandingButton } from './LandingButton';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById('beta-signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'backdrop-blur-md bg-afflyt-dark-900/95 border-b border-white/5 py-2'
        : 'bg-transparent py-4'
    }`}>
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Logo completo (icona + testo) */}
        <a href="#" className="flex items-center">
          <Image
            src="/images/logo-dark-theme.webp"
            alt="Afflyt"
            width={200}
            height={50}
            className={`transition-all duration-300 ${scrolled ? 'h-10 w-auto' : 'h-14 w-auto'}`}
            priority
          />
        </a>

        {/* Nav Actions */}
        <div className="flex items-center gap-3">
          {/* Link Guide */}
          <Link
            href="/it/guide"
            className={`font-medium text-gray-400 hover:text-white transition-colors ${
              scrolled ? 'text-sm' : 'text-base'
            }`}
          >
            Guide
          </Link>
          {/* Link Accedi per utenti esistenti */}
          <Link
            href="/it/auth/login"
            className={`font-medium text-gray-400 hover:text-white transition-colors ${
              scrolled ? 'text-sm' : 'text-base'
            }`}
          >
            Accedi
          </Link>

          {/* CTA Button - si riduce quando scrollato */}
          <LandingButton
            onClick={scrollToForm}
            size={scrolled ? 'sm' : 'md'}
          >
            Richiedi Accesso
          </LandingButton>
        </div>
      </div>
    </nav>
  );
}
