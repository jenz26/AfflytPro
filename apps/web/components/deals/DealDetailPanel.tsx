'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown, Star, Package, Calendar, Send, ExternalLink, Copy, Check, Plus } from 'lucide-react';
import { DealScoreIndicator } from './DealScoreIndicator';
import { useState, useEffect } from 'react';
import { getChannels, Channel } from '@/lib/api/channels';
import Link from 'next/link';

interface DealDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  deal: {
    asin: string;
    title: string;
    currentPrice: number;
    originalPrice: number;
    discount: number;
    dealScore: number;
    salesRank?: number;
    rating?: number;
    reviewCount?: number;
    category: string;
    imageUrl?: string;
    lastPriceCheckAt: string;
  } | null;
}

export function DealDetailPanel({ isOpen, onClose, deal }: DealDetailPanelProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [amazonTag, setAmazonTag] = useState<string>('afflytpro-21'); // Default tag
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

  // Fetch user's channels when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen]);

  const fetchChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const userChannels = await getChannels();
      setChannels(userChannels);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedChannel || !deal || !amazonTag) return;

    setIsGenerating(true);

    try {
      // Generate affiliate link with timestamp for compliance
      const affiliateLink = `https://www.amazon.it/dp/${deal.asin}?tag=${amazonTag}&timestamp=${Date.now()}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(affiliateLink);
      setLinkCopied(true);

      // TODO: Call API to save link and associate with channel
      // await fetch('/api/links/generate', {
      //   method: 'POST',
      //   body: JSON.stringify({ asin: deal.asin, amazonTag, channelId: selectedChannel })
      // });

    } catch (error) {
      console.error('Failed to generate link:', error);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 60) return `${diffMinutes}m fa`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h fa`;
    return `${Math.floor(diffMinutes / 1440)}g fa`;
  };

  if (!deal) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-l border-afflyt-cyan-500/30 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-afflyt-cyan-500/30 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Deal Details</h2>
                <p className="text-sm text-gray-400 mt-1">ASIN: {deal.asin}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors border border-gray-700"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Deal Score */}
              <div className="flex items-center justify-center py-4">
                <DealScoreIndicator score={deal.dealScore} size="lg" />
              </div>

              {/* Product Image & Title */}
              <div className="space-y-4">
                {deal.imageUrl && (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                    <img
                      src={deal.imageUrl}
                      alt={deal.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white leading-tight">{deal.title}</h3>
              </div>

              {/* Price Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-afflyt-cyan-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Prezzo Attuale</span>
                  </div>
                  <p className="text-2xl font-bold text-white">€{deal.currentPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aggiornato {formatDate(deal.lastPriceCheckAt)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Prezzo Originale</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-400 line-through">€{deal.originalPrice.toFixed(2)}</p>
                  <p className="text-xs text-green-400 mt-1 font-semibold">
                    -{deal.discount}% di sconto
                  </p>
                </div>
              </div>

              {/* Product Stats */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-3">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Statistiche Prodotto</h4>

                <div className="grid grid-cols-2 gap-4">
                  {deal.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-300">{deal.rating.toFixed(1)} stelle</span>
                    </div>
                  )}
                  {deal.reviewCount && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{deal.reviewCount.toLocaleString()} recensioni</span>
                    </div>
                  )}
                </div>

                {deal.salesRank && (
                  <div className="pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400">Sales Rank</p>
                    <p className="text-sm font-semibold text-afflyt-cyan-400">
                      #{deal.salesRank.toLocaleString()} in {deal.category}
                    </p>
                  </div>
                )}
              </div>

              {/* Deal Score Breakdown */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-3">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Score Breakdown</h4>

                <div className="space-y-2">
                  <ScoreBar label="Discount" value={Math.min(deal.discount, 100)} color="green" />
                  <ScoreBar label="Sales Rank" value={deal.salesRank ? Math.max(0, 100 - (deal.salesRank / 100)) : 50} color="blue" />
                  <ScoreBar label="Rating" value={deal.rating ? (deal.rating / 5) * 100 : 0} color="yellow" />
                  <ScoreBar label="Reviews" value={deal.reviewCount ? Math.min((deal.reviewCount / 1000) * 100, 100) : 0} color="purple" />
                </div>
              </div>

              {/* Channel Selection */}
              <div className="bg-gradient-to-br from-afflyt-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-afflyt-cyan-500/30 space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                  <Send className="w-4 h-4 text-afflyt-cyan-400" />
                  Invia al Canale
                </h4>

                {isLoadingChannels ? (
                  <div className="flex items-center justify-center py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-afflyt-cyan-500 border-t-transparent rounded-full"
                    />
                  </div>
                ) : channels.length === 0 ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-sm text-gray-400">Nessun canale configurato</p>
                    <Link
                      href="/dashboard/settings"
                      className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Aggiungi Canale
                    </Link>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Canale</label>
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
                      >
                        <option value="">Seleziona un canale...</option>
                        {channels.map(channel => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name} ({channel.platform})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Amazon Associate Tag</label>
                      <input
                        type="text"
                        value={amazonTag}
                        onChange={(e) => setAmazonTag(e.target.value)}
                        placeholder="es. afflytpro-21"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">Il tuo tag Amazon Associates per il tracciamento</p>
                    </div>

                    <button
                      onClick={handleGenerateLink}
                      disabled={!selectedChannel || !amazonTag || isGenerating}
                      className="w-full bg-gradient-to-r from-afflyt-cyan-500 to-blue-500 hover:from-afflyt-cyan-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Generazione...
                        </>
                      ) : linkCopied ? (
                        <>
                          <Check className="w-5 h-5" />
                          Link Copiato!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Genera Link Affiliato
                        </>
                      )}
                    </button>

                    {linkCopied && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-afflyt-cyan-400 text-center"
                      >
                        Link copiato negli appunti con timestamp compliant Amazon
                      </motion.p>
                    )}
                  </>
                )}
              </div>

              {/* View on Amazon */}
              <a
                href={`https://www.amazon.it/dp/${deal.asin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Visualizza su Amazon
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper component for score breakdown bars
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-afflyt-cyan-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-white">{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`h-full ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}
        />
      </div>
    </div>
  );
}
