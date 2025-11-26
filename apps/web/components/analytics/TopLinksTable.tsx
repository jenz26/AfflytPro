'use client';

import { ExternalLink, TrendingUp, Copy, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useState } from 'react';

interface TopLink {
    id: string;
    shortCode: string;
    shortUrl: string;
    product: {
        title: string;
        imageUrl?: string;
        asin: string;
    };
    metrics: {
        clicks: number;
        conversions: number;
        revenue: number;
        cvr: number;
        epc: number;
    };
}

interface TopLinksTableProps {
    links: TopLink[];
    title?: string;
    showViewAll?: boolean;
    onViewAll?: () => void;
}

export function TopLinksTable({
    links,
    title = 'Top Performing Links',
    showViewAll = true,
    onViewAll
}: TopLinksTableProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = async (url: string, id: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {showViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors"
                    >
                        View All
                    </button>
                )}
            </div>

            {links.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No links yet. Start creating affiliate links!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link, index) => (
                        <div
                            key={link.id}
                            className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                            {/* Rank */}
                            <div className="w-8 h-8 rounded-full bg-afflyt-dark-100 flex items-center justify-center text-sm font-bold text-gray-400">
                                {index + 1}
                            </div>

                            {/* Product Image */}
                            {link.product.imageUrl ? (
                                <img
                                    src={link.product.imageUrl}
                                    alt={link.product.title}
                                    className="w-12 h-12 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-afflyt-dark-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-500">No img</span>
                                </div>
                            )}

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                    {link.product.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span className="font-mono">{link.shortCode}</span>
                                    <button
                                        onClick={() => handleCopy(link.shortUrl, link.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-afflyt-cyan-400"
                                    >
                                        {copiedId === link.id ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-6 text-right">
                                <div>
                                    <p className="text-sm font-mono text-white">{link.metrics.clicks}</p>
                                    <p className="text-xs text-gray-500">clicks</p>
                                </div>
                                <div>
                                    <p className="text-sm font-mono text-emerald-400">€{link.metrics.revenue}</p>
                                    <p className="text-xs text-gray-500">revenue</p>
                                </div>
                                <div>
                                    <p className="text-sm font-mono text-afflyt-cyan-400">{link.metrics.cvr}%</p>
                                    <p className="text-xs text-gray-500">CVR</p>
                                </div>
                                <div>
                                    <p className="text-sm font-mono text-purple-400">€{link.metrics.epc}</p>
                                    <p className="text-xs text-gray-500">EPC</p>
                                </div>
                            </div>

                            {/* External Link */}
                            <a
                                href={`https://amazon.it/dp/${link.product.asin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-500 hover:text-white" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </GlassCard>
    );
}
