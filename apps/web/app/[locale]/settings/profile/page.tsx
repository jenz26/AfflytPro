'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    User,
    Mail,
    Building2,
    Save,
    Check,
    Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

export default function ProfilePage() {
    const t = useTranslations('settings.profile');
    const tCommon = useTranslations('common');

    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    // Mock user data - will be replaced with real API data
    const [formData, setFormData] = useState({
        // Personal Info
        fullName: 'Marco Rossi',
        email: 'marco@contindigital.it',
        language: 'it',
        timezone: 'Europe/Rome',

        // Billing Info
        companyName: 'Contin Digital SRL',
        vatNumber: 'IT12345678901',
        fiscalCode: 'RSSMRC85A01H501Z',
        address: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20121',
        country: 'IT',
        pec: 'contindigital@pec.it',
        sdiCode: 'XXXXXXX',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
    };

    return (
        <div className="max-w-4xl space-y-8">
            {/* Personal Information */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('personalInfo')}</h3>
                        <p className="text-sm text-gray-500">{t('personalInfoDesc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('fullName')}
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('email')}
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-3 bg-afflyt-dark-50/50 border border-afflyt-glass-border rounded-lg text-gray-500 cursor-not-allowed"
                            />
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t('emailLocked')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('language')}
                        </label>
                        <select
                            value={formData.language}
                            onChange={(e) => handleChange('language', e.target.value)}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        >
                            <option value="it">Italiano</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('timezone')}
                        </label>
                        <select
                            value={formData.timezone}
                            onChange={(e) => handleChange('timezone', e.target.value)}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        >
                            <option value="Europe/Rome">Europe/Rome (CET)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        </select>
                    </div>
                </div>
            </GlassCard>

            {/* Billing Information */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-afflyt-profit-400/20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-afflyt-profit-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('billingInfo')}</h3>
                        <p className="text-sm text-gray-500">{t('billingInfoDesc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('companyName')}
                        </label>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            placeholder={t('companyNamePlaceholder')}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder-gray-600 focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('vatNumber')}
                        </label>
                        <input
                            type="text"
                            value={formData.vatNumber}
                            onChange={(e) => handleChange('vatNumber', e.target.value)}
                            placeholder="IT12345678901"
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono placeholder-gray-600 focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('fiscalCode')}
                        </label>
                        <input
                            type="text"
                            value={formData.fiscalCode}
                            onChange={(e) => handleChange('fiscalCode', e.target.value.toUpperCase())}
                            placeholder="RSSMRC85A01H501Z"
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono placeholder-gray-600 focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('address')}
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder={t('addressPlaceholder')}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder-gray-600 focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('city')}
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('postalCode')}
                        </label>
                        <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => handleChange('postalCode', e.target.value)}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('pec')} <span className="text-gray-500">({tCommon('optional')})</span>
                        </label>
                        <input
                            type="email"
                            value={formData.pec}
                            onChange={(e) => handleChange('pec', e.target.value)}
                            placeholder="azienda@pec.it"
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder-gray-600 focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('sdiCode')} <span className="text-gray-500">({tCommon('optional')})</span>
                        </label>
                        <input
                            type="text"
                            value={formData.sdiCode}
                            onChange={(e) => handleChange('sdiCode', e.target.value.toUpperCase())}
                            placeholder="XXXXXXX"
                            maxLength={7}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono placeholder-gray-600 focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
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
