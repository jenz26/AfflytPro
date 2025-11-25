'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingDown, Star, ArrowUpDown, Eye, RefreshCw, Package } from 'lucide-react';
import { ScorePill } from '@/components/ui/ScoreIndicator';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { StandardEmptyState } from '@/components/ui/StandardEmptyState';
import { DealDetailPanel } from '@/components/deals/DealDetailPanel';
import { searchDeals, Deal } from '@/lib/api/deals';

// Mock data - will be replaced with real Keepa API calls
const mockDeals = [
  {
    asin: 'B08N5WRWNW',
    title: 'Apple AirPods Pro (2ª generazione) con custodia di ricarica MagSafe (USB-C)',
    currentPrice: 199.99,
    originalPrice: 299.00,
    discount: 33,
    dealScore: 92,
    salesRank: 12,
    rating: 4.7,
    reviewCount: 45234,
    category: 'Elettronica',
    imageUrl: 'https://via.placeholder.com/200?text=AirPods+Pro',
    lastPriceCheckAt: new Date().toISOString()
  },
  {
    asin: 'B09V3KXJPB',
    title: 'Samsung Galaxy Buds2 Pro - Auricolari Bluetooth',
    currentPrice: 129.99,
    originalPrice: 229.00,
    discount: 43,
    dealScore: 87,
    salesRank: 24,
    rating: 4.5,
    reviewCount: 12543,
    category: 'Elettronica',
    imageUrl: 'https://via.placeholder.com/200?text=Galaxy+Buds',
    lastPriceCheckAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    asin: 'B0BSHF7WHW',
    title: 'Kindle Paperwhite (16 GB) - Con schermo da 6,8" e luce calda regolabile',
    currentPrice: 109.99,
    originalPrice: 159.99,
    discount: 31,
    dealScore: 78,
    salesRank: 8,
    rating: 4.8,
    reviewCount: 87234,
    category: 'Elettronica',
    imageUrl: 'https://via.placeholder.com/200?text=Kindle',
    lastPriceCheckAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    asin: 'B09JQMJHXY',
    title: 'Echo Dot (5ª generazione) | Altoparlante intelligente',
    currentPrice: 29.99,
    originalPrice: 64.99,
    discount: 54,
    dealScore: 95,
    salesRank: 3,
    rating: 4.6,
    reviewCount: 123456,
    category: 'Elettronica',
    imageUrl: 'https://via.placeholder.com/200?text=Echo+Dot',
    lastPriceCheckAt: new Date().toISOString()
  },
  {
    asin: 'B0B1VQ1ZQY',
    title: 'Logitech MX Master 3S - Mouse Wireless, Sensore 8000 DPI',
    currentPrice: 79.99,
    originalPrice: 119.99,
    discount: 33,
    dealScore: 72,
    salesRank: 156,
    rating: 4.7,
    reviewCount: 8765,
    category: 'Informatica',
    imageUrl: 'https://via.placeholder.com/200?text=MX+Master',
    lastPriceCheckAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export default function DealsPage() {
  const t = useTranslations('deals');
  const tFilters = useTranslations('deals.filters');
  const tCategories = useTranslations('deals.categories');
  const tTable = useTranslations('deals.table');
  const tStats = useTranslations('deals.stats');

  const categories = [
    { key: 'all', label: tCategories('all') },
    { key: 'electronics', label: tCategories('electronics') },
    { key: 'computers', label: tCategories('computers') },
    { key: 'homeKitchen', label: tCategories('homeKitchen') },
    { key: 'sportsOutdoors', label: tCategories('sportsOutdoors') },
    { key: 'beauty', label: tCategories('beauty') },
    { key: 'toysGames', label: tCategories('toysGames') }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minScore, setMinScore] = useState(0);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch deals from API
  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await searchDeals({
        minPrice,
        maxPrice,
        minScore,
        perPage: 100
      });

      if (response.success && response.deals.length > 0) {
        // Real data from Keepa API
        setDeals(response.deals);
      } else {
        // No data from API (no API key or no results) - use mock data
        setApiError('No Keepa API key configured or no results found');
        setDeals(mockDeals);
      }
    } catch (error: any) {
      console.error('Failed to fetch deals:', error);
      setApiError(error.message);
      // Fallback to mock data
      setDeals(mockDeals);
    } finally {
      setIsLoading(false);
    }
  }, [minPrice, maxPrice, minScore]);

  // Fetch deals on mount and when filters change
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Filter deals based on search and category (client-side)
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = searchQuery === '' ||
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.asin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      deal.category === categories.find(c => c.key === selectedCategory)?.label;

    return matchesSearch && matchesCategory;
  });

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-gray-400">{t('subtitle')}</p>
            {apiError && (
              <div className="mt-2 text-xs text-yellow-400 flex items-center gap-2">
                <span>⚠️ {t('mockDataWarning')} - {apiError}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchDeals}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{t('refresh')}</span>
            </button>
            <div className="bg-gradient-to-r from-afflyt-cyan-500/20 to-blue-500/20 border border-afflyt-cyan-500/30 rounded-xl px-6 py-3">
              <p className="text-sm text-gray-400">{t('dealsFound')}</p>
              <p className="text-2xl font-bold text-white">{filteredDeals.length}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
          />
        </div>

        {/* Filters - Using GlassCard */}
        <GlassCard padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-afflyt-cyan-400" />
            <h2 className="text-lg font-semibold text-white">{tFilters('title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">{tFilters('category')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-afflyt-cyan-500 transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">{tFilters('minPrice')}: €{minPrice}</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={minPrice}
                onChange={(e) => setMinPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-afflyt-cyan-500"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">{tFilters('maxPrice')}: €{maxPrice}</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-afflyt-cyan-500"
              />
            </div>

            {/* Min Score */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">{tFilters('minScore')}: {minScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-afflyt-cyan-500"
              />
            </div>
          </div>
        </GlassCard>

        {/* Results - Using Card-based layout */}
        <div className="space-y-3">
          {isLoading ? (
            <GlassCard padding="lg">
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-afflyt-cyan-500 border-t-transparent rounded-full"
                />
              </div>
            </GlassCard>
          ) : filteredDeals.length === 0 ? (
            <GlassCard padding="lg">
              <StandardEmptyState
                icon={Package}
                title={tTable('noDeals')}
                description="Try adjusting your filters or search query to find more deals"
                actionLabel={t('refresh')}
                onAction={fetchDeals}
              />
            </GlassCard>
          ) : (
            filteredDeals.map((deal, index) => (
              <motion.div
                key={deal.asin}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  variant="interactive"
                  padding="md"
                  className="hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    {/* Score - Using ScorePill (compact for tables) */}
                    <div className="flex-shrink-0">
                      <ScorePill score={deal.dealScore} size="sm" showLabel />
                    </div>

                    {/* Product Image */}
                    {deal.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-afflyt-glass-border bg-afflyt-dark-50 flex-shrink-0">
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white line-clamp-2 leading-tight mb-1">
                        {deal.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">{deal.asin}</p>
                    </div>

                    {/* Price & Discount */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white font-mono">€{deal.currentPrice.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 line-through">€{deal.originalPrice.toFixed(2)}</p>
                      </div>
                      <span className="bg-afflyt-profit-400/20 text-afflyt-profit-400 text-sm font-bold px-3 py-1 rounded-lg border border-afflyt-profit-400/30">
                        -{deal.discount}%
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[80px]">
                      {deal.rating && (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-base font-semibold text-white">{deal.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-gray-500">{deal.reviewCount?.toLocaleString()}</p>
                        </>
                      )}
                    </div>

                    {/* Actions - Using CyberButton */}
                    <div className="flex gap-2 flex-shrink-0">
                      <CyberButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewDeal(deal)}
                      >
                        <Eye className="w-4 h-4" />
                      </CyberButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Stats Footer - Using GlassCard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard padding="md">
            <p className="text-sm text-gray-400 mb-1">{tStats('hotDeals')}</p>
            <p className="text-3xl font-bold text-afflyt-profit-400 font-mono">
              {filteredDeals.filter(d => d.dealScore >= 80).length}
            </p>
          </GlassCard>
          <GlassCard padding="md">
            <p className="text-sm text-gray-400 mb-1">{tStats('goodDeals')}</p>
            <p className="text-3xl font-bold text-afflyt-cyan-400 font-mono">
              {filteredDeals.filter(d => d.dealScore >= 60 && d.dealScore < 80).length}
            </p>
          </GlassCard>
          <GlassCard padding="md">
            <p className="text-sm text-gray-400 mb-1">{tStats('averageDiscount')}</p>
            <p className="text-3xl font-bold text-yellow-400 font-mono">
              {filteredDeals.length > 0
                ? Math.round(filteredDeals.reduce((acc, d) => acc + d.discount, 0) / filteredDeals.length)
                : 0}%
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Detail Panel */}
      <DealDetailPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        deal={selectedDeal}
      />
    </div>
  );
}
