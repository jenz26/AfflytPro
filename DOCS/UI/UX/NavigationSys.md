# Studio Sistema di Navigazione - Afflyt Pro Command Center 🧭

## ANALISI CONTESTO E VINCOLI

### User Journey Principale
1. **Dashboard** (Home/Overview)
2. **Deal Finder** (Core Value)
3. **Automazioni** (NSM - Weekly Active)
4. **Canali** (Destinations)
5. **Settings** (Config Hub)

### Device Target
- **Primary**: Desktop/Laptop (Decision makers al PC)
- **Secondary**: Tablet (monitoring on-the-go)
- **Tertiary**: Mobile (quick checks)

### Caratteristiche Design System "Cyber Intelligence"
- Feel da "command center"
- Dati sempre visibili (TTL, Status)
- Accesso rapido alle azioni critiche

## OPZIONI DI NAVIGAZIONE

### OPZIONE A: SIDEBAR FISSA (Current)
```tsx
// Struttura Attuale Implementata
<div className="flex">
  <Sidebar className="fixed left-0 w-72 h-screen" />
  <MainContent className="ml-72 flex-1" />
</div>
```

**PRO:**
- ✅ Sempre visibile e accessibile
- ✅ Spazio per indicatori live (TTL, Tier)
- ✅ Gerarchie chiare con sottomenu
- ✅ Coerente con "command center" feel

**CONTRO:**
- ❌ Occupa molto spazio orizzontale (280px)
- ❌ Difficile su mobile/tablet
- ❌ Può risultare "pesante" con molte voci

---

### OPZIONE B: TOP BAR + SIDEBAR COLLASSABILE
```tsx
// Proposta Ibrida
const HybridNavigation = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <>
      {/* Top Bar Fixed */}
      <TopBar className="fixed top-0 h-16 w-full z-50">
        <Logo />
        <SearchGlobal />
        <QuickActions />
        <UserMenu />
      </TopBar>
      
      {/* Collapsible Sidebar */}
      <Sidebar className={`fixed left-0 top-16 transition-all ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <NavItems showLabels={!sidebarCollapsed} />
        <StatusIndicators compact={sidebarCollapsed} />
      </Sidebar>
      
      <MainContent className={`mt-16 transition-all ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`} />
    </>
  );
};
```

**PRO:**
- ✅ Più flessibile per responsive
- ✅ Quick actions sempre accessibili in top
- ✅ Più spazio per content quando collapsed

**CONTRO:**
- ❌ Due elementi di nav (può confondere)
- ❌ Meno spazio verticale per content

---

### OPZIONE C: COMMAND PALETTE NAVIGATION 🎯
```tsx
// Concept Innovativo: Command Center Style
const CommandNavigation = () => {
  const [commandOpen, setCommandOpen] = useState(false);
  
  return (
    <>
      {/* Minimal Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-afflyt-dark-50/95 backdrop-blur-xl border-b border-afflyt-glass-border z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Brand + Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-afflyt-dark-100 font-bold text-xl">A</span>
              </div>
              <span className="text-white font-bold text-lg">AFFLYT PRO</span>
            </div>
            
            {/* Live Status Pills */}
            <div className="flex items-center gap-3">
              <StatusPill icon={Clock} value="18.5h" label="TTL" color="cyan" />
              <StatusPill icon={Zap} value="3/5" label="WAA" color="profit" />
              <StatusPill icon={Activity} value="Live" pulse color="profit" />
            </div>
          </div>

          {/* Center: Primary Nav */}
          <nav className="flex items-center gap-2">
            <NavButton icon={LayoutDashboard} label="Dashboard" path="/dashboard" />
            <NavButton icon={TrendingUp} label="Deal Finder" path="/deals" hot />
            <NavButton icon={Zap} label="Automazioni" path="/automations" badge="3" />
            <NavButton icon={Send} label="Canali" path="/channels" />
          </nav>

          {/* Right: Command + User */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCommandOpen(true)}
              className="px-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg hover:border-afflyt-cyan-500/40 transition-all flex items-center gap-2"
            >
              <Command className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Cmd</span>
              <kbd className="px-1.5 py-0.5 bg-afflyt-dark-50 rounded text-xs text-gray-500 font-mono">K</kbd>
            </button>
            
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette 
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
      
      {/* Main Content */}
      <main className="pt-16">
        {/* content */}
      </main>
    </>
  );
};
```

**PRO:**
- ✅ Massimo spazio per content
- ✅ Navigazione rapida via keyboard (Cmd+K)
- ✅ Scalabile con molte features
- ✅ Status sempre visibili
- ✅ Mobile-friendly con hamburger menu

**CONTRO:**
- ❌ Learning curve per command palette
- ❌ Meno discoverable per nuovi utenti

---

## 🏆 PROPOSTA FINALE: HYBRID COMMAND BAR

Combiniamo il meglio di tutti gli approcci:

```tsx
// components/navigation/CommandBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  TrendingUp,
  Zap,
  Send,
  Settings,
  Command,
  Menu,
  X,
  Clock,
  Shield,
  Activity,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Fire
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

