'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
    LayoutDashboard,
    TrendingUp,
    Zap,
    Send,
    Settings,
    Search,
    Menu,
    X,
    Bell,
    HelpCircle,
    ChevronDown,
    Flame,
    User,
    LogOut,
    CreditCard,
    Sparkles
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useOperatingSystem, getModifierKey } from '@/hooks/useOperatingSystem';
import { API_BASE } from '@/lib/api/config';

interface UserProfile {
    name: string | null;
    email: string;
    plan: string;
}

export const CommandBar = () => {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('navigation');
    const tBrand = useTranslations('brand');
    const os = useOperatingSystem();
    const modKey = getModifierKey(os);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [onboardingCompleted, setOnboardingCompleted] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Fetch user profile on mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserProfile(data.user);
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };

        fetchUserProfile();
    }, []);

    // Check if onboarding is completed
    useEffect(() => {
        const checkOnboardingStatus = () => {
            if (typeof window !== 'undefined') {
                const completed = localStorage.getItem('onboarding_completed');
                setOnboardingCompleted(completed === 'true');
            }
        };
        checkOnboardingStatus();
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut for command palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Logout handler
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Call backend logout endpoint (optional, for audit logging)
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => { /* Ignore errors - we're logging out anyway */ });
            }
        } finally {
            // Clear all auth-related data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login
            window.location.href = `/${locale}/auth/login`;
        }
    };

    const navItems = [
        {
            icon: LayoutDashboard,
            label: t('dashboard'),
            path: `/${locale}/dashboard`,
            shortcut: '⌘D'
        },
        {
            icon: TrendingUp,
            label: t('dealFinder'),
            path: `/${locale}/dashboard/deals`,
            shortcut: '⌘F',
            hot: true,
            badge: '12'
        },
        {
            icon: Zap,
            label: t('automations'),
            path: `/${locale}/dashboard/automations`,
            shortcut: '⌘A',
            badge: '3'
        },
        {
            icon: Send,
            label: t('channels'),
            path: `/${locale}/dashboard/channels`,
            shortcut: '⌘C'
        }
    ];

    // Get user initials for avatar
    const getInitials = (): string => {
        if (!userProfile) return '?';
        if (userProfile.name) {
            const parts = userProfile.name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return userProfile.name.substring(0, 2).toUpperCase();
        }
        return userProfile.email.substring(0, 2).toUpperCase();
    };

    // Get display name
    const getDisplayName = (): string => {
        if (!userProfile) return 'User';
        if (userProfile.name) {
            const parts = userProfile.name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0]} ${parts[1][0]}.`;
            }
            return userProfile.name;
        }
        return userProfile.email.split('@')[0];
    };

    // Live account data
    const accountStatus = {
        notifications: 2
    };

    return (
        <>
            {/* Desktop Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-afflyt-dark-50/95 backdrop-blur-xl border-b border-afflyt-glass-border z-50 hidden lg:block">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Left Section: Brand + Status */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,229,224,0.3)]">
                                <span className="text-afflyt-dark-100 font-bold text-xl">A</span>
                            </div>
                            <span className="text-white font-bold text-lg">{tBrand('name')}</span>
                        </Link>

                        {/* System Status */}
                        <div className="flex items-center gap-2 px-3">
                            <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                            <span className="text-xs text-afflyt-profit-400">{t('live')}</span>
                        </div>

                        {/* Onboarding Button - Show if not completed */}
                        {!onboardingCompleted && (
                            <Link
                                href={`/${locale}/onboarding`}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-afflyt-cyan-500/20 to-afflyt-plasma-500/20 border border-afflyt-cyan-500/40 rounded-lg hover:border-afflyt-cyan-500/60 transition-all group"
                            >
                                <Sparkles className="w-4 h-4 text-afflyt-cyan-400 group-hover:animate-pulse" />
                                <span className="text-sm text-afflyt-cyan-300 font-medium">{t('completeSetup')}</span>
                            </Link>
                        )}
                    </div>

                    {/* Center: Main Navigation */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`relative px-4 py-2 rounded-lg transition-all group ${isActive
                                        ? 'bg-afflyt-cyan-500/10 text-afflyt-cyan-300'
                                        : 'text-gray-400 hover:text-white hover:bg-afflyt-glass-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{item.label}</span>

                                        {item.hot && (
                                            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                                        )}

                                        {item.badge && (
                                            <span className="px-1.5 py-0.5 bg-afflyt-cyan-500/20 text-afflyt-cyan-300 text-[10px] font-mono rounded">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>

                                    {isActive && (
                                        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-afflyt-cyan-400 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Global Search / Command Palette */}
                        <button
                            onClick={() => setCommandPaletteOpen(true)}
                            className="px-3 py-1.5 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg hover:border-afflyt-cyan-500/40 transition-all flex items-center gap-2 group"
                        >
                            <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-afflyt-cyan-400" />
                            <span className="text-sm text-gray-300">{t('search')}</span>
                            <div className="flex items-center gap-1 ml-8">
                                <kbd className="px-1.5 py-0.5 bg-afflyt-dark-50 rounded text-[10px] text-gray-500 font-mono">{modKey}</kbd>
                                <kbd className="px-1.5 py-0.5 bg-afflyt-dark-50 rounded text-[10px] text-gray-500 font-mono">K</kbd>
                            </div>
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors">
                            <Bell className="w-4 h-4 text-gray-400" />
                            {accountStatus.notifications > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-afflyt-cyan-500 text-afflyt-dark-100 text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {accountStatus.notifications}
                                </span>
                            )}
                        </button>

                        {/* Language Switcher */}
                        <LanguageSwitcher />

                        {/* Help */}
                        <Link
                            href={`/${locale}/help`}
                            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors group"
                            title={t('help')}
                        >
                            <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-afflyt-cyan-400 transition-colors" />
                        </Link>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-xl shadow-xl overflow-hidden z-50">
                                    {/* User Info */}
                                    <div className="p-4 border-b border-afflyt-glass-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {getInitials()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{getDisplayName()}</p>
                                                <p className="text-xs text-gray-500">{userProfile?.email || ''}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-semibold rounded">
                                                {userProfile?.plan?.toUpperCase() || 'FREE'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link
                                            href={`/${locale}/settings/profile`}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-afflyt-glass-white rounded-lg transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            <span className="text-sm">{t('profile')}</span>
                                        </Link>
                                        <Link
                                            href={`/${locale}/settings/billing`}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-afflyt-glass-white rounded-lg transition-colors"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-sm">{t('billing')}</span>
                                        </Link>
                                        <Link
                                            href={`/${locale}/settings`}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-afflyt-glass-white rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span className="text-sm">{t('settings')}</span>
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <div className="p-2 border-t border-afflyt-glass-border">
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">{t('logout')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-afflyt-dark-50/95 backdrop-blur-xl border-b border-afflyt-glass-border z-50 lg:hidden">
                <div className="h-full px-4 flex items-center justify-between">
                    {/* Logo + Menu Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5 text-gray-400" />
                            ) : (
                                <Menu className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                                <span className="text-afflyt-dark-100 font-bold text-sm">A</span>
                            </div>
                            <span className="text-white font-bold">AFFLYT</span>
                        </Link>
                    </div>

                    {/* Mobile Status */}
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-afflyt-profit-400 rounded-full animate-pulse" />
                        <span className="text-xs text-afflyt-profit-400">{t('live')}</span>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="absolute top-14 left-0 right-0 bg-afflyt-dark-50/95 backdrop-blur-xl border-b border-afflyt-glass-border">
                        <nav className="p-4 space-y-1">
                            {/* Mobile Onboarding Button */}
                            {!onboardingCompleted && (
                                <Link
                                    href={`/${locale}/onboarding`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-gradient-to-r from-afflyt-cyan-500/20 to-afflyt-plasma-500/20 border border-afflyt-cyan-500/40 rounded-lg"
                                >
                                    <Sparkles className="w-5 h-5 text-afflyt-cyan-400" />
                                    <span className="text-afflyt-cyan-300 font-medium">{t('completeSetup')}</span>
                                </Link>
                            )}

                            {navItems.map((item) => {
                                const isActive = pathname === item.path;

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-afflyt-cyan-500/10 text-afflyt-cyan-300'
                                            : 'text-gray-400 hover:text-white hover:bg-afflyt-glass-white'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                        {item.badge && (
                                            <span className="ml-auto px-2 py-1 bg-afflyt-cyan-500/20 text-afflyt-cyan-300 text-xs font-mono rounded">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Mobile Help Link */}
                            <Link
                                href={`/${locale}/help`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-afflyt-glass-white"
                            >
                                <HelpCircle className="w-5 h-5" />
                                <span className="font-medium">{t('help')}</span>
                            </Link>

                            {/* Mobile User Section */}
                            <div className="mt-4 pt-4 border-t border-afflyt-glass-border">
                                <div className="flex items-center gap-3 px-4 py-2 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {getInitials()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{getDisplayName()}</p>
                                        <p className="text-xs text-gray-500">{userProfile?.plan?.toUpperCase() || 'FREE'} Plan</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/${locale}/settings`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-afflyt-glass-white"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="font-medium">{t('settings')}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">{t('logout')}</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Command Palette */}
            {commandPaletteOpen && (
                <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
            )}
        </>
    );
};
