'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { ShoppingBag, TrendingUp, Package, Euro, BarChart3 } from 'lucide-react';

interface CategoryData {
    category: string;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    avgPrice: number;
}

interface PriceRangeData {
    range: string;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
}

interface TopProduct {
    productId: string;
    title: string;
    clicks: number;
    conversions: number;
    revenue: number;
    cvr: number;
    avgPrice: number;
}

interface ProductAnalyticsProps {
    byCategory: CategoryData[];
    byPriceRange: PriceRangeData[];
    topPerformers: TopProduct[];
    totals: {
        totalProducts: number;
        totalClicks: number;
        totalConversions: number;
        totalRevenue: number;
    };
    loading?: boolean;
}

function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        electronics: '📱',
        computers: '💻',
        home: '🏠',
        kitchen: '🍳',
        fashion: '👗',
        beauty: '💄',
        sports: '⚽',
        books: '📚',
        toys: '🧸',
        garden: '🌿',
        automotive: '🚗',
        health: '💊',
    };
    return icons[category.toLowerCase()] || '📦';
}

function getCategoryColor(index: number): string {
    const colors = [
        'from-blue-500 to-afflyt-cyan-500',
        'from-afflyt-plasma-500 to-pink-500',
        'from-orange-500 to-red-500',
        'from-afflyt-profit-500 to-emerald-500',
        'from-indigo-500 to-afflyt-plasma-500',
        'from-yellow-500 to-orange-500',
    ];
    return colors[index % colors.length];
}

function getPriceRangeColor(range: string): string {
    const colors: Record<string, string> = {
        '€0-25': 'bg-emerald-500',
        '€25-50': 'bg-cyan-500',
        '€50-100': 'bg-blue-500',
        '€100-200': 'bg-purple-500',
        '€200+': 'bg-orange-500',
    };
    return colors[range] || 'bg-gray-500';
}

export function ProductAnalytics({ byCategory, byPriceRange, topPerformers, totals, loading }: ProductAnalyticsProps) {
    if (loading) {
        return (
            <div className="space-y-6">
                <GlassCard className="p-6">
                    <div className="animate-pulse">
                        <div className="h-6 w-48 bg-white/10 rounded mb-6" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-white/5 rounded" />
                            ))}
                        </div>
                    </div>
                </GlassCard>
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <GlassCard key={i} className="p-6">
                            <div className="animate-pulse">
                                <div className="h-6 w-32 bg-white/10 rounded mb-4" />
                                <div className="h-48 bg-white/5 rounded" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        );
    }

    const hasData = totals.totalProducts > 0;

    if (!hasData) {
        return (
            <GlassCard className="p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">No Product Data Yet</h4>
                <p className="text-gray-400 text-sm">
                    Start tracking product links to see performance analytics by category and price range.
                </p>
            </GlassCard>
        );
    }

    // Calculate max values for percentage bars
    const maxCategoryRevenue = Math.max(...byCategory.map(c => c.revenue), 1);
    const maxPriceRangeRevenue = Math.max(...byPriceRange.map(p => p.revenue), 1);

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Products Tracked</p>
                            <p className="text-xl font-bold text-white">{totals.totalProducts}</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Product Clicks</p>
                            <p className="text-xl font-bold text-white">{totals.totalClicks.toLocaleString()}</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Conversions</p>
                            <p className="text-xl font-bold text-white">{totals.totalConversions}</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Euro className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Product Revenue</p>
                            <p className="text-xl font-bold text-emerald-400">€{totals.totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-purple-400" />
                        Performance by Category
                    </h3>

                    {byCategory.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No category data available</p>
                    ) : (
                        <div className="space-y-4">
                            {byCategory.slice(0, 6).map((category, index) => (
                                <div key={category.category} className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getCategoryIcon(category.category)}</span>
                                            <span className="text-white font-medium capitalize text-sm">
                                                {category.category}
                                            </span>
                                        </div>
                                        <span className="text-emerald-400 font-mono text-sm">
                                            €{category.revenue.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getCategoryColor(index)} rounded-full transition-all group-hover:opacity-80`}
                                            style={{ width: `${(category.revenue / maxCategoryRevenue) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>{category.clicks} clicks</span>
                                        <span>CVR: {category.cvr}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Price Range Analysis */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Euro className="w-5 h-5 text-orange-400" />
                        Performance by Price Range
                    </h3>

                    {byPriceRange.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No price range data available</p>
                    ) : (
                        <div className="space-y-4">
                            {byPriceRange.map((priceRange) => (
                                <div key={priceRange.range} className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium text-sm">
                                            {priceRange.range}
                                        </span>
                                        <span className="text-emerald-400 font-mono text-sm">
                                            €{priceRange.revenue.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getPriceRangeColor(priceRange.range)} rounded-full transition-all group-hover:opacity-80`}
                                            style={{ width: `${(priceRange.revenue / maxPriceRangeRevenue) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>{priceRange.clicks} clicks • {priceRange.conversions} conv.</span>
                                        <span>CVR: {priceRange.cvr}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Top Performers */}
            {topPerformers.length > 0 && (
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Top Performing Products
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">#</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Product</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Clicks</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Conv.</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Revenue</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">CVR</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Avg Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPerformers.map((product, index) => (
                                    <tr
                                        key={product.productId}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <span className={`
                                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                                ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                  index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                  index === 2 ? 'bg-orange-700/20 text-orange-400' :
                                                  'bg-white/10 text-gray-400'}
                                            `}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-white text-sm line-clamp-1" title={product.title}>
                                                {product.title || product.productId}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-white font-mono text-sm">
                                                {product.clicks.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-white font-mono text-sm">{product.conversions}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-emerald-400 font-mono text-sm">
                                                €{product.revenue.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`font-mono text-sm ${
                                                product.cvr >= 3 ? 'text-emerald-400' :
                                                product.cvr >= 1 ? 'text-yellow-400' : 'text-gray-400'
                                            }`}>
                                                {product.cvr}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-white font-mono text-sm">
                                                €{product.avgPrice.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
