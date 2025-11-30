'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Tag,
    Plus,
    AlertCircle,
    Loader2,
    Star,
    Trash2,
    Edit3,
    X,
    Zap,
    Calendar,
    Link2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { API_BASE } from '@/lib/api/config';

interface AffiliateTag {
    id: string;
    tag: string;
    label: string;
    marketplace: string;
    isDefault: boolean;
    createdAt: string;
    usage: {
        automations: number;
        scheduledPosts: number;
        links: number;
        total: number;
    };
}

const MARKETPLACES = [
    { value: 'IT', label: 'Italia', flag: '🇮🇹' },
    { value: 'DE', label: 'Germania', flag: '🇩🇪' },
    { value: 'FR', label: 'Francia', flag: '🇫🇷' },
    { value: 'ES', label: 'Spagna', flag: '🇪🇸' },
    { value: 'UK', label: 'Regno Unito', flag: '🇬🇧' },
    { value: 'US', label: 'Stati Uniti', flag: '🇺🇸' },
];

export default function AffiliateTagsSettingsPage() {
    const t = useTranslations('affiliateTags');
    const tCommon = useTranslations('common');

    const [tags, setTags] = useState<AffiliateTag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<AffiliateTag | null>(null);
    const [tagToEdit, setTagToEdit] = useState<AffiliateTag | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [newTag, setNewTag] = useState({
        tag: '',
        label: '',
        marketplace: 'IT',
        isDefault: false,
    });

    const [editForm, setEditForm] = useState({
        label: '',
        marketplace: 'IT',
    });

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }
            const res = await fetch(`${API_BASE}/user/affiliate-tags`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTags(data.tags || []);
            }
        } catch (error) {
            console.error('Failed to fetch affiliate tags', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTag.tag || !newTag.label) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/affiliate-tags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTag)
            });

            if (res.ok) {
                setIsAddingTag(false);
                setNewTag({ tag: '', label: '', marketplace: 'IT', isDefault: false });
                fetchTags();
            } else {
                const error = await res.json();
                alert(error.message || 'Errore nella creazione del tag');
            }
        } catch (error) {
            console.error(error);
            alert('Errore di connessione');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetDefault = async (tagId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/affiliate-tags/${tagId}/default`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchTags();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!tagToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/affiliate-tags/${tagToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchTags();
                setTagToDelete(null);
            } else {
                const error = await res.json();
                alert(error.message || 'Impossibile eliminare il tag');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (tag: AffiliateTag) => {
        setTagToEdit(tag);
        setEditForm({
            label: tag.label,
            marketplace: tag.marketplace,
        });
    };

    const handleEditSave = async () => {
        if (!tagToEdit) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/affiliate-tags/${tagToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                fetchTags();
                setTagToEdit(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const getMarketplace = (code: string) => {
        return MARKETPLACES.find(m => m.value === code) || MARKETPLACES[0];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">{tCommon('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400">
                        {t('subtitle')}
                    </p>
                </div>
                <CyberButton onClick={() => setIsAddingTag(true)} variant="primary">
                    <Plus className="w-4 h-4" />
                    {t('addTag')}
                </CyberButton>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-300">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {t('infoBox')}
                </p>
            </div>

            {/* Add Tag Form */}
            {isAddingTag && (
                <GlassCard className="p-6 border-orange-500/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-400" />
                            {t('addNewTag')}
                        </h3>
                        <button
                            onClick={() => setIsAddingTag(false)}
                            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('form.tag')} *
                            </label>
                            <input
                                type="text"
                                value={newTag.tag}
                                onChange={(e) => setNewTag({ ...newTag, tag: e.target.value })}
                                placeholder="es: afflyt-21"
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm focus:border-orange-500 focus:outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-1">{t('form.tagHelp')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('form.label')} *
                            </label>
                            <input
                                type="text"
                                value={newTag.label}
                                onChange={(e) => setNewTag({ ...newTag, label: e.target.value })}
                                placeholder="es: Tag Principale"
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('form.marketplace')}
                            </label>
                            <select
                                value={newTag.marketplace}
                                onChange={(e) => setNewTag({ ...newTag, marketplace: e.target.value })}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                            >
                                {MARKETPLACES.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.flag} {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newTag.isDefault}
                                    onChange={(e) => setNewTag({ ...newTag, isDefault: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-300">{t('form.setAsDefault')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <CyberButton variant="ghost" onClick={() => setIsAddingTag(false)}>
                            {tCommon('cancel')}
                        </CyberButton>
                        <CyberButton
                            variant="primary"
                            onClick={handleCreateTag}
                            disabled={isSaving || !newTag.tag || !newTag.label}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('createTag')}
                        </CyberButton>
                    </div>
                </GlassCard>
            )}

            {/* Empty State */}
            {tags.length === 0 && !isAddingTag && (
                <GlassCard className="p-12 text-center">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('empty.title')}</h3>
                    <p className="text-gray-400 mb-6">{t('empty.description')}</p>
                    <CyberButton onClick={() => setIsAddingTag(true)} variant="primary">
                        <Plus className="w-4 h-4" />
                        {t('addTag')}
                    </CyberButton>
                </GlassCard>
            )}

            {/* Tags List */}
            {tags.length > 0 && (
                <div className="space-y-4">
                    {tags.map((tag) => {
                        const marketplace = getMarketplace(tag.marketplace);
                        return (
                            <GlassCard
                                key={tag.id}
                                className={`p-6 ${tag.isDefault ? 'border-orange-500/50' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tag.isDefault
                                                ? 'bg-orange-500/20 text-orange-400'
                                                : 'bg-afflyt-glass-white text-gray-400'
                                            }`}>
                                            {tag.isDefault ? (
                                                <Star className="w-6 h-6 fill-current" />
                                            ) : (
                                                <Tag className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-white">{tag.label}</h3>
                                                {tag.isDefault && (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">
                                                        DEFAULT
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <code className="text-sm text-orange-400 font-mono">{tag.tag}</code>
                                                <span className="text-gray-500">•</span>
                                                <span className="text-sm text-gray-400 flex items-center gap-1">
                                                    {marketplace.flag} {marketplace.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Usage Stats */}
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1 text-gray-400" title="Automazioni">
                                                <Zap className="w-4 h-4" />
                                                <span>{tag.usage.automations}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400" title="Post Programmati">
                                                <Calendar className="w-4 h-4" />
                                                <span>{tag.usage.scheduledPosts}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400" title="Link">
                                                <Link2 className="w-4 h-4" />
                                                <span>{tag.usage.links}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {!tag.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(tag.id)}
                                                    className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors text-gray-400 hover:text-orange-400"
                                                    title={t('setAsDefault')}
                                                >
                                                    <Star className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(tag)}
                                                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors text-gray-400 hover:text-white"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setTagToDelete(tag)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                                disabled={tag.usage.automations > 0 || tag.usage.scheduledPosts > 0}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={tagToDelete !== null}
                onClose={() => setTagToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={t('delete.title')}
                message={
                    tagToDelete ? (
                        <div className="space-y-2">
                            <p>{t('delete.aboutTo')}</p>
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <p className="font-semibold text-white">{tagToDelete.label}</p>
                                <p className="text-xs text-gray-400 font-mono">{tagToDelete.tag}</p>
                            </div>
                            {tagToDelete.usage.total > 0 && (
                                <p className="text-sm text-yellow-400">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    {t('delete.inUseWarning')}
                                </p>
                            )}
                        </div>
                    ) : ''
                }
                confirmText={t('delete.confirmButton')}
                cancelText={tCommon('cancel')}
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Edit Modal */}
            {tagToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-orange-400" />
                                {t('edit.title')}
                            </h3>
                            <button
                                onClick={() => setTagToEdit(null)}
                                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tag
                                </label>
                                <input
                                    type="text"
                                    value={tagToEdit.tag}
                                    disabled
                                    className="w-full px-4 py-3 bg-afflyt-dark-100 border border-afflyt-glass-border rounded-lg text-gray-500 font-mono text-sm cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('edit.tagCantChange')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('form.label')}
                                </label>
                                <input
                                    type="text"
                                    value={editForm.label}
                                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('form.marketplace')}
                                </label>
                                <select
                                    value={editForm.marketplace}
                                    onChange={(e) => setEditForm({ ...editForm, marketplace: e.target.value })}
                                    className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                                >
                                    {MARKETPLACES.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.flag} {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <CyberButton variant="ghost" onClick={() => setTagToEdit(null)}>
                                {tCommon('cancel')}
                            </CyberButton>
                            <CyberButton variant="primary" onClick={handleEditSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : tCommon('save')}
                            </CyberButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
