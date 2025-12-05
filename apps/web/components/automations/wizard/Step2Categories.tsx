'use client';

import { useTranslations } from 'next-intl';
import { Target, Lock, AlertTriangle, Tag, TrendingDown, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

type DealPublishMode = 'DISCOUNTED_ONLY' | 'LOWEST_PRICE' | 'BOTH';

interface Category {
    id: string;
    name: string;
    nameEN: string;
    isGated: boolean;
    avgDiscount: string;
    priceRange: string;
    competition: string;
}

interface Step2CategoriesProps {
    selected: string[];
    categories: Category[];
    maxCategories: number;
    dealPublishMode: DealPublishMode;
    onChange: (categories: string[]) => void;
    onDealModeChange: (mode: DealPublishMode) => void;
}

const categoryEmojis: Record<string, string> = {
    // Updated to match new Keepa category names
    'Moda': '👗',
    'Casa e cucina': '🏠',
    'Auto e Moto': '🚗',
    'Fai da te': '🔧',
    'Libri': '📚',
    'Elettronica': '📱',
    'Sport e tempo libero': '⚽',
    'Giardino e giardinaggio': '🌿',
    'Commercio, Industria e Scienza': '🏭',
    'Informatica': '💻',
    'Prodotti per animali domestici': '🐾',
    'Giochi e giocattoli': '🧸',
    'Bellezza': '💄',
    'Cancelleria e prodotti per ufficio': '📎',
    'Salute e cura della persona': '💊',
    'Illuminazione': '💡',
    'Prima infanzia': '👶',
    'Strumenti musicali': '🎸',
    'Grandi elettrodomestici': '🧺',
    'Alimentari e cura della casa': '🍕',
    'Videogiochi': '🎮',
    'Musica Digitale': '🎵',
    'CD e Vinili': '💿',
    'Film e TV': '🎬',
    'Dispositivi Amazon e Accessori': '📦',
};

function getCompetitionColor(competition: string): string {
    switch (competition) {
        case 'low': return 'text-green-400';
        case 'medium': return 'text-yellow-400';
        case 'high': return 'text-orange-400';
        case 'very-high': return 'text-red-400';
        default: return 'text-gray-400';
    }
}

export function Step2Categories({
    selected,
    categories,
    maxCategories,
    dealPublishMode,
    onChange,
    onDealModeChange
}: Step2CategoriesProps) {
    const t = useTranslations('automations.wizard.step2');

    const toggleCategory = (categoryId: string) => {
        if (selected.includes(categoryId)) {
            onChange(selected.filter(id => id !== categoryId));
        } else if (selected.length < maxCategories) {
            onChange([...selected, categoryId]);
        }
    };

    const isMaxReached = selected.length >= maxCategories;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('title')}</h3>
                    <p className="text-sm text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Selection Counter */}
            <div className={`p-3 rounded-lg ${
                isMaxReached
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30'
            }`}>
                <div className="flex items-center justify-between">
                    <span className={`text-sm ${isMaxReached ? 'text-yellow-300' : 'text-afflyt-cyan-300'}`}>
                        {t('selectedCount', { count: selected.length })}
                    </span>
                    <span className={`text-sm font-mono ${isMaxReached ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {selected.length}/{maxCategories}
                    </span>
                </div>
                {isMaxReached && (
                    <p className="text-xs text-yellow-400 mt-1">
                        {t('maxReached', { max: maxCategories })}
                    </p>
                )}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => {
                    const isSelected = selected.includes(category.id);
                    const isDisabled = !isSelected && isMaxReached;
                    const emoji = categoryEmojis[category.name] || '📦';

                    return (
                        <button
                            key={category.id}
                            onClick={() => !isDisabled && toggleCategory(category.id)}
                            disabled={isDisabled}
                            className={`relative p-4 rounded-lg border transition-all text-left ${
                                isSelected
                                    ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40'
                                    : isDisabled
                                        ? 'bg-afflyt-dark-100/50 border-afflyt-glass-border opacity-50 cursor-not-allowed'
                                        : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-afflyt-cyan-500/30'
                            }`}
                        >
                            {/* Gated Badge */}
                            {category.isGated && (
                                <div className="absolute top-2 right-2">
                                    <Lock className="w-3 h-3 text-yellow-500" />
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{emoji}</span>
                                <span className={`text-sm font-medium ${
                                    isSelected ? 'text-white' : 'text-gray-300'
                                }`}>
                                    {category.name}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Sconto medio</span>
                                    <span className="text-emerald-400">{category.avgDiscount}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Competizione</span>
                                    <span className={getCompetitionColor(category.competition)}>
                                        {category.competition}
                                    </span>
                                </div>
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-2 left-2 w-5 h-5 bg-afflyt-cyan-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Deal Publish Mode */}
            <div className="space-y-3 pt-4 border-t border-afflyt-glass-border">
                <label className="block text-sm font-medium text-gray-300">
                    {t('dealMode.title')}
                </label>
                <div className="space-y-2">
                    {/* Discounted Only */}
                    <button
                        type="button"
                        onClick={() => onDealModeChange('DISCOUNTED_ONLY')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            dealPublishMode === 'DISCOUNTED_ONLY'
                                ? 'bg-green-500/10 border-green-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-green-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dealPublishMode === 'DISCOUNTED_ONLY' ? 'bg-green-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Tag className={`w-5 h-5 ${dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-green-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${dealPublishMode === 'DISCOUNTED_ONLY' ? 'text-white' : 'text-gray-300'}`}>
                                    {t('dealMode.discountedOnly')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('dealMode.discountedOnlyDesc')}
                                </p>
                            </div>
                            {dealPublishMode === 'DISCOUNTED_ONLY' && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Lowest Price */}
                    <button
                        type="button"
                        onClick={() => onDealModeChange('LOWEST_PRICE')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            dealPublishMode === 'LOWEST_PRICE'
                                ? 'bg-blue-500/10 border-blue-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-blue-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dealPublishMode === 'LOWEST_PRICE' ? 'bg-blue-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <TrendingDown className={`w-5 h-5 ${dealPublishMode === 'LOWEST_PRICE' ? 'text-blue-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${dealPublishMode === 'LOWEST_PRICE' ? 'text-white' : 'text-gray-300'}`}>
                                    {t('dealMode.lowestPrice')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('dealMode.lowestPriceDesc')}
                                </p>
                            </div>
                            {dealPublishMode === 'LOWEST_PRICE' && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Both */}
                    <button
                        type="button"
                        onClick={() => onDealModeChange('BOTH')}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${
                            dealPublishMode === 'BOTH'
                                ? 'bg-purple-500/10 border-purple-500/40'
                                : 'bg-afflyt-glass-white border-afflyt-glass-border hover:border-purple-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dealPublishMode === 'BOTH' ? 'bg-purple-500/20' : 'bg-afflyt-dark-100'
                            }`}>
                                <Zap className={`w-5 h-5 ${dealPublishMode === 'BOTH' ? 'text-purple-400' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${dealPublishMode === 'BOTH' ? 'text-white' : 'text-gray-300'}`}>
                                    {t('dealMode.both')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('dealMode.bothDesc')}
                                </p>
                            </div>
                            {dealPublishMode === 'BOTH' && (
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-afflyt-dark-100 font-bold">✓</span>
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Gated Categories Warning */}
            {categories.some(c => c.isGated) && (
                <GlassCard className="p-4 bg-yellow-500/5 border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-300 mb-1">Categorie con restrizioni</p>
                            <p className="text-gray-400">
                                Le categorie con <Lock className="inline w-3 h-3 text-yellow-500" /> richiedono approvazione Amazon per vendere.
                                Puoi comunque promuovere prodotti come affiliato.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
