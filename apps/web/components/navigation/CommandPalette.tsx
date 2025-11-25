'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Command } from 'cmdk';
import {
    Search,
    X,
    LayoutDashboard,
    TrendingUp,
    Zap,
    Send,
    Settings,
    Plus,
    Link2,
    Bot,
    Package,
    DollarSign,
    BarChart3,
    Clock,
    Sparkles,
    Filter,
    Flame
} from 'lucide-react';
import { useOperatingSystem, getModifierKey } from '@/hooks/useOperatingSystem';

interface CommandPaletteProps {
    onClose: () => void;
}

interface CommandItem {
    id: string;
    type: 'navigation' | 'action' | 'search' | 'quickstat';
    label: string;
    description?: string;
    icon: any;
    action: () => void;
    shortcut?: string;
    keywords?: string[];
    score?: number;
    hot?: boolean;
    category?: string;
}

export const CommandPalette = ({ onClose }: CommandPaletteProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const os = useOperatingSystem();
    const modKey = getModifierKey(os);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentCommands, setRecentCommands] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<CommandItem[]>([]);

    // Load recent commands from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('afflyt_recent_commands');
        if (stored) {
            try {
                setRecentCommands(JSON.parse(stored).slice(0, 3));
            } catch (e) {
                setRecentCommands([]);
            }
        }
    }, []);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Save to recent commands
    const executeCommand = useCallback((item: CommandItem) => {
        const recent = [item.id, ...recentCommands.filter(id => id !== item.id)].slice(0, 3);
        setRecentCommands(recent);
        localStorage.setItem('afflyt_recent_commands', JSON.stringify(recent));

        item.action();
        onClose();
    }, [recentCommands, onClose]);

    // Navigation commands
    const navigationCommands: CommandItem[] = [
        {
            id: 'nav-dashboard',
            type: 'navigation',
            label: 'Dashboard',
            description: 'Torna al Command Center',
            icon: LayoutDashboard,
            action: () => router.push('/dashboard'),
            shortcut: `${modKey}D`,
            keywords: ['home', 'overview', 'panoramica']
        },
        {
            id: 'nav-deals',
            type: 'navigation',
            label: 'Deal Finder',
            description: 'Trova offerte con alto Deal Score',
            icon: TrendingUp,
            action: () => router.push('/dashboard/deals'),
            shortcut: `${modKey}F`,
            keywords: ['offerte', 'deals', 'cerca', 'find'],
            hot: true
        },
        {
            id: 'nav-automations',
            type: 'navigation',
            label: 'Automazioni',
            description: 'Gestisci le tue automazioni',
            icon: Zap,
            action: () => router.push('/dashboard/automations'),
            shortcut: `${modKey}A`,
            keywords: ['automation', 'auto', 'regole', 'rules']
        },
        {
            id: 'nav-channels',
            type: 'navigation',
            label: 'Canali',
            description: 'Gestisci canali di pubblicazione',
            icon: Send,
            action: () => router.push('/dashboard/settings/channels'),
            shortcut: `${modKey}C`,
            keywords: ['telegram', 'discord', 'publish', 'pubblica']
        },
        {
            id: 'nav-settings',
            type: 'navigation',
            label: 'Settings',
            description: 'Impostazioni e configurazioni',
            icon: Settings,
            action: () => router.push('/dashboard/settings'),
            shortcut: `${modKey},`,
            keywords: ['impostazioni', 'config', 'setup']
        }
    ];

    // Action commands
    const actionCommands: CommandItem[] = [
        {
            id: 'action-create-automation',
            type: 'action',
            label: 'Crea Automazione',
            description: 'Configura una nuova regola di pubblicazione',
            icon: Zap,
            action: () => router.push('/dashboard/automations'),
            category: 'actions',
            keywords: ['new', 'nuova', 'add', 'aggiungi']
        },
        {
            id: 'action-connect-channel',
            type: 'action',
            label: 'Connetti canale Telegram',
            description: 'Aggiungi un nuovo canale di pubblicazione',
            icon: Bot,
            action: () => router.push('/dashboard/settings/channels?action=new&type=telegram'),
            keywords: ['telegram', 'bot', 'connect', 'collega']
        },
        {
            id: 'action-add-credentials',
            type: 'action',
            label: 'Aggiungi credenziali API',
            description: 'Configura Keepa o altre API keys',
            icon: Plus,
            action: () => router.push('/dashboard/settings/credentials?action=new'),
            keywords: ['api', 'key', 'keepa', 'credentials']
        },
        {
            id: 'action-generate-link',
            type: 'action',
            label: 'Genera link affiliato',
            description: 'Crea un link Amazon con il tuo tag',
            icon: Link2,
            action: () => router.push('/dashboard/deals?action=generate-link'),
            keywords: ['link', 'affiliate', 'amazon', 'genera']
        }
    ];

    // Quick stats commands  
    const quickStatCommands: CommandItem[] = [
        {
            id: 'stat-revenue',
            type: 'quickstat',
            label: 'Mostra revenue ultimo mese',
            description: 'Visualizza entrate e conversioni',
            icon: DollarSign,
            action: () => router.push('/dashboard?view=revenue'),
            keywords: ['revenue', 'entrate', 'soldi', 'guadagni']
        },
        {
            id: 'stat-performance',
            type: 'quickstat',
            label: 'Performance automazioni',
            description: 'Statistiche delle automazioni attive',
            icon: BarChart3,
            action: () => router.push('/dashboard?view=performance'),
            keywords: ['performance', 'stats', 'statistiche']
        },
        {
            id: 'stat-ttl',
            type: 'quickstat',
            label: 'Stato TTL e limiti',
            description: 'Verifica TTL e consumo API',
            icon: Clock,
            action: () => router.push('/dashboard?view=limits'),
            keywords: ['ttl', 'limits', 'limiti', 'api']
        }
    ];

    // Contextual suggestions based on current page
    const getContextualSuggestions = (): CommandItem[] => {
        if (pathname === '/dashboard/deals') {
            return [
                {
                    id: 'context-filter-hot',
                    type: 'action',
                    label: 'Filtra solo Hot Deals (Score > 85)',
                    icon: Flame,
                    action: () => { },
                    keywords: ['filter', 'hot']
                },
                {
                    id: 'context-filter-category',
                    type: 'action',
                    label: 'Filtra per categoria',
                    icon: Filter,
                    action: () => { },
                    keywords: ['filter', 'category']
                }
            ];
        }

        if (pathname === '/dashboard') {
            return [
                {
                    id: 'context-complete-setup',
                    type: 'action',
                    label: 'Completa configurazione',
                    description: 'Continua il setup guidato',
                    icon: Sparkles,
                    action: () => router.push('/dashboard?onboarding=continue'),
                    keywords: ['setup', 'onboarding']
                }
            ];
        }

        return [];
    };

    // Search for deals (simulated)
    useEffect(() => {
        if (search.startsWith('B0') || search.match(/^[A-Z0-9]{10}$/)) {
            setLoading(true);
            setTimeout(() => {
                setSearchResults([
                    {
                        id: `deal-${search}`,
                        type: 'search',
                        label: `Echo Dot (4ª gen) - ${search}`,
                        description: 'Score: 92 • Sconto: 67%',
                        icon: Package,
                        score: 92,
                        hot: true,
                        action: () => router.push(`/dashboard/deals/${search}`),
                        keywords: []
                    }
                ]);
                setLoading(false);
            }, 500);
        } else {
            setSearchResults([]);
        }
    }, [search, router]);

    // Combine all commands
    const allCommands = [
        ...getContextualSuggestions(),
        ...navigationCommands,
        ...actionCommands,
        ...quickStatCommands,
        ...searchResults
    ];

    // Filter recent commands
    const recentItems = allCommands.filter(cmd => recentCommands.includes(cmd.id));

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'navigation': return '🧭';
            case 'action': return '⚡';
            case 'search': return '🔍';
            case 'quickstat': return '📊';
            default: return '•';
        }
    };

    return (
        <div className="fixed inset-0 z-[100]" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Command Palette */}
            <div
                className="relative mx-auto mt-[10vh] max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Command className="bg-afflyt-dark-50 border border-afflyt-glass-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center border-b border-afflyt-glass-border">
                        <Search className="ml-4 w-5 h-5 text-gray-400" />
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Cerca comandi, deal, automazioni..."
                            className="flex-1 px-4 py-4 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
                        />
                        <button
                            onClick={onClose}
                            className="mr-4 p-1 hover:bg-afflyt-glass-white rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Results */}
                    <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                        {loading && (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-afflyt-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        )}

                        {!loading && (
                            <>
                                {/* Recent Commands */}
                                {recentItems.length > 0 && (
                                    <Command.Group heading="Recenti" className="mb-2">
                                        {recentItems.map(item => (
                                            <Command.Item
                                                key={item.id}
                                                onSelect={() => executeCommand(item)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-afflyt-glass-white transition-colors"
                                            >
                                                <item.icon className="w-4 h-4 text-afflyt-cyan-400" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">{item.label}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                    )}
                                                </div>
                                                {item.shortcut && (
                                                    <kbd className="px-2 py-1 bg-afflyt-dark-50 rounded text-xs text-gray-400">
                                                        {item.shortcut}
                                                    </kbd>
                                                )}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Navigation */}
                                <Command.Group heading="Navigazione" className="mb-2">
                                    {navigationCommands.map(item => (
                                        <Command.Item
                                            key={item.id}
                                            onSelect={() => executeCommand(item)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-afflyt-glass-white transition-colors"
                                        >
                                            <item.icon className="w-4 h-4 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-sm text-white">{item.label}</p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500">{item.description}</p>
                                                )}
                                            </div>
                                            {item.shortcut && (
                                                <kbd className="px-2 py-1 bg-afflyt-dark-50 rounded text-xs text-gray-400">
                                                    {item.shortcut}
                                                </kbd>
                                            )}
                                        </Command.Item>
                                    ))}
                                </Command.Group>

                                {/* Actions */}
                                <Command.Group heading="Azioni" className="mb-2">
                                    {actionCommands.map(item => (
                                        <Command.Item
                                            key={item.id}
                                            onSelect={() => executeCommand(item)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-afflyt-glass-white transition-colors"
                                        >
                                            <item.icon className="w-4 h-4 text-afflyt-cyan-400" />
                                            <div className="flex-1">
                                                <p className="text-sm text-white">{item.label}</p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500">{item.description}</p>
                                                )}
                                            </div>
                                        </Command.Item>
                                    ))}
                                </Command.Group>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <Command.Group heading="Risultati" className="mb-2">
                                        {searchResults.map(item => (
                                            <Command.Item
                                                key={item.id}
                                                onSelect={() => executeCommand(item)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-afflyt-glass-white transition-colors"
                                            >
                                                <item.icon className="w-4 h-4 text-orange-400" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">{item.label}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                    )}
                                                </div>
                                                {item.hot && (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                        HOT
                                                    </span>
                                                )}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                            </>
                        )}
                    </Command.List>

                    {/* Footer */}
                    <div className="border-t border-afflyt-glass-border px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Usa ↑↓ per navigare, ↵ per selezionare</span>
                        <span>ESC per chiudere</span>
                    </div>
                </Command>
            </div>
        </div>
    );
};
