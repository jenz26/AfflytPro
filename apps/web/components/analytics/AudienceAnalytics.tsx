'use client';

import { useTranslations } from 'next-intl';
import {
    Smartphone,
    Tablet,
    Monitor,
    Globe,
    Chrome,
    Users,
    Bot,
    Wifi,
    Languages,
    MapPin,
    Building2,
    Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

// ==================== TYPES ====================

interface DeviceData {
    device: string;
    count: number;
    percent: number;
}

interface BrowserData {
    browser: string;
    count: number;
    percent: number;
}

interface OSData {
    os: string;
    count: number;
    percent: number;
}

interface CountryData {
    code: string;
    name: string;
    count: number;
    percent: number;
}

interface RegionData {
    region: string;
    country: string;
    count: number;
    percent: number;
}

interface CityData {
    city: string;
    country: string;
    region: string;
    count: number;
    percent: number;
}

interface LanguageData {
    language: string;
    count: number;
    percent: number;
}

interface ConnectionData {
    type: string;
    count: number;
    percent: number;
}

interface VisitorStats {
    total: number;
    unique: number;
    returning: number;
    botClicks: number;
}

interface ScreenStats {
    mobile: number;
    tablet: number;
    desktop: number;
}

export interface AudienceData {
    devices: DeviceData[];
    browsers: BrowserData[];
    operatingSystems: OSData[];
    countries: CountryData[];
    regions: RegionData[];
    cities: CityData[];
    languages: LanguageData[];
    connections: ConnectionData[];
    visitors: VisitorStats;
    screens: ScreenStats;
    period: number;
}

interface AudienceAnalyticsProps {
    data: AudienceData | null;
    loading: boolean;
}

// ==================== HELPER COMPONENTS ====================

function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    color = 'cyan'
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    color?: 'cyan' | 'green' | 'purple' | 'orange' | 'red';
}) {
    const colorClasses = {
        cyan: 'from-afflyt-cyan-500/20 to-blue-500/10 border-afflyt-cyan-500/30 text-afflyt-cyan-400',
        green: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
        purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
        orange: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400',
        red: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400'
    };

    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${colorClasses[color].split(' ').pop()}`} />
                <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-xl font-bold text-white">{value}</p>
                    {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
                </div>
            </div>
        </div>
    );
}

function ProgressBar({
    label,
    value,
    percent,
    color = 'cyan',
    icon
}: {
    label: string;
    value: number;
    percent: number;
    color?: string;
    icon?: React.ReactNode;
}) {
    const colorClasses: Record<string, string> = {
        cyan: 'bg-afflyt-cyan-500',
        blue: 'bg-blue-500',
        green: 'bg-emerald-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
        red: 'bg-red-500',
        pink: 'bg-pink-500',
        yellow: 'bg-yellow-500'
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                    {icon}
                    {label}
                </span>
                <span className="text-gray-400">{value.toLocaleString()} ({percent}%)</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color] || colorClasses.cyan} transition-all duration-500`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
        </div>
    );
}

// Browser icon mapping
function getBrowserIcon(browser: string) {
    const b = browser.toLowerCase();
    if (b.includes('chrome')) return '🌐';
    if (b.includes('safari')) return '🧭';
    if (b.includes('firefox')) return '🦊';
    if (b.includes('edge')) return '🌊';
    if (b.includes('opera')) return '🔴';
    if (b.includes('samsung')) return '📱';
    return '🌐';
}

// OS icon mapping
function getOSIcon(os: string) {
    const o = os.toLowerCase();
    if (o.includes('windows')) return '🪟';
    if (o.includes('mac') || o.includes('ios')) return '🍎';
    if (o.includes('android')) return '🤖';
    if (o.includes('linux')) return '🐧';
    if (o.includes('chrome')) return '💻';
    return '💻';
}

// Language name mapping
function getLanguageName(code: string): string {
    const languages: Record<string, string> = {
        it: 'Italiano',
        en: 'English',
        de: 'Deutsch',
        fr: 'Français',
        es: 'Español',
        pt: 'Português',
        nl: 'Nederlands',
        pl: 'Polski',
        ru: 'Русский',
        ja: '日本語',
        zh: '中文',
        ko: '한국어',
        ar: 'العربية'
    };
    return languages[code] || code.toUpperCase();
}

