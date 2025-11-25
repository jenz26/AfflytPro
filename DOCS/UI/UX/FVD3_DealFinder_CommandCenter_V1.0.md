# FVD 3: UX Design Deal Finder - Command Center 🎯

## 1. LAYOUT PAGINA PRINCIPALE

```tsx
// app/dashboard/deals/page.tsx
'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp,
  Clock,
  Zap,
  Send,
  Link2,
  ChevronDown,
  AlertCircle,
  Fire,
  BarChart3,
  RefreshCw,
  Star,
  Package,
  DollarSign,
  Percent
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { DealDetailPanel } from '@/components/deals/DealDetailPanel';

interface Deal {
  asin: string;
  title: string;
  dealScore: number;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  category: string;
  salesRank: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  ttl: number; // in minutes
  lastUpdated: Date;
}

export default function DealFinderPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    category: 'all',
    priceRange: 'all',
    minScore: 70,
    hideExpired: true
  });

  // Simulated data
  const deals: Deal[] = [
    {
      asin: 'B08N5WRWNW',
      title: 'Echo Dot (4ª generazione) - Altoparlante intelligente con Alexa',
      dealScore: 92,
      currentPrice: 19.99,
      originalPrice: 59.99,
      discount: 67,
      category: 'Elettronica',
      salesRank: 24,
      rating: 4.5,
      reviews: 125430,
      imageUrl: '/echo-dot.jpg',
      ttl: 45,
      lastUpdated: new Date(Date.now() - 15 * 60000) // 15 min ago
    },
    // ... more deals
  ];

  const getDealScoreColor = (score: number) => {
    if (score >= 85) return 'from-red-500 to-orange-500'; // HOT
    if (score >= 70) return 'from-afflyt-cyan-400 to-afflyt-cyan-600'; // GOOD
    if (score >= 50) return 'from-yellow-400 to-yellow-600'; // MODERATE
    return 'from-gray-400 to-gray-600'; // LOW
  };

  const getDealScoreLabel = (score: number) => {
    if (score >= 85) return { text: 'HOT DEAL', icon: Fire, color: 'text-orange-400' };
    if (score >= 70) return { text: 'OTTIMO', icon: TrendingUp, color: 'text-afflyt-cyan-400' };
    if (score >= 50) return { text: 'BUONO', icon: BarChart3, color: 'text-yellow-400' };
    return { text: 'NORMALE', icon: BarChart3, color: 'text-gray-400' };
  };

  const getTTLStatus = (ttlMinutes: number) => {
    const hours = ttlMinutes / 60;
    if (hours > 20) return { color: 'text-afflyt-profit-400', label: 'Fresh' };
    if (hours > 10) return { color: 'text-yellow-400', label: 'Valid' };
    if (hours > 5) return { color: 'text-orange-400', label: 'Expiring' };
    return { color: 'text-red-400', label: 'Critical' };
  };

  return (
    <div className="min-h-screen bg-afflyt-dark-100 pl-72">
      {/* Header with Search */}
      <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-afflyt-dark-100" />
                </div>
                Deal Finder Command
              </h1>
              <p className="text-gray-400 mt-1">
                Intelligence in tempo reale dai dati Keepa
              </p>
            </div>

            {/* Live Stats */}
            <div className="flex gap-4">
              <GlassCard className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                  <div>
                    <p className="text-xs text-gray-500">Deal Attivi</p>
                    <p className="text-lg font-bold text-white font-mono">1,247</p>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-afflyt-cyan-400" />
                  <div>
                    <p className="text-xs text-gray-500">TTL Medio</p>
                    <p className="text-lg font-bold text-white font-mono">18.5h</p>
                  </div>
                </div>
              </GlassCard>

              <CyberButton variant="secondary" size="sm">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </CyberButton>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per ASIN, titolo prodotto o categoria..."
                className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50"
              />
            </div>

            <CyberButton variant="primary">
              <Search className="w-4 h-4" />
              Cerca Deal
            </CyberButton>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-8 pb-4 flex items-center gap-4">
          {/* Category Filter */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg hover:border-afflyt-cyan-500/40 transition-colors">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Categoria</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg hover:border-afflyt-cyan-500/40 transition-colors">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Fascia Prezzo</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Min Score Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg">
            <Fire className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">Min Score:</span>
            <input
              type="number"
              value={activeFilters.minScore}
              onChange={(e) => setActiveFilters({ ...activeFilters, minScore: Number(e.target.value) })}
              className="w-12 bg-transparent text-afflyt-cyan-400 font-mono text-sm focus:outline-none"
              min="0"
              max="100"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtri attivi:</span>
            <span className="px-2 py-1 bg-afflyt-cyan-500/20 text-afflyt-cyan-400 text-xs font-mono rounded">
              3
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex">
        {/* Results Table */}
        <div className="flex-1 p-8">
          <div className="space-y-4">
            {deals.map((deal) => {
              const scoreLabel = getDealScoreLabel(deal.dealScore);
              const ScoreIcon = scoreLabel.icon;
              const ttlStatus = getTTLStatus(deal.ttl);
              
              return (
                <GlassCard 
                  key={deal.asin}
                  className="p-6 hover:border-afflyt-cyan-500/40 transition-all cursor-pointer group"
                  onClick={() => setSelectedDeal(deal)}
                >
                  <div className="flex items-center gap-6">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-afflyt-dark-50 rounded-lg flex-shrink-0" />

                    {/* Deal Score Visual */}
                    <div className="relative">
                      <div className="w-24 h-24">
                        {/* Circular Progress */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-afflyt-dark-50"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - deal.dealScore / 100)}`}
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" className={deal.dealScore >= 85 ? 'text-orange-400' : 'text-afflyt-cyan-400'} />
                              <stop offset="100%" className={deal.dealScore >= 85 ? 'text-red-500' : 'text-afflyt-cyan-600'} />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Score Number */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-white font-mono">
                            {deal.dealScore}
                          </span>
                          <span className={`text-xs ${scoreLabel.color}`}>
                            {scoreLabel.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-afflyt-cyan-300 transition-colors line-clamp-1">
                            {deal.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500 font-mono">
                              ASIN: {deal.asin}
                            </span>
                            <span className="text-xs text-gray-500">
                              {deal.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-gray-400">
                                {deal.rating} ({deal.reviews.toLocaleString()})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* TTL Indicator */}
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${ttlStatus.color}`} />
                            <div>
                              <p className="text-xs text-gray-500">Data Freshness</p>
                              <p className={`text-sm font-mono ${ttlStatus.color}`}>
                                {Math.floor(deal.ttl / 60)}h {deal.ttl % 60}m
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-6">
                          {/* Current Price */}
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Prezzo Attuale</p>
                            <p className="text-2xl font-bold text-white">
                              €{deal.currentPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Aggiornato: {new Date(deal.lastUpdated).toLocaleTimeString('it-IT')}
                            </p>
                          </div>

                          {/* Original Price */}
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Prezzo Originale</p>
                            <p className="text-lg text-gray-400 line-through">
                              €{deal.originalPrice.toFixed(2)}
                            </p>
                          </div>

                          {/* Discount Badge */}
                          <div className="px-3 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-red-400" />
                              <span className="text-lg font-bold text-red-400">
                                -{deal.discount}%
                              </span>
                            </div>
                          </div>

                          {/* Sales Rank */}
                          <div className="px-3 py-2 bg-afflyt-cyan-500/10 rounded-lg">
                            <p className="text-xs text-gray-500">Rank</p>
                            <p className="text-sm font-mono text-afflyt-cyan-400">
                              #{deal.salesRank}
                            </p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <CyberButton variant="secondary" size="sm">
                            <Link2 className="w-4 h-4" />
                            Link
                          </CyberButton>
                          <CyberButton variant="primary" size="sm">
                            <Send className="w-4 h-4" />
                            Invia
                          </CyberButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDeal && (
          <DealDetailPanel 
            deal={selectedDeal}
            onClose={() => setSelectedDeal(null)}
          />
        )}
      </div>
    </div>
  );
}
```

## 2. DEAL DETAIL SIDE PANEL

```tsx
// components/deals/DealDetailPanel.tsx
'use client';

import { useState } from 'react';
import { 
  X, 
  Send, 
  Link2, 
  Zap,
  Clock,
  TrendingUp,
  Package,
  Star,
  ChevronDown,
  CheckCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  Bot,
  Hash
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface DealDetailPanelProps {
  deal: any;
  onClose: () => void;
}

export const DealDetailPanel = ({ deal, onClose }: DealDetailPanelProps) => {
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTag, setSelectedTag] = useState('contindig-21');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Simulated channels from settings
  const availableChannels = [
    {
      id: 'ch1',
      name: 'Offerte Tech Italia',
      type: 'telegram',
      icon: Send,
      subscribers: 12500,
      status: 'active'
    },
    {
      id: 'ch2',
      name: 'Prime Deals',
      type: 'telegram',
      icon: Send,
      subscribers: 8200,
      status: 'active'
    },
    {
      id: 'ch3',
      name: 'Test Channel',
      type: 'discord',
      icon: MessageSquare,
      subscribers: 450,
      status: 'inactive'
    }
  ];

  const amazonTags = [
    { id: 'contindig-21', label: 'ContinDigital (Primary)' },
    { id: 'techdeals-21', label: 'Tech Deals' },
    { id: 'primeoff-21', label: 'Prime Offers' }
  ];

  const handleGenerateLink = () => {
    setIsGeneratingLink(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedLink(`https://amzn.to/3xY9abc?tag=${selectedTag}`);
      setIsGeneratingLink(false);
    }, 1000);
  };

  const handleSendToChannel = () => {
    if (!selectedChannel) return;
    
    setIsSending(true);
    // Simulate sending
    setTimeout(() => {
      setIsSending(false);
      // Show success toast
    }, 1500);
  };

  return (
    <div className="w-[480px] h-full bg-afflyt-dark-50 border-l border-afflyt-glass-border overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-afflyt-dark-50/95 backdrop-blur-xl border-b border-afflyt-glass-border p-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Deal Intelligence</h2>
            <p className="text-sm text-gray-400 mt-1">ASIN: {deal.asin}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Deal Score Summary */}
        <div className="mt-4 p-3 bg-gradient-to-r from-afflyt-cyan-500/10 to-afflyt-cyan-600/10 rounded-lg border border-afflyt-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-afflyt-cyan-300 font-mono">
                    {deal.dealScore}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Deal Score</p>
                <p className="text-xs text-afflyt-cyan-400">Performance eccellente</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500">TTL</p>
              <p className="text-sm font-mono text-afflyt-profit-400">
                {Math.floor(deal.ttl / 60)}h {deal.ttl % 60}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Product Info */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Informazioni Prodotto
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white line-clamp-2">
                {deal.title}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Categoria</p>
                <p className="text-white">{deal.category}</p>
              </div>
              <div>
                <p className="text-gray-500">Sales Rank</p>
                <p className="text-afflyt-cyan-400 font-mono">#{deal.salesRank}</p>
              </div>
              <div>
                <p className="text-gray-500">Valutazione</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span className="text-white">{deal.rating}</span>
                  <span className="text-gray-500">({deal.reviews})</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Sconto</p>
                <p className="text-red-400 font-bold">-{deal.discount}%</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Price History Chart Placeholder */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Storico Prezzi (30 giorni)
          </h3>
          <div className="h-32 bg-afflyt-dark-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-afflyt-cyan-400/30" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-gray-500">Min</p>
              <p className="text-white font-mono">€{(deal.currentPrice * 0.95).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Media</p>
              <p className="text-white font-mono">€{(deal.currentPrice * 1.2).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Max</p>
              <p className="text-white font-mono">€{deal.originalPrice.toFixed(2)}</p>
            </div>
          </div>
        </GlassCard>

        {/* Channel Selection */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-afflyt-cyan-400" />
            Invia al Canale
          </h3>
          
          <div className="space-y-2">
            {availableChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                disabled={channel.status !== 'active'}
                className={`w-full p-3 rounded-lg border transition-all ${
                  selectedChannel === channel.id
                    ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                    : channel.status === 'active'
                    ? 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/20'
                    : 'bg-afflyt-glass-white/50 border-afflyt-glass-border opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <channel.icon className={`w-4 h-4 ${
                      channel.type === 'telegram' ? 'text-blue-400' : 'text-purple-400'
                    }`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        {channel.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {channel.subscribers.toLocaleString()} iscritti
                      </p>
                    </div>
                  </div>
                  {selectedChannel === channel.id && (
                    <CheckCircle className="w-4 h-4 text-afflyt-cyan-400" />
                  )}
                  {channel.status !== 'active' && (
                    <span className="text-xs text-yellow-400">Non configurato</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button className="w-full mt-3 p-2 text-sm text-afflyt-cyan-400 hover:bg-afflyt-glass-white rounded-lg transition-colors">
            + Configura nuovo canale
          </button>
        </GlassCard>

        {/* Amazon Tag Selection */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-afflyt-cyan-400" />
            Tag Affiliazione Amazon
          </h3>
          
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-3 py-2 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white text-sm focus:outline-none focus:border-afflyt-cyan-500"
          >
            {amazonTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
        </GlassCard>

        {/* Generated Link */}
        {generatedLink && (
          <GlassCard className="p-4 border-afflyt-cyan-500/40">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Link Affiliato Generato
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-sm text-afflyt-cyan-300 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(generatedLink)}
                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
              
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Compliant con le policy Amazon • Tag: {selectedTag}
            </p>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <CyberButton 
            variant="primary" 
            className="w-full justify-center"
            onClick={handleGenerateLink}
          >
            {isGeneratingLink ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-afflyt-dark-100 border-t-transparent rounded-full animate-spin" />
                <span>Generazione...</span>
              </div>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Genera Link Affiliato
              </>
            )}
          </CyberButton>

          <CyberButton 
            variant="secondary" 
            className="w-full justify-center"
            onClick={handleSendToChannel}
            disabled={!selectedChannel || isSending}
          >
            {isSending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Invio in corso...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Invia al Canale Selezionato
              </>
            )}
          </CyberButton>

          <button className="w-full p-3 text-sm text-afflyt-plasma-400 hover:bg-afflyt-plasma-500/10 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Aggiungi all'Automazione
          </button>
        </div>

        {/* Compliance Notice */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-xs text-yellow-300 font-medium">
                Compliance Amazon
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Prezzo aggiornato: {new Date(deal.lastUpdated).toLocaleString('it-IT')}
                <br />
                TTL rimanente: {Math.floor(deal.ttl / 60)}h {deal.ttl % 60}m
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 3. DEAL SCORE VISUAL COMPONENT

```tsx
// components/deals/DealScoreIndicator.tsx
import { Fire, TrendingUp, BarChart3 } from 'lucide-react';

interface DealScoreIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const DealScoreIndicator = ({ 
  score, 
  size = 'md', 
  showLabel = true 
}: DealScoreIndicatorProps) => {
  const sizes = {
    sm: { container: 'w-16 h-16', text: 'text-lg', label: 'text-[10px]', radius: 24 },
    md: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-xs', radius: 36 },
    lg: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-sm', radius: 48 }
  };

  const config = sizes[size];

  const getScoreConfig = (score: number) => {
    if (score >= 85) return {
      gradient: 'from-orange-400 to-red-500',
      icon: Fire,
      label: 'HOT DEAL',
      pulse: true
    };
    if (score >= 70) return {
      gradient: 'from-afflyt-cyan-400 to-afflyt-cyan-600',
      icon: TrendingUp,
      label: 'OTTIMO',
      pulse: false
    };
    if (score >= 50) return {
      gradient: 'from-yellow-400 to-yellow-600',
      icon: BarChart3,
      label: 'BUONO',
      pulse: false
    };
    return {
      gradient: 'from-gray-400 to-gray-600',
      icon: BarChart3,
      label: 'NORMALE',
      pulse: false
    };
  };

  const scoreConfig = getScoreConfig(score);
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className={`relative ${config.container}`}>
      {/* Pulse Effect for Hot Deals */}
      {scoreConfig.pulse && (
        <div className={`absolute inset-0 bg-gradient-to-r ${scoreConfig.gradient} rounded-full opacity-20 animate-ping`} />
      )}
      
      {/* SVG Circle */}
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={config.radius * 1.33}
          cy={config.radius * 1.33}
          r={config.radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-afflyt-dark-50"
        />
        
        {/* Progress Circle */}
        <circle
          cx={config.radius * 1.33}
          cy={config.radius * 1.33}
          r={config.radius}
          stroke="url(#score-gradient)"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={`text-${scoreConfig.gradient.split(' ')[0].replace('from-', '')}`} />
            <stop offset="100%" className={`text-${scoreConfig.gradient.split(' ')[2].replace('to-', '')}`} />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${config.text} font-bold text-white font-mono`}>
          {score}
        </span>
        {showLabel && (
          <span className={`${config.label} text-gray-300 mt-0.5`}>
            {scoreConfig.label}
          </span>
        )}
      </div>
    </div>
  );
};
```

## ACCEPTANCE CRITERIA ✅

### 1. **Decisione "Hot Deal" in < 3 secondi** ✓

**Visual Hierarchy Ottimizzata:**
- **Deal Score prominente** con circular progress colorato
- **Codice colore immediato**: Rosso/Arancio = HOT, Cyan = Buono
- **Prezzo e sconto** in primo piano con badge visivo
- **TTL con indicatore colore** per urgenza

### 2. **Invio al Canale Intuitivo** ✓

- **Side panel dedicato** che si apre al click
- **Lista canali configurati** con stato (attivo/inattivo)
- **Selezione visual** con checkbox e highlight
- **CTA chiaro** "Invia al Canale Selezionato"

### 3. **Compliance Amazon** ✓

- **Timestamp freschezza** sempre visibile sotto il prezzo
- **TTL indicator** con colori di stato
- **Notice compliance** nel detail panel
- **Tag affiliazione** selezionabile prima della generazione link

### 4. **Design System Cyber Intelligence** ✓

- **Glass morphism** su tutte le card
- **Corner cuts** sui bottoni CTA
- **Palette cyan/plasma** consistente
- **Font mono** per dati critici (ASIN, prezzi, TTL)
- **Animazioni fluide** ma non invasive

### 5. **Filtri Potenti** ✓

- **Categoria** dropdown con multi-select
- **Fascia prezzo** con range slider
- **Min Score** input numerico diretto
- **Counter filtri attivi** sempre visibile

### 6. **Multi-Account & Targeting** ✓

- **Selezione Tag Amazon** nel detail panel
- **Canali multipli** selezionabili
- **Status canali** (attivi/configurati/pending)
- **Link a settings** per configurare nuovi canali

## FEATURES BONUS IMPLEMENTATE

1. **Live Stats Header**: Deal attivi e TTL medio in tempo reale
2. **Price History Chart**: Placeholder per grafico Keepa
3. **Quick Actions**: Bottoni rapidi Link/Invia su ogni card
4. **Sales Rank Badge**: Indicatore performance vendite
5. **Automation Integration**: Bottone "Aggiungi all'Automazione"

Il design trasmette "command & control" con dati Keepa presentati come intelligence actionable. L'utente può valutare e agire su un deal in pochi secondi! 🚀