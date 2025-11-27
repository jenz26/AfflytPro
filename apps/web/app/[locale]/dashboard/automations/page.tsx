'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Zap,
    Plus,
    Grid3x3,
    List,
    Activity,
    RefreshCw,
    Search
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RuleCard } from '@/components/automations/RuleCard';
import { CreateRuleWizard } from '@/components/automations/CreateRuleWizard';
import { EmptyState } from '@/components/automations/EmptyState';
import { TemplateWizard } from '@/components/automations/TemplateWizard';
import { AutomationTemplate } from '@/components/automations/TemplateCard';
import { API_BASE } from '@/lib/api/config';

interface AutomationRule {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    categories: string;
    minScore: number;
    maxPrice?: number;
    channelId?: string;
    channel?: {
        name: string;
    };
    totalRuns: number;
    lastRunAt?: string;
    stats?: {
        dealsFound: number;
        dealsPublished: number;
        conversionRate: number;
        revenue: number;
    };
    status?: 'idle' | 'running' | 'error';
}

export default function AutomationStudioPage() {
    const t = useTranslations('automations');
    const tDelete = useTranslations('automations.deleteModal');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showWizard, setShowWizard] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'paused'>('all');
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/automation/rules`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setRules(data.rules || []);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async (ruleData: any) => {
        try {
            const token = localStorage.getItem('token');

            // If editing, use PUT instead of POST
            if (editingRule) {
                const response = await fetch(`${API_BASE}/automation/rules/${editingRule.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: ruleData.name,
                        description: ruleData.description,
                        isActive: ruleData.isActive,
                        minScore: ruleData.minScore,
                        maxPrice: ruleData.maxPrice,
                        channelId: ruleData.channelId
                    })
                });

                if (response.ok) {
                    setShowWizard(false);
                    setEditingRule(null);
                    fetchRules();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to update rule');
                }
            } else {
                // Create new rule
                // Convert categories array to JSON string if needed
                const categoriesData = Array.isArray(ruleData.categories)
                    ? JSON.stringify(ruleData.categories)
                    : ruleData.categories;

                const response = await fetch(`${API_BASE}/automation/rules`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...ruleData,
                        categories: categoriesData,
                        triggers: [{ type: 'SCHEDULE', config: {} }],
                        actions: [{ type: 'PUBLISH_CHANNEL', config: {}, order: 1 }]
                    })
                });

                if (response.ok) {
                    setShowWizard(false);
                    setSelectedTemplate(null);
                    fetchRules();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to create rule');
                }
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
            alert('Failed to save rule');
        }
    };

    const handleToggle = async (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/automation/rules/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !rule.isActive })
            });
            fetchRules();
        } catch (error) {
            console.error('Failed to toggle rule:', error);
        }
    };

    const handleTest = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/automation/rules/${id}/run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();

            alert(t('testSuccess', {
                processed: result.dealsProcessed,
                published: result.dealsPublished,
                time: result.executionTime
            }));

            fetchRules();
        } catch (error) {
            console.error('Failed to run rule:', error);
            alert(t('testError'));
        }
    };

    const handleQuickEdit = async (id: string, updates: { minScore?: number; maxPrice?: number }) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/automation/rules/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            fetchRules();
        } catch (error) {
            console.error('Failed to quick edit rule:', error);
        }
    };

    const handleDeleteClick = (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;
        setRuleToDelete(rule);
    };

    const handleDeleteConfirm = async () => {
        if (!ruleToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/automation/rules/${ruleToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchRules();
            setRuleToDelete(null);
        } catch (error) {
            console.error('Failed to delete rule:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;

        setEditingRule(rule);
        setShowWizard(true);
    };

    const handleDuplicate = async (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/automation/rules`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `${rule.name}${t('duplicateSuffix')}`,
                    description: rule.description,
                    categories: JSON.parse(rule.categories),
                    minScore: rule.minScore,
                    maxPrice: rule.maxPrice,
                    channelId: rule.channelId,
                    isActive: false,
                    triggers: [{ type: 'SCHEDULE', config: {} }],
                    actions: [{ type: 'PUBLISH_CHANNEL', config: {}, order: 1 }]
                })
            });

            if (response.ok) {
                fetchRules();
            }
        } catch (error) {
            console.error('Failed to duplicate rule:', error);
        }
    };

    const activeRulesCount = rules.filter(r => r.isActive).length;
    const maxRules = 10;

    const filteredRules = rules.filter(rule => {
        if (filterActive === 'active') return rule.isActive;
        if (filterActive === 'paused') return !rule.isActive;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-afflyt-dark-100">
            {/* Header */}
            <div className="px-8 py-6 border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <Zap className="w-6 h-6 text-afflyt-dark-100" />
                            </div>
                            {t('title')}
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* System Status */}
                    <div className="flex items-center gap-4">
                        <GlassCard className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-afflyt-cyan-400" />
                                <div>
                                    <p className="text-xs text-gray-500">{t('system')}</p>
                                    <p className="text-sm font-mono text-white">{t('operational')}</p>
                                </div>
                                <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-3">
                        {/* Create Button */}
                        <CyberButton
                            variant="primary"
                            onClick={() => setShowWizard(true)}
                            disabled={activeRulesCount >= maxRules}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('newMission')}
                        </CyberButton>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-1 p-1 bg-afflyt-glass-white rounded-lg">
                            {['all', 'active', 'paused'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterActive(filter as any)}
                                    className={`px-3 py-1.5 rounded text-sm transition-all ${filterActive === filter
                                        ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {t(`filters.${filter}` as any)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                className="pl-10 pr-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-afflyt-glass-white rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded transition-all ${viewMode === 'grid'
                                    ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded transition-all ${viewMode === 'list'
                                    ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Usage Bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">{t('activeMissions')}</span>
                        <span className="font-mono text-white">
                            {activeRulesCount}/{maxRules}
                        </span>
                    </div>
                    <div className="h-2 bg-afflyt-dark-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${activeRulesCount / maxRules > 0.8
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                : 'bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400'
                                }`}
                            style={{ width: `${(activeRulesCount / maxRules) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8">
                {filteredRules.length === 0 ? (
                    <EmptyState
                        onCreateClick={() => setShowWizard(true)}
                        onTemplateSelect={(template) => setSelectedTemplate(template)}
                    />
                ) : (
                    <div className={`grid gap-6 ${viewMode === 'grid'
                        ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1'
                        }`}>
                        {filteredRules.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                onToggle={handleToggle}
                                onTest={handleTest}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                                onDuplicate={handleDuplicate}
                                onQuickEdit={handleQuickEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Wizard Modal */}
            {showWizard && (
                <CreateRuleWizard
                    editingRule={editingRule}
                    onComplete={handleCreateRule}
                    onCancel={() => {
                        setShowWizard(false);
                        setEditingRule(null);
                    }}
                />
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={ruleToDelete !== null}
                onClose={() => setRuleToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={tDelete('title')}
                message={
                    ruleToDelete ? (
                        <div className="space-y-2">
                            <p>{tDelete('description')}</p>
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <p className="font-semibold text-white">{ruleToDelete.name}</p>
                                {ruleToDelete.description && (
                                    <p className="text-xs text-gray-400 mt-1">{ruleToDelete.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {ruleToDelete.channel?.name || tDelete('noChannel')} • {tDelete('minScore')} {ruleToDelete.minScore}
                                </p>
                            </div>
                            <p className="text-sm text-red-300">
                                {tDelete('warning')}
                            </p>
                        </div>
                    ) : ''
                }
                confirmText={tDelete('confirmButton')}
                cancelText={tDelete('cancelButton')}
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Template Wizard Modal */}
            {selectedTemplate && (
                <TemplateWizard
                    template={selectedTemplate}
                    onComplete={handleCreateRule}
                    onCancel={() => setSelectedTemplate(null)}
                />
            )}
        </div>
    );
}
