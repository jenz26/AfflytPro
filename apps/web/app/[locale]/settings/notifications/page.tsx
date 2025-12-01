'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Mail,
    Clock,
    Save,
    Check,
    Loader2,
    Send,
    AlertCircle,
    Globe,
    Smartphone
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

interface EmailPreferences {
    weeklyReport: boolean;
    dailyDigest: boolean;
    automationAlerts: boolean;
    dealDigest: 'realtime' | 'hourly' | 'daily' | 'off';
    marketing: boolean;
    timezone: string;
}

interface LastSent {
    weeklyReport: string | null;
    dailyDigest: string | null;
}

const TIMEZONES = [
    'Europe/Rome',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
];

export default function NotificationsPage() {
    const t = useTranslations('settings.notifications');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sendingTest, setSendingTest] = useState<'weekly' | 'daily' | null>(null);
    const [testSent, setTestSent] = useState<'weekly' | 'daily' | null>(null);

    const [preferences, setPreferences] = useState<EmailPreferences>({
        weeklyReport: true,
        dailyDigest: false,
        automationAlerts: true,
        dealDigest: 'off',
        marketing: true,
        timezone: 'Europe/Rome',
    });

    const [lastSent, setLastSent] = useState<LastSent>({
        weeklyReport: null,
        dailyDigest: null,
    });

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/notifications/preferences`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    throw new Error('Failed to load preferences');
                }

                const data = await res.json();
                setPreferences(data.preferences);
                setLastSent(data.lastSent);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading preferences');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreferences();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/notifications/preferences`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences),
            });

            if (!res.ok) {
                throw new Error('Failed to save preferences');
            }

            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error saving preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTestEmail = async (type: 'weekly' | 'daily') => {
        setSendingTest(type);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const endpoint = type === 'weekly'
                ? '/api/notifications/test/weekly-report'
                : '/api/notifications/test/daily-summary';

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to send test ${type} email`);
            }

            setTestSent(type);
            setTimeout(() => setTestSent(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error sending test email');
        } finally {
            setSendingTest(null);
        }
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

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return t('never');
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-afflyt-cyan-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-8">
            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                </div>
            )}

            {/* Email Reports */}
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
                    {/* Weekly Report */}
                    <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                        <div className="flex-1">
                            <div className="text-white font-medium">Weekly Performance Report</div>
                            <div className="text-sm text-gray-500">
                                Receive a weekly summary of your affiliate performance every Monday
                            </div>
                            {lastSent.weeklyReport && (
                                <div className="text-xs text-gray-600 mt-1">
                                    Last sent: {formatDate(lastSent.weeklyReport)}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <CyberButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendTestEmail('weekly')}
                                disabled={sendingTest !== null}
                            >
                                {sendingTest === 'weekly' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : testSent === 'weekly' ? (
                                    <Check className="w-4 h-4 text-afflyt-profit-400" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Test
                            </CyberButton>
                            <Toggle
                                enabled={preferences.weeklyReport}
                                onChange={() => setPreferences(prev => ({
                                    ...prev,
                                    weeklyReport: !prev.weeklyReport
                                }))}
                            />
                        </div>
                    </div>

                    {/* Daily Digest */}
                    <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                        <div className="flex-1">
                            <div className="text-white font-medium">Daily Summary</div>
                            <div className="text-sm text-gray-500">
                                Get a daily email with your performance highlights
                            </div>
                            {lastSent.dailyDigest && (
                                <div className="text-xs text-gray-600 mt-1">
                                    Last sent: {formatDate(lastSent.dailyDigest)}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <CyberButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendTestEmail('daily')}
                                disabled={sendingTest !== null}
                            >
                                {sendingTest === 'daily' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : testSent === 'daily' ? (
                                    <Check className="w-4 h-4 text-afflyt-profit-400" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Test
                            </CyberButton>
                            <Toggle
                                enabled={preferences.dailyDigest}
                                onChange={() => setPreferences(prev => ({
                                    ...prev,
                                    dailyDigest: !prev.dailyDigest
                                }))}
                            />
                        </div>
                    </div>

                    {/* Automation Alerts */}
                    <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                        <div>
                            <div className="text-white font-medium">Automation Alerts</div>
                            <div className="text-sm text-gray-500">
                                Get notified when automations fail or need attention
                            </div>
                        </div>
                        <Toggle
                            enabled={preferences.automationAlerts}
                            onChange={() => setPreferences(prev => ({
                                ...prev,
                                automationAlerts: !prev.automationAlerts
                            }))}
                        />
                    </div>

                    {/* Marketing */}
                    <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                        <div>
                            <div className="text-white font-medium">Product Updates & Tips</div>
                            <div className="text-sm text-gray-500">
                                Receive news about new features and affiliate marketing tips
                            </div>
                        </div>
                        <Toggle
                            enabled={preferences.marketing}
                            onChange={() => setPreferences(prev => ({
                                ...prev,
                                marketing: !prev.marketing
                            }))}
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Deal Notifications */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-afflyt-profit-400/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-afflyt-profit-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Deal Digest Frequency</h3>
                        <p className="text-sm text-gray-500">How often would you like to receive deal notifications?</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['realtime', 'hourly', 'daily', 'off'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => setPreferences(prev => ({ ...prev, dealDigest: option }))}
                            className={`p-4 rounded-lg border transition-all ${
                                preferences.dealDigest === option
                                    ? 'bg-afflyt-cyan-500/20 border-afflyt-cyan-500 text-afflyt-cyan-400'
                                    : 'bg-afflyt-dark-50/50 border-afflyt-glass-border text-gray-400 hover:border-gray-500'
                            }`}
                        >
                            <div className="font-medium capitalize">
                                {option === 'off' ? 'Disabled' : option}
                            </div>
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Push Notifications - Coming Soon */}
            <GlassCard className="p-6 opacity-60">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
                            <span className="px-2 py-0.5 text-xs font-medium bg-afflyt-cyan-500/20 text-afflyt-cyan-400 rounded-full">
                                Prossimamente
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Notifiche push sul tuo dispositivo mobile</p>
                    </div>
                </div>

                <div className="p-4 bg-afflyt-dark-50/50 rounded-lg border border-dashed border-afflyt-glass-border">
                    <p className="text-sm text-gray-500 text-center">
                        Le notifiche push saranno disponibili in un prossimo aggiornamento.
                        Potrai ricevere alert in tempo reale direttamente sul tuo smartphone.
                    </p>
                </div>
            </GlassCard>

            {/* Timezone */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Timezone</h3>
                        <p className="text-sm text-gray-500">Set your timezone for scheduled email delivery</p>
                    </div>
                </div>

                <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        timezone: e.target.value
                    }))}
                    className="w-full md:w-1/2 px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                >
                    {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                    ))}
                </select>
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
