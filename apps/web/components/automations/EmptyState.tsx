'use client';

import { Sparkles, Zap, Bot } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';

interface EmptyStateProps {
    onCreateClick: () => void;
}

export const EmptyState = ({ onCreateClick }: EmptyStateProps) => {
    return (
        <div className="text-center py-20">
            {/* Animated Icon */}
            <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-afflyt-cyan-500/20 blur-3xl animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-2xl flex items-center justify-center">
                    <Bot className="w-12 h-12 text-afflyt-dark-100" />
                </div>
            </div>

            {/* Text */}
            <h2 className="text-2xl font-bold text-white mb-2">
                Il tuo Command Center è pronto
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Crea la tua prima missione di automazione e lascia che gli agenti trovino i migliori deal 24/7
            </p>

            {/* CTA */}
            <CyberButton variant="primary" size="lg" onClick={onCreateClick}>
                <Sparkles className="w-5 h-5 mr-2" />
                Inizia Prima Missione
            </CyberButton>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div>
                    <div className="text-3xl font-bold text-afflyt-cyan-400 font-mono mb-1">10</div>
                    <div className="text-sm text-gray-500">Max Rules</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-afflyt-plasma-400 font-mono mb-1">24/7</div>
                    <div className="text-sm text-gray-500">Auto Execution</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-afflyt-profit-400 font-mono mb-1">∞</div>
                    <div className="text-sm text-gray-500">Deals Published</div>
                </div>
            </div>
        </div>
    );
};
