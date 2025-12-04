'use client';

import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Image src="/logo.webp" alt="Afflyt" width={24} height={24} />
          <span>&copy; 2025 Afflyt. Tutti i diritti riservati.</span>
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-white transition-colors">Termini</a>
          <a href="https://t.me/afflyt" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a>
        </div>
      </div>
    </footer>
  );
}
