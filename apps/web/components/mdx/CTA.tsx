'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CTAButton {
  text: string;
  href: string;
}

interface CTAProps {
  title: string;
  description?: string;
  primaryButton: CTAButton;
  secondaryButton?: CTAButton;
  variant?: 'gradient' | 'minimal' | 'card';
}

export function CTA({
  title,
  description,
  primaryButton,
  secondaryButton,
  variant = 'gradient',
}: CTAProps) {
  if (variant === 'minimal') {
    return (
      <div className="my-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl border border-gray-800 bg-afflyt-dark-50">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {secondaryButton && (
            <Link
              href={secondaryButton.href}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {secondaryButton.text}
            </Link>
          )}
          <Link
            href={primaryButton.href}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-afflyt-cyan-400 text-afflyt-dark-100 text-sm font-semibold hover:bg-afflyt-cyan-300 transition-colors"
          >
            {primaryButton.text}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="my-8 p-8 rounded-2xl border border-gray-800 bg-afflyt-dark-50 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={primaryButton.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-afflyt-cyan-400 text-afflyt-dark-100 font-semibold hover:bg-afflyt-cyan-300 transition-all hover:scale-105"
          >
            {primaryButton.text}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {secondaryButton && (
            <Link
              href={secondaryButton.href}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
            >
              {secondaryButton.text}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Default: gradient variant
  return (
    <div className="my-12 relative overflow-hidden rounded-2xl">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-afflyt-cyan-400/20 via-afflyt-dark-50 to-afflyt-plasma-500/20" />
      <div className="absolute inset-0 bg-afflyt-dark-50/80" />

      <div className="relative text-center p-10 md:p-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-plasma-500 mb-6">
          <Sparkles className="h-7 w-7 text-white" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {title}
        </h3>

        {description && (
          <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={primaryButton.href}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-afflyt-cyan-400 text-afflyt-dark-100 font-semibold hover:bg-afflyt-cyan-300 transition-all hover:scale-105 shadow-lg shadow-afflyt-cyan-400/25"
          >
            {primaryButton.text}
            <ArrowRight className="h-5 w-5" />
          </Link>
          {secondaryButton && (
            <Link
              href={secondaryButton.href}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
            >
              {secondaryButton.text}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
