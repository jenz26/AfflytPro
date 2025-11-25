'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Bell,
    Mail,
    Smartphone,
    Monitor,
    Clock,
    Save,
    Check,
    Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface NotificationSettings {
    email: {
        newDeal: boolean;
        automationError: boolean;
        monthlyReport: boolean;
        weeklyDigest: boolean;
        promotional: boolean;
    };
    inApp: {
        realTimeAlerts: boolean;
        ttlWarnings: boolean;
        apiKeyExpiration: boolean;
    };
    push: {
        enabled: boolean;
    };
    digest: {
        frequency: 'daily' | 'weekly' | 'never';
        time: string;
    };
}

export default function NotificationsPage() {
    const t = useTranslations('settings.notifications');
    const tCommon = useTranslations('common');

    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    const [settings, setSettings] = useState<NotificationSettings>({
        email: {
            newDeal: true,
            automationError: true,
            monthlyReport: true,
            weeklyDigest: false,
            promotional: false,
        },
        inApp: {
            realTimeAlerts: true,
            ttlWarnings: true,
            apiKeyExpiration: true,
        },
        push: {
            enabled: false,
        },
        digest: {
            frequency: 'daily',
            time: '09:00',
        },
    });

    const handleEmailToggle = (key: keyof typeof settings.email) => {
        setSettings(prev => ({
            ...prev,
            email: { ...prev.email, [key]: !prev.email[key] }
        }));
    };

    const handleInAppToggle = (key: keyof typeof settings.inApp) => {
        setSettings(prev => ({
            ...prev,
            inApp: { ...prev.inApp, [key]: !prev.inApp[key] }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-afflyt-cyan-500' : 'bg-afflyt-dark-50'
            }`}
        >
            <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
        </button>
    );

    return (
        <div className="max-w-3xl space-y-8">
            {/* Email Notifications */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('email.title')}</h3>
                        <p className="text-sm text-gray-500">{t('email.description')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {Object.entries(settings.email).map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg"
                        >
                            <div>
                                <div className="text-white font-medium">
                                    {t(`email.options.${key}.title`)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {t(`email.options.${key}.description`)}
                                </div>
                            </div>
                            <Toggle
                                enabled={value}
                                onChange={() => handleEmailToggle(key as keyof typeof settings.email)}
                            />
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* In-App Notifications */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-afflyt-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-afflyt-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('inApp.title')}</h3>
                        <p className="text-sm text-gray-500">{t('inApp.description')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {Object.entries(settings.inApp).map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg"
                        >
                            <div>
                                <div className="text-white font-medium">
                                    {t(`inApp.options.${key}.title`)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {t(`inApp.options.${key}.description`)}
                                </div>
                            </div>
                            <Toggle
                                enabled={value}
                                onChange={() => handleInAppToggle(key as keyof typeof settings.inApp)}
                            />
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Push Notifications */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('push.title')}</h3>
                        <p className="text-sm text-gray-500">{t('push.description')}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                    <div>
                        <div className="text-white font-medium">
                            {t('push.enable')}
                        </div>
                        <div className="text-sm text-gray-500">
                            {t('push.enableDescription')}
                        </div>
                    </div>
                    <Toggle
                        enabled={settings.push.enabled}
                        onChange={() => setSettings(prev => ({
                            ...prev,
                            push: { enabled: !prev.push.enabled }
                        }))}
                    />
                </div>

                {!settings.push.enabled && (
                    <div className="mt-4 p-4 bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border">
                        <p className="text-sm text-gray-400">
                            {t('push.notEnabled')}
                        </p>
                        <CyberButton variant="secondary" size="sm" className="mt-3">
                            {t('push.connectDevice')}
                        </CyberButton>
                    </div>
                )}
            </GlassCard>

            {/* Digest Settings */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-afflyt-profit-400/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-afflyt-profit-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('digest.title')}</h3>
                        <p className="text-sm text-gray-500">{t('digest.description')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('digest.frequency')}
                        </label>
                        <select
                            value={settings.digest.frequency}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                digest: { ...prev.digest, frequency: e.target.value as any }
                            }))}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        >
                            <option value="daily">{t('digest.frequencies.daily')}</option>
                            <option value="weekly">{t('digest.frequencies.weekly')}</option>
                            <option value="never">{t('digest.frequencies.never')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('digest.time')}
                        </label>
                        <input
                            type="time"
                            value={settings.digest.time}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                digest: { ...prev.digest, time: e.target.value }
                            }))}
                            disabled={settings.digest.frequency === 'never'}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors disabled:opacity-50"
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
                {showSaved && (
                    <div className="flex items-center gap-2 text-afflyt-profit-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">{t('saved')}</span>
                    </div>
                )}
                <CyberButton
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {t('saveChanges')}
                </CyberButton>
            </div>
        </div>
    );
}
