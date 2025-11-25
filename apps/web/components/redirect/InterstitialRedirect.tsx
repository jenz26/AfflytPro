'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { useRedirectConsent } from '@/hooks/useRedirectConsent';
import { ConsentBanner } from './ConsentBanner';
import { ComplianceFooter } from './ComplianceFooter';
import { FunnelTracker } from '@/lib/analytics/redirect-tracking';

interface Product {
  title: string;
  imageUrl?: string | null;
  currentPrice: number;
  originalPrice?: number | null;
  discount?: number | null;
  asin: string;
}

interface InterstitialRedirectProps {
  amazonUrl: string;
  product: Product;
  minutesAgo: number;
  shortCode: string;
  linkId?: string;
}

const AUTO_REDIRECT_SECONDS = 3;

export const InterstitialRedirect = ({
  amazonUrl,
  product,
  minutesAgo,
  shortCode,
  linkId,
}: InterstitialRedirectProps) => {
  const { consent, saveConsent, clearConsent, isLoading, shouldAutoRedirect } = useRedirectConsent();
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const router = useRouter();
  const trackerRef = useRef<FunnelTracker | null>(null);

  // Initialize funnel tracker
  useEffect(() => {
    trackerRef.current = new FunnelTracker(shortCode, linkId);
    trackerRef.current.pageView();

    // Track page ready
    const timer = setTimeout(() => {
      trackerRef.current?.pageReady();
    }, 100);

    return () => clearTimeout(timer);
  }, [shortCode, linkId]);

  // Show consent banner for first-time users (after they click)
  useEffect(() => {
    if (hasClicked && consent === null && !showConsentBanner) {
      trackerRef.current?.consentShown();
      setShowConsentBanner(true);
    }
  }, [hasClicked, consent, showConsentBanner]);

  // Auto-redirect logic
  useEffect(() => {
    if (isLoading || !shouldAutoRedirect || hasClicked) return;

    // Track auto-redirect start
    trackerRef.current?.autoRedirectStart(AUTO_REDIRECT_SECONDS);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect
          trackerRef.current?.redirectComplete(amazonUrl);
          window.location.href = amazonUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [amazonUrl, isLoading, shouldAutoRedirect, hasClicked]);

  const handleManualClick = () => {
    setHasClicked(true);
    trackerRef.current?.manualClick();
    trackerRef.current?.redirectComplete(amazonUrl);
    window.location.href = amazonUrl;
  };

  const handleConsentAccept = () => {
    saveConsent('auto');
    trackerRef.current?.consentAccepted();
    setShowConsentBanner(false);
  };

  const handleConsentDecline = () => {
    saveConsent('manual');
    trackerRef.current?.consentDeclined();
    setShowConsentBanner(false);
  };

  const handleChangePreference = () => {
    clearConsent();
    trackerRef.current?.preferenceChanged('manual');
  };

  const handleCancel = () => {
    trackerRef.current?.redirectCancelled();
    router.back();
  };

  const amazonDomain = new URL(amazonUrl).hostname;
  const isAutoMode = shouldAutoRedirect && !hasClicked;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full" padding="lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ExternalLink className="w-5 h-5 text-afflyt-cyan-400" />
              <h1 className="text-xl font-bold text-white">
                {isAutoMode ? 'Redirect su Amazon' : 'Vai su Amazon'}
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Stai andando su <span className="text-afflyt-cyan-400 font-mono">{amazonDomain}</span>
            </p>
          </div>

          {/* Product Card */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              {/* Product Image - Larger for better visibility */}
              {product.imageUrl && (
                <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-white shadow-md">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg sm:text-xl line-clamp-2 mb-3">
                  {product.title}
                </h2>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white font-mono">
                    €{product.currentPrice.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-sm text-gray-500 line-through">
                        €{product.originalPrice.toFixed(2)}
                      </span>
                      {product.discount && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                          -{product.discount}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-redirect Progress Bar */}
            {isAutoMode && countdown > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-afflyt-cyan-400 font-semibold">
                    Redirect automatico
                  </p>
                  <p className="text-sm text-white font-mono font-bold">
                    {countdown}s
                  </p>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600 shadow-lg"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: AUTO_REDIRECT_SECONDS, ease: 'linear' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preference Badge (if consent exists) */}
          {consent !== null && (
            <div className="bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/20 rounded-lg px-3 py-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white">
                  {shouldAutoRedirect ? '✨ Redirect automatico' : '🔒 Click manuale'}
                </span>
                <button
                  onClick={handleChangePreference}
                  className="text-xs text-afflyt-cyan-400 hover:text-afflyt-cyan-300 underline"
                >
                  Cambia
                </button>
              </div>
            </div>
          )}

          {/* CTA Button - Taller for better touch target */}
          <CyberButton
            variant="primary"
            size="lg"
            className="w-full mb-3 min-h-[48px] text-base sm:text-lg font-bold"
            onClick={handleManualClick}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Vai su Amazon
          </CyberButton>

          {/* Cancel Button - More visible */}
          <button
            onClick={handleCancel}
            className="w-full text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 py-3 font-medium hover:bg-white/5 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Torna indietro
          </button>

          {/* Compliance Footer */}
          <ComplianceFooter
            asin={product.asin}
            minutesAgo={minutesAgo}
            amazonDomain={amazonDomain}
          />
        </GlassCard>
      </div>

      {/* Consent Banner (first-time users) */}
      <ConsentBanner
        isVisible={showConsentBanner}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </>
  );
};