export const CommandBar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
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

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      shortcut: '⌘D'
    },
    {
      icon: TrendingUp,
      label: 'Deal Finder',
      path: '/dashboard/deals',
      shortcut: '⌘F',
      hot: true, // Shows fire icon for hot deals
      badge: '12' // New hot deals
    },
    {
      icon: Zap,
      label: 'Automazioni',
      path: '/dashboard/automations',
      shortcut: '⌘A',
      badge: '3' // Active automations
    },
    {
      icon: Send,
      label: 'Canali',
      path: '/dashboard/channels',
      shortcut: '⌘C'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/dashboard/settings',
      shortcut: '⌘,'
    }
  ];

  // Live account data
  const accountStatus = {
    ttl: 18.5,
    tier: 'PRO',
    waa: 3,
    waaTarget: 5,
    systemStatus: 'active',
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,229,224,0.3)]">
                <span className="text-afflyt-dark-100 font-bold text-xl">A</span>
              </div>
              <div>
                <span className="text-white font-bold text-lg">AFFLYT PRO</span>
                <span className="text-afflyt-cyan-400 text-[10px] font-mono uppercase block -mt-1">
                  COMMAND CENTER
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              {/* TTL Status */}
              <GlassCard className="px-3 py-1.5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-afflyt-cyan-400" />
                <span className="text-xs font-mono text-white">{accountStatus.ttl}h</span>
                <span className="text-[10px] text-gray-500">TTL</span>
              </GlassCard>

              {/* WAA Progress */}
              <GlassCard className="px-3 py-1.5 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-afflyt-profit-400" />
                <span className="text-xs font-mono text-white">
                  {accountStatus.waa}/{accountStatus.waaTarget}
                </span>
                <span className="text-[10px] text-gray-500">WAA</span>
              </GlassCard>

              {/* System Status */}
              <div className="flex items-center gap-2 px-3">
                <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                <span className="text-xs text-afflyt-profit-400">Live</span>
              </div>
            </div>
          </div>

          {/* Center: Main Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.path;
              
              return (
                
                  key={item.path}
                  href={item.path}
                  className={`relative px-4 py-2 rounded-lg transition-all group ${
                    isActive 
                      ? 'bg-afflyt-cyan-500/10 text-afflyt-cyan-300' 
                      : 'text-gray-400 hover:text-white hover:bg-afflyt-glass-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    
                    {item.hot && (
                      <Fire className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
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
                </a>
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
              <span className="text-sm text-gray-300">Cerca...</span>
              <div className="flex items-center gap-1 ml-8">
                <kbd className="px-1.5 py-0.5 bg-afflyt-dark-50 rounded text-[10px] text-gray-500 font-mono">⌘</kbd>
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

            {/* Help */}
            <button className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors">
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>

            {/* User Menu */}
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-afflyt-glass-white rounded-lg transition-colors">
              <div className="w-7 h-7 bg-gradient-to-br from-afflyt-plasma-400 to-afflyt-plasma-600 rounded-full" />
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
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
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-afflyt-dark-100 font-bold text-sm">A</span>
              </div>
              <span className="text-white font-bold">AFFLYT</span>
            </div>
          </div>

          {/* Mobile Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-afflyt-glass-white rounded-lg">
              <Clock className="w-3 h-3 text-afflyt-cyan-400" />
              <span className="text-xs font-mono text-white">{accountStatus.ttl}h</span>
            </div>
            <div className="w-1.5 h-1.5 bg-afflyt-profit-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-afflyt-dark-50/95 backdrop-blur-xl border-b border-afflyt-glass-border">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                
                return (
                  
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
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
                  </a>
                );
              })}
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
```

## VANTAGGI DELLA SOLUZIONE HYBRID COMMAND BAR

### 1. **Massimo Spazio per Content**
- Solo 64px di altezza occupata
- 100% larghezza disponibile per dashboard/tables
- Nessuna sidebar che ruba spazio orizzontale

### 2. **Status Always Visible**
- TTL, WAA, System Status sempre in vista
- Non serve navigare per vedere i KPI critici
- Visual feedback immediato

### 3. **Scalabilità**
- Command Palette (Cmd+K) per funzioni avanzate
- Non limitato dal numero di voci menu
- Shortcuts keyboard per power users

### 4. **Responsive by Design**
- Mobile: hamburger + dropdown
- Tablet: nav compatta
- Desktop: full nav con shortcuts

### 5. **Cyber Intelligence Feel**
- Status pills stile command center
- Animazioni live (pulse) per sistema attivo
- Glass morphism coerente

## LAYOUT RISULTANTE

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <body className="bg-afflyt-dark-100 text-white">
        <CommandBar />
        <main className="pt-16 lg:pt-16">
          {/* pt-14 mobile, pt-16 desktop */}
          {children}
        </main>
      </body>
    </html>
  );
}
```

Questa soluzione offre:
- ✅ **Più spazio verticale** per le tabelle deal
- ✅ **KPI sempre visibili** (TTL, WAA)
- ✅ **Mobile-first** senza compromessi
- ✅ **Keyboard shortcuts** per power users
- ✅ **Scalabile** con Command Palette

