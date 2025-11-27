'use client';

import { Sparkles, Bot, Wand2 } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { TemplateCard, AUTOMATION_TEMPLATES, AutomationTemplate } from './TemplateCard';

interface EmptyStateProps {
    onCreateClick: () => void;
    onTemplateSelect: (template: AutomationTemplate) => void;
}

export const EmptyState = ({ onCreateClick, onTemplateSelect }: EmptyStateProps) => {
    return (
        <div className="py-12">
            {/* Hero Section */}
            <div className="text-center mb-10">
                {/* Animated Icon */}
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-afflyt-cyan-500/20 blur-3xl animate-pulse" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-2xl flex items-center justify-center">
                        <Bot className="w-10 h-10 text-afflyt-dark-100" />
                    </div>
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-white mb-2">
                    Il tuo esercito di bot è pronto!
                </h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                    Crea la tua prima automazione per trovare deal mentre dormi, lavori o guardi Netflix.
                </p>
            </div>

            {/* Templates Section */}
            <div className="max-w-3xl mx-auto mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-afflyt-cyan-400" />
                        Inizia con un Template
                    </h3>
                    <span className="text-xs text-gray-500">Configurazione in 2 click</span>
                </div>

                <div className="space-y-3">
                    {AUTOMATION_TEMPLATES.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onSelect={onTemplateSelect}
                        />
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 max-w-3xl mx-auto mb-8">
                <div className="flex-1 h-px bg-afflyt-glass-border" />
                <span className="text-sm text-gray-500">oppure</span>
                <div className="flex-1 h-px bg-afflyt-glass-border" />
            </div>

            {/* Custom CTA */}
            <div className="text-center">
                <CyberButton variant="secondary" onClick={onCreateClick}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Crea Automazione Personalizzata
                </CyberButton>
                <p className="text-xs text-gray-500 mt-2">
                    Configura ogni parametro manualmente
                </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                    <div className="text-3xl font-bold text-afflyt-cyan-400 font-mono mb-1">10</div>
                    <div className="text-sm text-gray-500">Max Automazioni</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-afflyt-plasma-400 font-mono mb-1">24/7</div>
                    <div className="text-sm text-gray-500">Sempre Attivo</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-afflyt-profit-400 font-mono mb-1">∞</div>
                    <div className="text-sm text-gray-500">Deal Pubblicabili</div>
                </div>
            </div>
        </div>
    );
};
