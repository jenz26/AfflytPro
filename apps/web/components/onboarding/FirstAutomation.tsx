'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Trophy,
    Clock,
    DollarSign,
    Target,
    Filter,
    Users,
    Play,
    CheckCircle,
    Loader2,
    TrendingUp,
    Zap,
    X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

interface AutomationTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'advanced';
    popularity: number;
    estimatedRevenue: string;
    schedule: string;
    minScore: number;
    categories: string; // JSON string
    maxPrice: number | null;
    successStories: string; // JSON string
}

interface FirstAutomationProps {
    onComplete: (automationId: string) => void;
    onSkip?: () => void;
}

export const FirstAutomation: React.FC<FirstAutomationProps> = ({ onComplete, onSkip }) => {
    const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch('${API_BASE}/automation/templates', {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            const data = await response.json();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createAutomation = async (templateId: string) => {
        try {
            setIsCreating(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch('${API_BASE}/automation/from-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ templateId })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.message || 'Failed to create automation');
            }

            const data = await response.json();
            onComplete(data.automation.id);
        } catch (error) {
            console.error('Failed to create automation:', error);
            alert(`Errore: ${error instanceof Error ? error.message : 'Failed to create automation'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const getDifficultyDots = (difficulty: string) => {
        const levels = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
        return [1, 2, 3].map((level) => (
            <div
                key={level}
                className={`w-2 h-2 rounded-full ${level <= levels ? 'bg-afflyt-cyan-400' : 'bg-gray-700'
                    }`}
            />
        ));
    };

    const getIconForCategory = (category: string) => {
        switch (category) {
            case 'popular':
                return Trophy;
            case 'scheduled':
                return Clock;
            case 'premium':
                return DollarSign;
            default:
                return Zap;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-afflyt-dark-100 to-afflyt-dark-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-afflyt-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Caricamento template...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-afflyt-dark-100 to-afflyt-dark-50 p-6">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-afflyt-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-afflyt-cyan-500/20 rounded-full text-afflyt-cyan-400 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Ultimo step! Sei quasi pronto</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4">
                        Scegli la tua Prima Automazione 🚀
                    </h1>
                    <p className="text-xl text-gray-300">
                        Inizia con un template testato da migliaia di utenti.
                        <br />
                        <span className="text-gray-400">Potrai personalizzarlo o crearne di nuovi dopo.</span>
                    </p>
                </motion.div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {templates.map((template, index) => {
                        const Icon = getIconForCategory(template.category);
                        const parsedCategories = JSON.parse(template.categories);
                        const parsedSuccessStories = JSON.parse(template.successStories);

                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`relative bg-afflyt-dark-50/80 backdrop-blur border-2 rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] ${selectedTemplate === template.id
                                        ? 'border-afflyt-cyan-500 shadow-lg shadow-afflyt-cyan-500/20'
                                        : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                {/* Popularity Badge */}
                                {template.popularity > 85 && (
                                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-xs font-bold">
                                        HOT 🔥
                                    </div>
                                )}

                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-afflyt-cyan-400/20 to-afflyt-cyan-600/20 rounded-xl flex items-center justify-center">
                                        <Icon className="w-7 h-7 text-afflyt-cyan-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Estimated Revenue */}
                                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <p className="text-xs text-green-400 mb-1">Revenue stimato</p>
                                    <p className="text-lg font-bold text-green-400">
                                        {template.estimatedRevenue}
                                    </p>
                                </div>

                                {/* Config Preview */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">{template.schedule.replace('0 ', 'Alle ').replace('*/6', 'Ogni 6 ore').replace('*/12', 'Ogni 12 ore')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Target className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">Score min: {template.minScore}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">
                                            {parsedCategories.slice(0, 2).join(', ')}
                                            {parsedCategories.length > 2 && ` +${parsedCategories.length - 2}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Difficulty & Popularity */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-1">
                                        {getDifficultyDots(template.difficulty)}
                                    </div>

                                    <div className="flex items-center gap-1 text-sm">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-400">{template.popularity}%</span>
                                    </div>
                                </div>

                                {/* Success Story */}
                                {parsedSuccessStories[0] && (
                                    <div className="pt-4 border-t border-gray-700">
                                        <p className="text-xs text-gray-500 mb-1">Success story</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">{parsedSuccessStories[0].user}</span>
                                            <span className="text-afflyt-cyan-400 font-bold">
                                                {parsedSuccessStories[0].value}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <AnimatePresence>
                    {selectedTemplate && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed bottom-0 left-0 right-0 bg-afflyt-dark-50/95 backdrop-blur-xl border-t border-gray-700 p-6 z-50"
                        >
                            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-white font-semibold mb-1">
                                        Template selezionato: {templates.find(t => t.id === selectedTemplate)?.name}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Puoi personalizzarlo dopo o usarlo così com'è
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    {onSkip && (
                                        <button
                                            onClick={onSkip}
                                            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                                        >
                                            Salta per ora
                                        </button>
                                    )}

                                    <button
                                        onClick={() => createAutomation(selectedTemplate)}
                                        disabled={isCreating}
                                        className="px-8 py-3 bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-afflyt-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Creazione...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Attiva Automazione
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
