'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = () => {
        const newLocale = locale === 'it' ? 'en' : 'it';
        // Replace the locale in the pathname
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname);
    };

    return (
        <button
            onClick={switchLocale}
            className="flex items-center gap-2 px-3 py-2 hover:bg-afflyt-glass-white rounded-lg transition-colors group"
            title={locale === 'it' ? 'Switch to English' : 'Passa a Italiano'}
        >
            <Globe className="w-4 h-4 text-gray-400 group-hover:text-afflyt-cyan-400 transition-colors" />
            <span className="text-sm font-mono text-gray-400 group-hover:text-afflyt-cyan-400 uppercase transition-colors">
                {locale === 'it' ? 'IT' : 'EN'}
            </span>
        </button>
    );
};
