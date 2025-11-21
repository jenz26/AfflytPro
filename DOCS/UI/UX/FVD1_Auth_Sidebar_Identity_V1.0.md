# FVD 1: Studio di Identità Visiva Afflyt Pro - "Cyber Intelligence" 🚀

## 1. VISIONE BRANDING & MOODBOARD

### Concept: "Data Command Center"
Un'interfaccia che fonde l'eleganza del minimalismo con elementi cyber-futuristici. Immagina una sala di controllo di una nave spaziale dove ogni dato è prezioso e ogni decisione è supportata da intelligence in tempo reale.

### Palette Colori Definitiva

```javascript
// tailwind.config.js - Afflyt Pro Color System
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary - Electric Cyan (Data Intelligence)
        'afflyt-cyan': {
          50: '#E6FFFE',
          100: '#B3FFFC',
          200: '#80FFF9',
          300: '#4DFFF6',
          400: '#1AFFF3',
          500: '#00E5E0', // Primary
          600: '#00B8B3',
          700: '#008A86',
          800: '#005D5A',
          900: '#002F2D',
        },
        // Accent - Plasma Purple (Premium/Pro Features)
        'afflyt-plasma': {
          400: '#B794F4',
          500: '#9F7AEA', // Accent
          600: '#805AD5',
        },
        // Warning - Profit Green
        'afflyt-profit': {
          400: '#48BB78',
          500: '#38A169',
          600: '#2F855A',
        },
        // Dark Mode Backgrounds
        'afflyt-dark': {
          50: '#1A1B23',  // Card background
          100: '#13141B', // Base background
          200: '#0C0D13', // Deep background
          300: '#23242E', // Hover state
          400: '#2D2E3A', // Active state
        },
        // Glass Effect
        'afflyt-glass': {
          white: 'rgba(255, 255, 255, 0.05)',
          cyan: 'rgba(0, 229, 224, 0.1)',
          border: 'rgba(0, 229, 224, 0.2)',
        }
      },
    },
  },
}
```

## 2. ELEMENTI UI UNICI (SIGNATURE COMPONENTS)

### 2.1 Bottoni CTA - "Cyber Cut Design"

```tsx
// components/ui/CyberButton.tsx
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CyberButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const CyberButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  onClick 
}: CyberButtonProps) => {
  const baseStyles = `
    relative overflow-hidden
    font-mono uppercase tracking-wider
    transition-all duration-300
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
    before:-translate-x-full hover:before:translate-x-full
    before:transition-transform before:duration-700
    active:scale-95
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-600
      text-afflyt-dark-100 font-semibold
      shadow-[0_0_20px_rgba(0,229,224,0.3)]
      hover:shadow-[0_0_30px_rgba(0,229,224,0.5)]
      border border-afflyt-cyan-400/20
    `,
    secondary: `
      bg-afflyt-glass-white backdrop-blur-xl
      text-afflyt-cyan-400 
      border border-afflyt-glass-border
      hover:bg-afflyt-glass-cyan
      hover:border-afflyt-cyan-500/40
    `,
    ghost: `
      bg-transparent
      text-afflyt-cyan-400
      hover:bg-afflyt-glass-white
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  // Unique corner cut design
  const cornerCut = {
    clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      style={cornerCut}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
```

### 2.2 Glass Card Effect

```tsx
// components/ui/GlassCard.tsx
export const GlassCard = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "relative overflow-hidden",
      "bg-afflyt-glass-white backdrop-blur-2xl",
      "border border-afflyt-glass-border",
      "shadow-[0_8px_32px_rgba(0,229,224,0.08)]",
      "before:absolute before:inset-0",
      "before:bg-gradient-to-br before:from-afflyt-cyan-500/5 before:to-transparent",
      "hover:shadow-[0_8px_40px_rgba(0,229,224,0.12)]",
      "hover:border-afflyt-cyan-500/30",
      "transition-all duration-500",
      className
    )}>
      {/* Glow effect on hover */}
      <div className="absolute -top-1 -left-1 w-20 h-20 bg-afflyt-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
