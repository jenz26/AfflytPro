'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    Link2,
    Search,
    Filter,
    Copy,
    Check,
    ExternalLink,
    TrendingUp,
    MousePointerClick,
    RefreshCw,
    ChevronDown,
    ArrowUpDown,
    Calendar,
    Tag,
    Send
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

interface AffiliateLink {
    id: string;
    shortCode: string;
    shortUrl: string;
    fullUrl: string;
    amazonTag: string;
    clicks: number;
    totalRevenue: number;
    conversionCount: number;
    channelId: string | null;
    createdAt: string;
    product: {
        asin: string;
        title: string;
        currentPrice: number;
        imageUrl: string | null;
        category: string | null;
    } | null;
    channel?: {
        name: string;
        platform: string;
    } | null;
}

type SortField = 'clicks' | 'revenue' | 'conversions' | 'date';
type SortOrder = 'asc' | 'desc';

export default function LinksPage() {
    const t = useTranslations('dashboard');

    // State
    const [links, setLinks] = useState<AffiliateLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Fetch links
    const fetchLinks = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/links/my?limit=200`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch links');

            const data = await response.json();
            setLinks(data.links || []);
        } catch (err) {
            setError('Errore nel caricamento dei link');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    // Get unique channels and tags for filters
    const { channels, tags } = useMemo(() => {
        const channelSet = new Set<string>();
        const tagSet = new Set<string>();

        links.forEach(link => {
            if (link.channel?.name) {
                channelSet.add(`${link.channel.name}|${link.channel.platform}`);
            }
            if (link.amazonTag) {
                tagSet.add(link.amazonTag);
            }
        });

        return {
            channels: Array.from(channelSet).map(c => {
                const [name, platform] = c.split('|');
                return { name, platform };
            }),
            tags: Array.from(tagSet)
        };
    }, [links]);

    // Filter and sort links
    const filteredLinks = useMemo(() => {
        let result = [...links];

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(link =>
                link.product?.title?.toLowerCase().includes(searchLower) ||
                link.shortCode.toLowerCase().includes(searchLower) ||
                link.product?.asin?.toLowerCase().includes(searchLower)
            );
        }

        // Channel filter
        if (channelFilter !== 'all') {
            result = result.filter(link =>
                link.channel?.name === channelFilter
            );
        }

        // Tag filter
        if (tagFilter !== 'all') {
            result = result.filter(link => link.amazonTag === tagFilter);
        }

        // Sort
        result.sort((a, b) => {
            let aVal: number, bVal: number;

            switch (sortField) {
                case 'clicks':
                    aVal = a.clicks;
                    bVal = b.clicks;
                    break;
                case 'revenue':
                    aVal = a.totalRevenue;
                    bVal = b.totalRevenue;
                    break;
                case 'conversions':
                    aVal = a.conversionCount;
                    bVal = b.conversionCount;
                    break;
                case 'date':
                default:
                    aVal = new Date(a.createdAt).getTime();
                    bVal = new Date(b.createdAt).getTime();
            }

            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });

        return result;
    }, [links, search, channelFilter, tagFilter, sortField, sortOrder]);

    // Copy handler
    const handleCopy = async (url: string, id: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Toggle sort
    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        return filteredLinks.reduce((acc, link) => ({
            clicks: acc.clicks + link.clicks,
            revenue: acc.revenue + link.totalRevenue,
            conversions: acc.conversions + link.conversionCount
        }), { clicks: 0, revenue: 0, conversions: 0 });
    }, [filteredLinks]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Link2 className="w-7 h-7 text-afflyt-cyan-400" />
                        I Miei Link
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gestisci e monitora tutti i tuoi link affiliato
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLinks}
                        disabled={loading}
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-afflyt-cyan-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white font-mono">{filteredLinks.length}</p>
                            <p className="text-xs text-gray-500">Link Totali</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <MousePointerClick className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white font-mono">{totals.clicks.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Click Totali</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-400 font-mono">
                                {totals.revenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                            </p>
                            <p className="text-xs text-gray-500">Revenue Totale</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white font-mono">{totals.conversions}</p>
                            <p className="text-xs text-gray-500">Conversioni</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Filters */}
            <GlassCard className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Cerca per titolo, ASIN o codice..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-afflyt-cyan-500/50"
                        />
                    </div>

                    {/* Channel Filter */}
                    {channels.length > 0 && (
                        <div className="relative">
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="appearance-none pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-afflyt-cyan-500/50 cursor-pointer"
                            >
                                <option value="all">Tutti i canali</option>
                                {channels.map(ch => (
                                    <option key={ch.name} value={ch.name}>
                                        {ch.name} ({ch.platform})
                                    </option>
                                ))}
                            </select>
                            <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    )}

                    {/* Tag Filter */}
                    {tags.length > 1 && (
                        <div className="relative">
                            <select
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                                className="appearance-none pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-afflyt-cyan-500/50 cursor-pointer"
                            >
                                <option value="all">Tutti i tag</option>
                                {tags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    )}

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Ordina:</span>
                        {(['date', 'clicks', 'revenue'] as SortField[]).map(field => (
                            <button
                                key={field}
                                onClick={() => toggleSort(field)}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    sortField === field
                                        ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400 border border-afflyt-cyan-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {field === 'date' ? 'Data' : field === 'clicks' ? 'Click' : 'Revenue'}
                                {sortField === field && (
                                    <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Links Table */}
            <GlassCard className="overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 text-afflyt-cyan-400 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Caricamento link...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-400">{error}</p>
                        <button onClick={fetchLinks} className="mt-4 text-afflyt-cyan-400 hover:underline">
                            Riprova
                        </button>
                    </div>
                ) : filteredLinks.length === 0 ? (
                    <div className="p-8 text-center">
                        <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">
                            {search || channelFilter !== 'all' || tagFilter !== 'all'
                                ? 'Nessun link trovato con i filtri selezionati'
                                : 'Nessun link ancora. I link vengono creati automaticamente dalle automazioni.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Prodotto</th>
                                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Link</th>
                                    <th className="text-center py-4 px-4 text-xs font-medium text-gray-400 uppercase">Canale</th>
                                    <th className="text-right py-4 px-4 text-xs font-medium text-gray-400 uppercase">Click</th>
                                    <th className="text-right py-4 px-4 text-xs font-medium text-gray-400 uppercase">Conv.</th>
                                    <th className="text-right py-4 px-4 text-xs font-medium text-gray-400 uppercase">Revenue</th>
                                    <th className="text-right py-4 px-4 text-xs font-medium text-gray-400 uppercase">CVR</th>
                                    <th className="text-center py-4 px-4 text-xs font-medium text-gray-400 uppercase">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLinks.map((link) => {
                                    const cvr = link.clicks > 0 ? ((link.conversionCount / link.clicks) * 100).toFixed(1) : '0.0';

                                    return (
                                        <tr key={link.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            {/* Product */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {link.product?.imageUrl ? (
                                                        <img
                                                            src={link.product.imageUrl}
                                                            alt=""
                                                            className="w-10 h-10 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                                            <Link2 className="w-4 h-4 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white font-medium truncate max-w-[200px]">
                                                            {link.product?.title || 'Link diretto'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-mono">
                                                            {link.product?.asin || link.shortCode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Link */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs text-afflyt-cyan-400 bg-afflyt-cyan-500/10 px-2 py-1 rounded">
                                                        {link.shortCode}
                                                    </code>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {link.amazonTag}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Channel */}
                                            <td className="py-4 px-4 text-center">
                                                {link.channel ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                                                        <Send className="w-3 h-3" />
                                                        {link.channel.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </td>

                                            {/* Clicks */}
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-sm text-white font-mono">{link.clicks.toLocaleString()}</span>
                                            </td>

                                            {/* Conversions */}
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-sm text-white font-mono">{link.conversionCount}</span>
                                            </td>

                                            {/* Revenue */}
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-sm text-emerald-400 font-mono">
                                                    {link.totalRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </td>

                                            {/* CVR */}
                                            <td className="py-4 px-4 text-right">
                                                <span className={`text-sm font-mono ${
                                                    parseFloat(cvr) >= 3 ? 'text-emerald-400' :
                                                    parseFloat(cvr) >= 1 ? 'text-yellow-400' : 'text-gray-400'
                                                }`}>
                                                    {cvr}%
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleCopy(link.shortUrl, link.id)}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Copia link"
                                                    >
                                                        {copiedId === link.id ? (
                                                            <Check className="w-4 h-4 text-emerald-400" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                                                        )}
                                                    </button>
                                                    {link.product?.asin && (
                                                        <a
                                                            href={`https://amazon.it/dp/${link.product.asin}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                            title="Apri su Amazon"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
