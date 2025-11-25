'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Key,
    Plus,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    Shield,
    Bot,
    ShoppingBag,
    Lock
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { API_BASE } from '@/lib/api/config';

interface Credential {
    id: string;
    label: string;
    provider: string;
    maskedKey: string;
    createdAt: string;
    status: 'active' | 'inactive';
}

export default function ApiKeysPage() {
    const t = useTranslations('settings.credentials');
    const tCommon = useTranslations('common');

    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState<Credential | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newCredential, setNewCredential] = useState({
        provider: '',
        label: '',
        key: ''
    });

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_BASE}/user/credentials`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCredentials(data.map((d: any) => ({
                    ...d,
                    status: 'active'
                })));
            }
        } catch (error) {
            console.error('Failed to fetch credentials', error);
        }
    };

    const handleAddCredential = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCredential)
            });

            if (res.ok) {
                setIsAddingNew(false);
                setNewCredential({ provider: '', label: '', key: '' });
                fetchCredentials();
            } else {
                alert(t('saveFailed'));
            }
        } catch (error) {
            console.error(error);
            alert(t('connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (cred: Credential) => {
        setCredentialToDelete(cred);
    };

    const handleDeleteConfirm = async () => {
        if (!credentialToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/user/credentials/${credentialToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchCredentials();
                setCredentialToDelete(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const credentialTypes = [
        {
            type: 'TELEGRAM_BOT',
            label: t('types.telegram'),
            icon: Bot,
            description: t('telegramDesc'),
            placeholder: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz...'
        },
        {
            type: 'AMAZON_TAG',
            label: t('types.amazon'),
            icon: ShoppingBag,
            description: t('amazonDesc'),
            placeholder: 'mytag-21'
        }
    ];

    const getIcon = (provider: string) => {
        switch (provider) {
            case 'TELEGRAM_BOT': return Bot;
            case 'AMAZON_TAG': return ShoppingBag;
            default: return Key;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-afflyt-cyan-400" />
                    <span className="text-sm text-gray-400">{t('secureVaultDesc')}</span>
                </div>
                <CyberButton onClick={() => setIsAddingNew(true)} variant="primary">
                    <Plus className="w-4 h-4" />
                    {t('addCredential')}
                </CyberButton>
            </div>

            {/* Add New Credential Form */}
            {isAddingNew && (
                <GlassCard className="p-6 border-afflyt-cyan-500/40">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {t('addCredential')}
                    </h3>

                    {/* Type Selection */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {credentialTypes.map((type) => (
                            <button
                                key={type.type}
                                onClick={() => setNewCredential({ ...newCredential, provider: type.type })}
                                className={`p-4 rounded-lg border transition-all ${newCredential.provider === type.type
                                        ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40 text-white'
                                        : 'bg-afflyt-glass-white border-afflyt-glass-border text-gray-400 hover:border-afflyt-cyan-500/20'
                                    }`}
                            >
                                <type.icon className="w-6 h-6 mx-auto mb-2" />
                                <p className="text-sm font-medium">{type.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Selected Type Details */}
                    {newCredential.provider && (
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('nameLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={newCredential.label}
                                        onChange={(e) => setNewCredential({ ...newCredential, label: e.target.value })}
                                        placeholder={t('namePlaceholder')}
                                        className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('valueLabel')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={newCredential.key}
                                            onChange={(e) => setNewCredential({ ...newCredential, key: e.target.value })}
                                            placeholder={credentialTypes.find(ct => ct.type === newCredential.provider)?.placeholder}
                                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50"
                                        />
                                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <CyberButton variant="primary" className="flex-1" onClick={handleAddCredential}>
                                    {isLoading ? t('saving') : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            {t('save')}
                                        </>
                                    )}
                                </CyberButton>
                                <CyberButton
                                    variant="ghost"
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setNewCredential({ provider: '', label: '', key: '' });
                                    }}
                                >
                                    {tCommon('cancel')}
                                </CyberButton>
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Credentials List */}
            <div className="space-y-4">
                {credentials.map((cred) => {
                    const Icon = getIcon(cred.provider);
                    return (
                        <GlassCard key={cred.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-afflyt-cyan-400" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white">
                                                {cred.label || cred.provider}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cred.status === 'active'
                                                    ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400'
                                                    : 'bg-yellow-400/20 text-yellow-400'
                                                }`}>
                                                {cred.status === 'active' ? t('statusActive') : t('statusInactive')}
                                            </span>
                                        </div>

                                        {/* Value Display */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <code className="flex-1 px-3 py-2 bg-afflyt-dark-50 rounded text-sm font-mono text-gray-400">
                                                {cred.maskedKey}
                                            </code>

                                            <button
                                                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors cursor-not-allowed opacity-50"
                                                title={t('decryptionHint')}
                                            >
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            </button>

                                            <button
                                                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                                                onClick={() => navigator.clipboard.writeText(cred.maskedKey)}
                                            >
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>{t('typeLabel')}: {cred.provider.replace('_', ' ').toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{t('createdLabel')}: {new Date(cred.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" onClick={() => handleDeleteClick(cred)}>
                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    )
                })}
                {credentials.length === 0 && !isAddingNew && (
                    <GlassCard className="p-12 text-center">
                        <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">{t('noCredentials')}</h3>
                        <p className="text-gray-500 mb-6">{t('noCredentialsDesc')}</p>
                        <CyberButton variant="primary" onClick={() => setIsAddingNew(true)}>
                            <Plus className="w-4 h-4" />
                            {t('addFirst')}
                        </CyberButton>
                    </GlassCard>
                )}
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={credentialToDelete !== null}
                onClose={() => setCredentialToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={t('deleteTitle')}
                message={
                    credentialToDelete ? (
                        <div className="space-y-2">
                            <p>{t('deleteAboutTo')}</p>
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <p className="font-semibold text-white">{credentialToDelete.label || credentialToDelete.provider}</p>
                                <p className="text-xs text-gray-400">{credentialToDelete.provider} • {credentialToDelete.maskedKey}</p>
                            </div>
                            <p className="text-sm text-red-300">
                                {t('deleteWarning')}
                            </p>
                        </div>
                    ) : ''
                }
                confirmText={t('deleteConfirmButton')}
                cancelText={tCommon('cancel')}
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
