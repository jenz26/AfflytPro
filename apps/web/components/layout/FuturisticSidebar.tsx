import { useState } from 'react';
import {
    BarChart3,
    Search,
    Settings,
    CreditCard,
    Zap,
    Moon,
    Sun,
    Globe
} from 'lucide-react';

export const FuturisticSidebar = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [language, setLanguage] = useState<'it' | 'en'>('it');

    // Simulated tier & TTL data
    const userTier = 'PRO';
    const ttlHours = 18;
    const ttlPercentage = (ttlHours / 24) * 100;

    const navItems = [
        { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
        { icon: Search, label: 'Deal Finder', path: '/deals' },
        { icon: Zap, label: 'Automazioni', path: '/automations' },
        { icon: CreditCard, label: 'Billing', path: '/billing' },
        { icon: Settings, label: 'Settings', path: '/settings' }
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-afflyt-dark-100 border-r border-afflyt-glass-border">
            {/* Logo Section */}
            <div className="p-6 border-b border-afflyt-glass-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                        <span className="text-afflyt-dark-100 font-bold text-xl">A</span>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-xl tracking-tight">AFFLYT PRO</h1>
                        <p className="text-afflyt-cyan-400 text-xs font-mono uppercase">Command Center</p>
                    </div>
                </div>
            </div>

            {/* Tier & TTL Status */}
            <div className="p-4 mx-4 mt-4 bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Account Status</span>
                    <span className="px-2 py-1 bg-afflyt-plasma-500/20 text-afflyt-plasma-400 text-xs font-mono rounded">
                        {userTier}
                    </span>
                </div>

                {/* TTL Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Data TTL</span>
                        <span className="text-xs font-mono text-afflyt-cyan-400">{ttlHours}h</span>
                    </div>
                    <div className="h-1 bg-afflyt-dark-50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400 transition-all duration-500"
                            style={{ width: `${ttlPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-4">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        className="w-full flex items-center gap-3 px-4 py-3 mb-1 text-gray-400 hover:text-afflyt-cyan-400 hover:bg-afflyt-glass-white rounded-lg transition-all duration-200 group"
                    >
                        <item.icon className="w-5 h-5 group-hover:text-afflyt-cyan-400" />
                        <span className="font-medium">{item.label}</span>
                        <div className="ml-auto w-1 h-4 bg-afflyt-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </nav>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-afflyt-glass-border">
                <div className="flex items-center justify-between">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                    >
                        {isDarkMode ? (
                            <Moon className="w-5 h-5 text-afflyt-cyan-400" />
                        ) : (
                            <Sun className="w-5 h-5 text-yellow-400" />
                        )}
                    </button>

                    {/* Language Toggle */}
                    <button
                        onClick={() => setLanguage(language === 'it' ? 'en' : 'it')}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                    >
                        <Globe className="w-4 h-4 text-afflyt-cyan-400" />
                        <span className="text-sm font-mono text-gray-400 uppercase">{language}</span>
                    </button>
                </div>

                {/* User Profile */}
                <div className="mt-4 p-3 bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full" />
                        <div className="flex-1">
                            <p className="text-sm text-white font-medium">Marco R.</p>
                            <p className="text-xs text-gray-500">marco@contindigital.it</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