```

### 2.3 Typography System

```tsx
// styles/typography.ts
export const typography = {
  // Headers - Space Grotesk (geometric, futuristic)
  heading: "font-['Space_Grotesk'] tracking-tight",
  
  // Body - Inter for readability
  body: "font-['Inter'] text-gray-300",
  
  // Data/Code - JetBrains Mono
  mono: "font-['JetBrains_Mono'] text-afflyt-cyan-300",
  
  // Sizes
  h1: "text-4xl md:text-5xl font-bold",
  h2: "text-2xl md:text-3xl font-semibold",
  h3: "text-xl md:text-2xl font-medium",
  dataLabel: "text-xs uppercase tracking-wider text-afflyt-cyan-400/70",
  dataValue: "text-lg font-mono font-medium text-afflyt-cyan-300"
};
```

## 3. LAYOUT SIDEBAR & CORE UX

```tsx
// components/layout/FuturisticSidebar.tsx
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
```

## 4. FLUSSO AUTENTICAZIONE - MAGIC LINK

```tsx
// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { Mail, Sparkles, Globe, ArrowRight } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<'it' | 'en'>('it');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const translations = {
    it: {
      title: 'Accedi al Command Center',
      subtitle: 'Il tuo hub di controllo per l\'affiliate marketing intelligente',
      emailLabel: 'Email Aziendale',
      emailPlaceholder: 'tu@azienda.com',
      continueButton: 'Accedi con Magic Link',
      noPassword: 'Nessuna password richiesta',
      secure: 'Accesso sicuro e immediato',
      emailSentTitle: 'Controlla la tua email!',
      emailSentDesc: 'Ti abbiamo inviato un link sicuro per accedere.',
      features: [
        'Dashboard Real-Time',
        'Automazioni AI-Powered',
        'Analytics Avanzate'
      ]
    },
    en: {
      title: 'Access Command Center',
      subtitle: 'Your control hub for intelligent affiliate marketing',
      emailLabel: 'Business Email',
      emailPlaceholder: 'you@company.com',
      continueButton: 'Login with Magic Link',
      noPassword: 'No password required',
      secure: 'Secure and instant access',
      emailSentTitle: 'Check your email!',
      emailSentDesc: 'We\'ve sent you a secure link to login.',
      features: [
        'Real-Time Dashboard',
        'AI-Powered Automations',
        'Advanced Analytics'
      ]
    }
  };

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setEmailSent(true);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-afflyt-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-afflyt-plasma-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(#00E5E0 1px, transparent 1px), linear-gradient(90deg, #00E5E0 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Login Form */}
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-xl flex items-center justify-center">
              <span className="text-afflyt-dark-100 font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">AFFLYT PRO</h1>
              <p className="text-afflyt-cyan-400 text-sm font-mono uppercase">Command Center</p>
            </div>
          </div>

          {/* Main Card */}
          <GlassCard className="p-8">
            {!emailSent ? (
              <>
                <h2 className="text-3xl font-bold text-white mb-2">{t.title}</h2>
                <p className="text-gray-400 mb-8">{t.subtitle}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <CyberButton
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-afflyt-dark-100 border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>{t.continueButton}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </CyberButton>
                </form>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                    {t.noPassword}
                  </span>
                  <span>•</span>
                  <span>{t.secure}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-afflyt-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-afflyt-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.emailSentTitle}</h3>
                <p className="text-gray-400">{t.emailSentDesc}</p>
                <p className="text-afflyt-cyan-400 font-mono mt-4">{email}</p>
              </div>
            )}
          </GlassCard>

          {/* Language Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'it' ? 'en' : 'it')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-afflyt-cyan-400 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="font-mono uppercase">{language === 'it' ? 'EN' : 'IT'}</span>
            </button>
          </div>
        </div>

        {/* Right Panel - Features */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="space-y-6">
            {t.features.map((feature, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-afflyt-cyan-400 font-mono text-lg">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature}</h3>
                </div>
              </GlassCard>
            ))}

            {/* Stats Preview */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <GlassCard className="p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">ROI Medio</p>
                <p className="text-2xl font-bold text-afflyt-profit-400 font-mono">+247%</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Deal/Giorno</p>
                <p className="text-2xl font-bold text-afflyt-cyan-400 font-mono">1.2K</p>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 5. IMPLEMENTAZIONE NEXT.JS

```tsx
// app/layout.tsx - Root Layout con Dark Mode
import './globals.css';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <body className={`
        ${spaceGrotesk.variable} 
        ${inter.variable} 
        ${jetbrainsMono.variable} 
        font-sans bg-afflyt-dark-100 text-white
      `}>
        {children}
      </body>
    </html>
  );
}
```

## ACCEPTANCE CRITERIA ✅

1. **Riconoscibilità Immediata** ✓
   - Design con corner cuts unici sui bottoni
   - Effetto glass morphism distintivo
   - Palette cyan/plasma mai vista nel B2B standard

2. **Sicurezza & Alta Tecnologia** ✓
   - UI che ricorda un command center
   - Animazioni fluide ma non eccessive
   - Font mono per dati critici
   - Indicatori di stato sempre visibili

3. **Supporto i18n** ✓
   - Toggle lingua integrato nella sidebar
   - Sistema di traduzioni già implementato

4. **Dark Mode Nativo** ✓
   - Implementato come standard
   - Toggle accessibile dalla sidebar

5. **Magic Link Focus** ✓
   - Processo semplificato e visivamente chiaro
   - Nessun campo password visibile

Questo design system "Cyber Intelligence" posiziona Afflyt Pro come un tool di nuova generazione, distinguendosi nettamente dalla concorrenza con un'identità visiva forte e memorabile. La combinazione di glass morphism, corner cuts geometrici e palette cyan/plasma crea un'esperienza utente che trasmette innovazione e controllo totale sui dati. 🚀