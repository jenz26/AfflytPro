'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Shield,
    Key,
    Smartphone,
    Monitor,
    Globe,
    LogOut,
    AlertTriangle,
    Download,
    Trash2,
    Check,
    Eye,
    EyeOff
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Session {
    id: string;
    device: string;
    browser: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
}

export default function SecurityPage() {
    const t = useTranslations('settings.security');
    const tCommon = useTranslations('common');

    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Mock sessions data
    const sessions: Session[] = [
        {
            id: '1',
            device: 'Windows PC',
            browser: 'Chrome',
            location: 'Milan, IT',
            ip: '93.xxx.xxx.xxx',
            lastActive: 'Just now',
            current: true,
        },
        {
            id: '2',
            device: 'iPhone 15',
            browser: 'Safari',
            location: 'Milan, IT',
            ip: '93.xxx.xxx.xxx',
            lastActive: '2 hours ago',
            current: false,
        },
        {
            id: '3',
            device: 'MacBook Pro',
            browser: 'Firefox',
            location: 'Rome, IT',
            ip: '85.xxx.xxx.xxx',
            lastActive: '3 days ago',
            current: false,
        },
    ];

    const twoFactorEnabled = false;
    const lastPasswordChange = '45 days ago';

    const handlePasswordChange = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert(t('password.mismatch'));
            return;
        }
        // TODO: Implement password change API
        alert(t('password.changed'));
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleRevokeSession = (sessionId: string) => {
        // TODO: Implement session revocation
        console.log('Revoke session:', sessionId);
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsDeleting(false);
        setShowDeleteModal(false);
        // TODO: Implement account deletion
    };

    const getDeviceIcon = (device: string) => {
        if (device.includes('iPhone') || device.includes('Android')) {
            return Smartphone;
        }
        return Monitor;
    };

    return (
        <div className="max-w-3xl space-y-8">
            {/* Password Section */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('password.title')}</h3>
                        <p className="text-sm text-gray-500">
                            {t('password.lastChanged', { time: lastPasswordChange })}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('password.current')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('password.new')}
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('password.confirm')}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <CyberButton
                        variant="secondary"
                        onClick={handlePasswordChange}
                        disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    >
                        {t('password.change')}
                    </CyberButton>
                </div>
            </GlassCard>

            {/* Two-Factor Authentication */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-afflyt-profit-400/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-afflyt-profit-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('twoFactor.title')}</h3>
                        <p className="text-sm text-gray-500">{t('twoFactor.description')}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${twoFactorEnabled ? 'bg-afflyt-profit-400' : 'bg-gray-600'}`} />
                        <div>
                            <div className="text-white font-medium">
                                {t('twoFactor.status')}
                            </div>
                            <div className="text-sm text-gray-500">
                                {twoFactorEnabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
                            </div>
                        </div>
                    </div>
                    <CyberButton variant={twoFactorEnabled ? 'ghost' : 'primary'} size="sm">
                        {twoFactorEnabled ? t('twoFactor.disable') : t('twoFactor.enable')}
                    </CyberButton>
                </div>

                {!twoFactorEnabled && (
                    <p className="mt-4 text-sm text-yellow-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {t('twoFactor.recommendation')}
                    </p>
                )}
            </GlassCard>

            {/* Active Sessions */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{t('sessions.title')}</h3>
                            <p className="text-sm text-gray-500">{t('sessions.description')}</p>
                        </div>
                    </div>
                    <CyberButton variant="ghost" size="sm">
                        <LogOut className="w-4 h-4" />
                        {t('sessions.revokeAll')}
                    </CyberButton>
                </div>

                <div className="space-y-4">
                    {sessions.map((session) => {
                        const DeviceIcon = getDeviceIcon(session.device);

                        return (
                            <div
                                key={session.id}
                                className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-afflyt-glass-white rounded-lg flex items-center justify-center">
                                        <DeviceIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">
                                                {session.browser} on {session.device}
                                            </span>
                                            {session.current && (
                                                <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-medium rounded">
                                                    {t('sessions.current')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span>{session.location}</span>
                                            <span>•</span>
                                            <span>{session.ip}</span>
                                            <span>•</span>
                                            <span>{session.lastActive}</span>
                                        </div>
                                    </div>
                                </div>
                                {!session.current && (
                                    <button
                                        onClick={() => handleRevokeSession(session.id)}
                                        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        {t('sessions.revoke')}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard className="p-6 border-red-500/30">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('danger.title')}</h3>
                        <p className="text-sm text-gray-500">{t('danger.description')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Export Data */}
                    <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                        <div>
                            <div className="text-white font-medium">{t('danger.export.title')}</div>
                            <div className="text-sm text-gray-500">{t('danger.export.description')}</div>
                        </div>
                        <CyberButton variant="secondary" size="sm">
                            <Download className="w-4 h-4" />
                            {t('danger.export.button')}
                        </CyberButton>
                    </div>

                    {/* Delete Account */}
                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                        <div>
                            <div className="text-white font-medium">{t('danger.delete.title')}</div>
                            <div className="text-sm text-red-300">{t('danger.delete.description')}</div>
                        </div>
                        <CyberButton
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('danger.delete.button')}
                        </CyberButton>
                    </div>
                </div>
            </GlassCard>

            {/* Delete Account Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title={t('danger.delete.modal.title')}
                message={
                    <div className="space-y-3">
                        <p>{t('danger.delete.modal.warning')}</p>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>{t('danger.delete.modal.item1')}</li>
                            <li>{t('danger.delete.modal.item2')}</li>
                            <li>{t('danger.delete.modal.item3')}</li>
                        </ul>
                        <p className="text-red-300 font-medium">{t('danger.delete.modal.final')}</p>
                    </div>
                }
                confirmText={t('danger.delete.modal.confirm')}
                cancelText={tCommon('cancel')}
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
