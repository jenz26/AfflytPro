'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface LockedFilterBadgeProps {
    requiredPlan: 'PRO' | 'BUSINESS';
}

export function LockedFilterBadge({ requiredPlan }: LockedFilterBadgeProps) {
    const t = useTranslations('automations.wizard');

    const colors = {
        PRO: 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400 border-afflyt-cyan-500/30',
        BUSINESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    return (
        <Link
            href="/dashboard/settings/billing"
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${colors[requiredPlan]} hover:opacity-80 transition-opacity`}
        >
            <Lock className="w-3 h-3" />
            {requiredPlan}
        </Link>
    );
}
