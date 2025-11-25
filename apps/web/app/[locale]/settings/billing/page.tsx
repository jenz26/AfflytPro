'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    CreditCard,
    Check,
    Zap,
    Download,
    ExternalLink,
    AlertCircle,
    Crown,
    Rocket,
    Building2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    ttlLimit: number;
    highlighted?: boolean;
    current?: boolean;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
}

export default function BillingPage() {
    const t = useTranslations('settings.billing');

    const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

    // Mock data
    const currentPlan: Plan = {
        id: 'pro',
        name: 'PRO',
        price: 49,
        interval: 'month',
        features: [],
        ttlLimit: 1000,
        current: true,
    };

    const usage = {
        ttl: 847,
        ttlLimit: 1000,
        channels: 3,
        channelsLimit: 10,
        automations: 12,
        automationsLimit: 50,
    };

    const plans: Plan[] = [
        {
            id: 'free',
            name: 'FREE',
            price: 0,
            interval: 'month',
            ttlLimit: 100,
            features: [
                t('plans.free.feature1'),
                t('plans.free.feature2'),
                t('plans.free.feature3'),
            ],
        },
        {
            id: 'pro',
            name: 'PRO',
            price: billingCycle === 'month' ? 49 : 39,
            interval: billingCycle,
            ttlLimit: 1000,
            features: [
                t('plans.pro.feature1'),
                t('plans.pro.feature2'),
                t('plans.pro.feature3'),
                t('plans.pro.feature4'),
            ],
            highlighted: true,
            current: true,
        },
        {
            id: 'enterprise',
            name: 'ENTERPRISE',
            price: billingCycle === 'month' ? 199 : 159,
            interval: billingCycle,
            ttlLimit: 10000,
            features: [
                t('plans.enterprise.feature1'),
                t('plans.enterprise.feature2'),
                t('plans.enterprise.feature3'),
                t('plans.enterprise.feature4'),
                t('plans.enterprise.feature5'),
            ],
        },
    ];

    const paymentMethods = [
        {
            id: '1',
            type: 'visa',
            last4: '4242',
            expiry: '12/2026',
            isDefault: true,
        },
    ];

    const invoices: Invoice[] = [
        { id: 'INV-2024-011', date: '2024-11-15', amount: 49, status: 'paid' },
        { id: 'INV-2024-010', date: '2024-10-15', amount: 49, status: 'paid' },
        { id: 'INV-2024-009', date: '2024-09-15', amount: 49, status: 'paid' },
        { id: 'INV-2024-008', date: '2024-08-15', amount: 49, status: 'paid' },
    ];

    const usagePercentage = (usage.ttl / usage.ttlLimit) * 100;

    return (
        <div className="space-y-8">
            {/* Current Plan & Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Plan */}
                <GlassCard className="p-6 border-afflyt-profit-400/30">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">
                                {t('currentPlan')}
                            </div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-white">{currentPlan.name}</h2>
                                <Crown className="w-6 h-6 text-afflyt-profit-400" />
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white font-mono">
                                €{currentPlan.price}
                            </div>
                            <div className="text-sm text-gray-500">/{t('month')}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-afflyt-dark-50 rounded-lg">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-400">{t('nextRenewal')}</span>
                                <span className="text-white font-medium">15 Dec 2024</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">{t('paymentMethod')}</span>
                                <span className="text-white font-medium">Visa •••• 4242</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <CyberButton variant="secondary" size="sm" className="flex-1">
                                {t('managePlan')}
                            </CyberButton>
                            <CyberButton variant="ghost" size="sm">
                                {t('cancelPlan')}
                            </CyberButton>
                        </div>
                    </div>
                </GlassCard>

                {/* Usage Stats */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">{t('usageThisMonth')}</h3>

                    <div className="space-y-6">
                        {/* TTL Usage */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">{t('ttlCredits')}</span>
                                <span className="text-white font-mono">
                                    {usage.ttl.toLocaleString()} / {usage.ttlLimit.toLocaleString()}
                                </span>
                            </div>
                            <div className="h-3 bg-afflyt-dark-50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        usagePercentage > 90
                                            ? 'bg-red-500'
                                            : usagePercentage > 70
                                            ? 'bg-yellow-500'
                                            : 'bg-afflyt-cyan-500'
                                    }`}
                                    style={{ width: `${usagePercentage}%` }}
                                />
                            </div>
                            {usagePercentage > 80 && (
                                <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {t('approachingLimit')}
                                </p>
                            )}
                        </div>

                        {/* Other Usage */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg">
                                <div className="text-2xl font-bold text-afflyt-cyan-400 font-mono">
                                    {usage.channels}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {t('channels')} ({usage.channelsLimit} max)
                                </div>
                            </div>
                            <div className="p-4 bg-afflyt-dark-50 rounded-lg">
                                <div className="text-2xl font-bold text-afflyt-profit-400 font-mono">
                                    {usage.automations}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {t('automations')} ({usage.automationsLimit} max)
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Available Plans */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">{t('availablePlans')}</h3>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center gap-2 p-1 bg-afflyt-dark-50 rounded-lg">
                        <button
                            onClick={() => setBillingCycle('month')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                billingCycle === 'month'
                                    ? 'bg-afflyt-cyan-500 text-afflyt-dark-100'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t('monthly')}
                        </button>
                        <button
                            onClick={() => setBillingCycle('year')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                billingCycle === 'year'
                                    ? 'bg-afflyt-cyan-500 text-afflyt-dark-100'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t('yearly')}
                            <span className="px-1.5 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs rounded">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-6 rounded-xl border transition-all ${
                                plan.highlighted
                                    ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/5'
                                    : 'border-afflyt-glass-border bg-afflyt-dark-50/50'
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-afflyt-cyan-500 text-afflyt-dark-100 text-xs font-bold rounded-full">
                                        {t('popular')}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4">
                                    {plan.id === 'free' && (
                                        <Zap className="w-6 h-6 text-gray-400" />
                                    )}
                                    {plan.id === 'pro' && (
                                        <Rocket className="w-6 h-6 text-afflyt-cyan-400" />
                                    )}
                                    {plan.id === 'enterprise' && (
                                        <Building2 className="w-6 h-6 text-afflyt-profit-400" />
                                    )}
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-white font-mono">
                                        €{plan.price}
                                    </span>
                                    <span className="text-gray-500">/{t(plan.interval)}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-2">
                                    {plan.ttlLimit.toLocaleString()} {t('ttlMonth')}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-afflyt-profit-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {plan.current ? (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-lg bg-afflyt-glass-white text-gray-400 font-medium"
                                >
                                    {t('currentPlanBtn')}
                                </button>
                            ) : (
                                <CyberButton
                                    variant={plan.highlighted ? 'primary' : 'secondary'}
                                    className="w-full justify-center"
                                >
                                    {plan.price === 0 ? t('downgrade') : t('upgrade')}
                                </CyberButton>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Payment Methods */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">{t('paymentMethods')}</h3>
                    <CyberButton variant="secondary" size="sm">
                        {t('addPaymentMethod')}
                    </CyberButton>
                </div>

                <div className="space-y-4">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            className="flex items-center justify-between p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-white font-medium">
                                        {method.type.toUpperCase()} •••• {method.last4}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {t('expires')} {method.expiry}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {method.isDefault && (
                                    <span className="px-2 py-1 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-medium rounded">
                                        {t('default')}
                                    </span>
                                )}
                                <button className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('remove')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Invoice History */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">{t('invoiceHistory')}</h3>
                    <button className="text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors flex items-center gap-1">
                        {t('viewAll')}
                        <ExternalLink className="w-3 h-3" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 border-b border-afflyt-glass-border">
                                <th className="pb-3 font-medium">{t('invoice')}</th>
                                <th className="pb-3 font-medium">{t('date')}</th>
                                <th className="pb-3 font-medium">{t('amount')}</th>
                                <th className="pb-3 font-medium">{t('status')}</th>
                                <th className="pb-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-afflyt-glass-border">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="py-4 text-white font-mono text-sm">
                                        {invoice.id}
                                    </td>
                                    <td className="py-4 text-gray-400">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 text-white font-mono">
                                        €{invoice.amount.toFixed(2)}
                                    </td>
                                    <td className="py-4">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded ${
                                                invoice.status === 'paid'
                                                    ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400'
                                                    : invoice.status === 'pending'
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}
                                        >
                                            {t(`invoiceStatus.${invoice.status}`)}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <button className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors">
                                            <Download className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
