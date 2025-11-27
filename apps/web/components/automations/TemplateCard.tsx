'use client';

import { Smartphone, ShoppingBag, Home, Sparkles, TrendingUp, Clock } from 'lucide-react';

export interface AutomationTemplate {
    id: string;
    name: string;
    description: string;
    icon: 'tech' | 'fashion' | 'home';
    categories: string[];
    minScore: number;
    maxPrice?: number;
    expectedDeals: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    popular?: boolean;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
    {
        id: 'tech-deals',
        name: 'Tech Deals Under €100',
        description: 'Trova i migliori deal di elettronica e computer con alto sconto',
        icon: 'tech',
        categories: ['Electronics', 'Computers'],
        minScore: 65,
        maxPrice: 100,
        expectedDeals: '~15-20/giorno',
        difficulty: 'beginner',
        popular: true,
    },
    {
        id: 'fashion-flash',
        name: 'Fashion Flash Sales',
        description: 'Offerte moda con sconti superiori al 40%',
        icon: 'fashion',
        categories: ['Fashion', 'Beauty'],
        minScore: 60,
        maxPrice: 80,
        expectedDeals: '~20-30/giorno',
        difficulty: 'beginner',
    },
    {
        id: 'home-bestsellers',
        name: 'Home & Kitchen Bestsellers',
        description: 'Prodotti casa più venduti con recensioni top',
        icon: 'home',
        categories: ['Home'],
        minScore: 75,
        maxPrice: 150,
        expectedDeals: '~8-12/giorno',
        difficulty: 'intermediate',
    },
];

interface TemplateCardProps {
    template: AutomationTemplate;
    onSelect: (template: AutomationTemplate) => void;
}

export const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
    const getIcon = () => {
        switch (template.icon) {
            case 'tech':
                return <Smartphone className="w-6 h-6" />;
            case 'fashion':
                return <ShoppingBag className="w-6 h-6" />;
            case 'home':
                return <Home className="w-6 h-6" />;
        }
    };

    const getDifficultyBadge = () => {
        switch (template.difficulty) {
            case 'beginner':
                return { label: 'Principiante', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
            case 'intermediate':
                return { label: 'Intermedio', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
            case 'advanced':
                return { label: 'Avanzato', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
        }
    };

    const badge = getDifficultyBadge();

    return (
        <button
            onClick={() => onSelect(template)}
            className="group relative w-full text-left p-5 bg-afflyt-glass-white border border-afflyt-glass-border rounded-xl hover:border-afflyt-cyan-500/50 hover:bg-afflyt-cyan-500/5 transition-all duration-300"
        >
            {/* Popular Badge */}
            {template.popular && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-afflyt-cyan-500 to-blue-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    POPOLARE
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400/20 to-afflyt-cyan-600/20 border border-afflyt-cyan-500/30 rounded-lg flex items-center justify-center text-afflyt-cyan-400 group-hover:from-afflyt-cyan-400/30 group-hover:to-afflyt-cyan-600/30 transition-all">
                    {getIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white group-hover:text-afflyt-cyan-300 transition-colors">
                            {template.name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                            <TrendingUp className="w-3 h-3 text-afflyt-cyan-400" />
                            <span>{template.expectedDeals}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3 text-afflyt-cyan-400" />
                            <span>Score {template.minScore}+</span>
                        </div>
                        {template.maxPrice && (
                            <span className="text-gray-500">Max €{template.maxPrice}</span>
                        )}
                    </div>

                    {/* Difficulty Badge */}
                    <div className="mt-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="self-center text-gray-600 group-hover:text-afflyt-cyan-400 group-hover:translate-x-1 transition-all">
                    →
                </div>
            </div>
        </button>
    );
};