// Country flag emoji from country code
function getCountryFlag(code: string): string {
    if (!code || code.length !== 2) return '🌍';
    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// ==================== MAIN COMPONENT ====================

export function AudienceAnalytics({ data, loading }: AudienceAnalyticsProps) {
    const t = useTranslations('analytics.audience');

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <GlassCard key={i} className="p-4 animate-pulse">
                            <div className="h-16 bg-white/10 rounded" />
                        </GlassCard>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <GlassCard key={i} className="p-6 animate-pulse">
                            <div className="h-64 bg-white/10 rounded" />
                        </GlassCard>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <GlassCard className="p-8 text-center">
                <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">{t('noData')}</p>
            </GlassCard>
        );
    }

    const totalScreens = data.screens.mobile + data.screens.tablet + data.screens.desktop;

    return (
        <div className="space-y-6">
            {/* Visitor Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label={t('stats.totalClicks')}
                    value={data.visitors.total.toLocaleString()}
                    color="cyan"
                />
                <StatCard
                    icon={Users}
                    label={t('stats.uniqueVisitors')}
                    value={data.visitors.unique.toLocaleString()}
                    subValue={`${data.visitors.total > 0 ? Math.round((data.visitors.unique / data.visitors.total) * 100) : 0}% ${t('stats.ofTotal')}`}
                    color="green"
                />
                <StatCard
                    icon={Users}
                    label={t('stats.returningVisitors')}
                    value={data.visitors.returning.toLocaleString()}
                    color="purple"
                />
                <StatCard
                    icon={Bot}
                    label={t('stats.botClicks')}
                    value={data.visitors.botClicks.toLocaleString()}
                    subValue={t('stats.filtered')}
                    color="red"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Distribution */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-afflyt-cyan-400" />
                        {t('devices.title')}
                    </h3>

                    {/* Device Icons Summary */}
                    <div className="flex items-center justify-around mb-6 p-4 bg-white/5 rounded-xl">
                        <div className="text-center">
                            <Smartphone className="w-8 h-8 text-afflyt-cyan-400 mx-auto mb-1" />
                            <p className="text-lg font-bold text-white">{data.screens.mobile}</p>
                            <p className="text-xs text-gray-500">Mobile</p>
                        </div>
                        <div className="text-center">
                            <Tablet className="w-8 h-8 text-purple-400 mx-auto mb-1" />
                            <p className="text-lg font-bold text-white">{data.screens.tablet}</p>
                            <p className="text-xs text-gray-500">Tablet</p>
                        </div>
                        <div className="text-center">
                            <Monitor className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                            <p className="text-lg font-bold text-white">{data.screens.desktop}</p>
                            <p className="text-xs text-gray-500">Desktop</p>
                        </div>
                    </div>

                    {/* Device Progress Bars */}
                    <div className="space-y-3">
                        {data.devices.map((d, i) => (
                            <ProgressBar
                                key={d.device}
                                label={d.device.charAt(0).toUpperCase() + d.device.slice(1)}
                                value={d.count}
                                percent={d.percent}
                                color={['cyan', 'purple', 'green', 'orange'][i] || 'cyan'}
                            />
                        ))}
                    </div>
                </GlassCard>

                {/* Geographic Distribution */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-400" />
                        {t('geography.title')}
                    </h3>

                    {data.countries.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('geography.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.countries.slice(0, 8).map((country, i) => (
                                <ProgressBar
                                    key={country.code}
                                    label={`${getCountryFlag(country.code)} ${country.name}`}
                                    value={country.count}
                                    percent={country.percent}
                                    color={['green', 'cyan', 'blue', 'purple', 'orange', 'pink', 'yellow', 'red'][i] || 'cyan'}
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Browser Distribution */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Chrome className="w-5 h-5 text-blue-400" />
                        {t('browsers.title')}
                    </h3>

                    {data.browsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Chrome className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('browsers.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.browsers.map((b, i) => (
                                <ProgressBar
                                    key={b.browser}
                                    label={b.browser}
                                    value={b.count}
                                    percent={b.percent}
                                    color={['blue', 'orange', 'red', 'green', 'purple', 'cyan'][i] || 'cyan'}
                                    icon={<span className="text-sm">{getBrowserIcon(b.browser)}</span>}
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Operating System Distribution */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-purple-400" />
                        {t('os.title')}
                    </h3>

                    {data.operatingSystems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('os.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.operatingSystems.map((os, i) => (
                                <ProgressBar
                                    key={os.os}
                                    label={os.os}
                                    value={os.count}
                                    percent={os.percent}
                                    color={['purple', 'blue', 'green', 'orange', 'cyan', 'pink'][i] || 'cyan'}
                                    icon={<span className="text-sm">{getOSIcon(os.os)}</span>}
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Languages */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Languages className="w-5 h-5 text-orange-400" />
                        {t('languages.title')}
                    </h3>

                    {data.languages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('languages.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.languages.map((lang, i) => (
                                <ProgressBar
                                    key={lang.language}
                                    label={getLanguageName(lang.language)}
                                    value={lang.count}
                                    percent={lang.percent}
                                    color={['orange', 'yellow', 'green', 'blue', 'purple', 'cyan'][i] || 'cyan'}
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Top Cities */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-pink-400" />
                        {t('cities.title')}
                    </h3>

                    {data.cities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('cities.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.cities.slice(0, 8).map((city, i) => (
                                <ProgressBar
                                    key={`${city.country}:${city.city}`}
                                    label={`${getCountryFlag(city.country)} ${city.city}`}
                                    value={city.count}
                                    percent={city.percent}
                                    color={['pink', 'purple', 'blue', 'cyan', 'green', 'orange', 'yellow', 'red'][i] || 'cyan'}
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Connection Types */}
            {data.connections.length > 0 && (
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-cyan-400" />
                        {t('connections.title')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {data.connections.map(conn => (
                            <div
                                key={conn.type}
                                className="p-4 bg-white/5 rounded-xl text-center"
                            >
                                <p className="text-2xl font-bold text-white">{conn.count}</p>
                                <p className="text-sm text-gray-400">{conn.type}</p>
                                <p className="text-xs text-gray-500">{conn.percent}%</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
