# FVD 4: UX Design Dashboard - Onboarding & KPI Hub 🎯

## 1. LAYOUT GENERALE - DASHBOARD ADAPTIVE

```tsx
// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Zap,
  TrendingUp,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Activity,
  DollarSign,
  MousePointer,
  Send,
  Key,
  Bot,
  Sparkles,
  ChevronRight,
  Info,
  Target,
  BarChart3,
  Package,
  Gauge
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { OnboardingFlow } from '@/components/dashboard/OnboardingFlow';
import { KPIWidget } from '@/components/dashboard/KPIWidget';

export default function DashboardPage() {
  // Simulated user state
  const [userState, setUserState] = useState<'new' | 'partial' | 'active'>('new');
  const [onboardingProgress, setOnboardingProgress] = useState({
    channelConnected: false,
    credentialsSet: false,
    automationCreated: false
  });

  // Simulated account data
  const accountData = {
    plan: 'PRO',
    ttl: 72, // hours
    limits: {
      rules: { used: 2, max: 10 },
      offers: { used: 147, max: 500 },
      channels: { used: 1, max: 5 }
    },
    keepaBudget: {
      used: 234.50,
      total: 879.00,
      daysRemaining: 18
    },
    performance: {
      totalClicks: 12453,
      revenue: 3478.90,
      conversionRate: 3.8,
      activeAutomations: 3,
      lastDealPublished: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      lastClick: new Date(Date.now() - 15 * 60000) // 15 min ago
    },
    recentDeals: [
      { score: 92, title: 'Echo Dot (4ª gen)', time: '2h fa' },
      { score: 87, title: 'Samsung Galaxy Buds', time: '4h fa' },
      { score: 85, title: 'Kindle Paperwhite', time: '6h fa' }
    ]
  };

  // Calculate user state based on onboarding
  useEffect(() => {
    const steps = Object.values(onboardingProgress);
    const completed = steps.filter(Boolean).length;
    
    if (completed === 0) setUserState('new');
    else if (completed < 3) setUserState('partial');
    else setUserState('active');
  }, [onboardingProgress]);

  // North Star Metric
  const WAA = accountData.performance.activeAutomations;
  const WAATarget = 5;
  const WAAPercentage = (WAA / WAATarget) * 100;

  return (
    <div className="min-h-screen bg-afflyt-dark-100 pl-72">
      {/* Header with Account Status */}
      <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-afflyt-dark-100" />
                </div>
                Command Center
              </h1>
              <p className="text-gray-400 mt-1">
                {userState === 'new' 
                  ? 'Benvenuto! Inizia la configurazione per attivare il sistema'
                  : userState === 'partial'
                  ? 'Configurazione in corso - Completa per sbloccare tutto il potenziale'
                  : 'Sistema operativo - Tutte le automazioni attive'
                }
              </p>
            </div>

            {/* Account Status Badge */}
            <div className="flex items-center gap-4">
              {/* Plan & TTL */}
              <GlassCard className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-afflyt-plasma-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Piano {accountData.plan}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white font-mono">{accountData.ttl}h</span>
                      <span className="text-xs text-afflyt-cyan-400">TTL</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* North Star Metric - WAA */}
              <GlassCard className="px-4 py-3 border-afflyt-cyan-500/30">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-afflyt-cyan-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Weekly Active</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white font-mono">{WAA}/{WAATarget}</span>
                      <span className="text-xs text-afflyt-cyan-400">Automazioni</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* System Status */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                <span className="text-sm text-afflyt-profit-400">Sistema Attivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Onboarding Section - Shows for new/partial users */}
        {userState !== 'active' && (
          <OnboardingFlow 
            progress={onboardingProgress}
            onProgressUpdate={setOnboardingProgress}
          />
        )}

        {/* KPI Grid - Always visible but enhanced for active users */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Performance Widget */}
          <KPIWidget
            title="Performance Totale"
            icon={TrendingUp}
            mainValue={accountData.performance.totalClicks.toLocaleString()}
            mainLabel="Click Totali"
            subValue={`€${accountData.performance.revenue.toFixed(2)}`}
            subLabel="Revenue Stimata"
            trend={{
              value: 23,
              positive: true,
              label: 'vs settimana scorsa'
            }}
            color="cyan"
          />

          {/* Governance/Limits Widget */}
          <KPIWidget
            title="Stato Limiti"
            icon={Gauge}
            mainValue={`${accountData.limits.rules.used}/${accountData.limits.rules.max}`}
            mainLabel="Regole Attive"
            subValue={`${accountData.limits.offers.used}/${accountData.limits.offers.max}`}
            subLabel="Offerte Inviate"
            status={
              accountData.limits.rules.used / accountData.limits.rules.max > 0.8
                ? 'warning'
                : 'good'
            }
            color="plasma"
          />

          {/* Keepa Budget Widget */}
          <KPIWidget
            title="Budget Keepa"
            icon={DollarSign}
            mainValue={`€${accountData.keepaBudget.used.toFixed(2)}`}
            mainLabel="Consumato"
            subValue={`€${(accountData.keepaBudget.total - accountData.keepaBudget.used).toFixed(2)}`}
            subLabel="Rimanente"
            progress={{
              value: (accountData.keepaBudget.used / accountData.keepaBudget.total) * 100,
              label: `${accountData.keepaBudget.daysRemaining} giorni rimanenti`
            }}
            color="profit"
          />

          {/* Last Activity Widget */}
          <KPIWidget
            title="Ultima Attività"
            icon={Clock}
            mainValue="15m fa"
            mainLabel="Ultimo Click"
            subValue="2h fa"
            subLabel="Ultimo Deal"
            activity={{
              recentDeals: accountData.recentDeals
            }}
            color="cyan"
          />
        </div>

        {/* Active User Dashboard Content */}
        {userState === 'active' && (
          <>
            {/* Hot Deals Preview */}
            <GlassCard className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  Hot Deals in Tempo Reale
                </h2>
                <CyberButton variant="secondary" size="sm">
                  Vedi Tutti
                  <ChevronRight className="w-4 h-4" />
                </CyberButton>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {accountData.recentDeals.map((deal, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border hover:border-afflyt-cyan-500/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                          deal.score >= 90 
                            ? 'from-orange-400 to-red-500' 
                            : 'from-afflyt-cyan-400 to-afflyt-cyan-600'
                        } flex items-center justify-center`}>
                          <span className="text-sm font-bold text-white font-mono">
                            {deal.score}
                          </span>
                        </div>
                        {deal.score >= 90 && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                            HOT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{deal.time}</span>
                    </div>
                    <p className="text-sm text-white line-clamp-1">{deal.title}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Automation Performance Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Active Automations List */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-afflyt-cyan-400" />
                  Automazioni Attive
                </h3>
                
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="p-3 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Automazione Tech Deals #{i}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>Score min: 75</span>
                            <span>•</span>
                            <span>3 canali</span>
                            <span>•</span>
                            <span className="text-afflyt-profit-400">247 invii</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
                          <span className="text-xs text-afflyt-profit-400">Attiva</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 p-3 text-sm text-afflyt-cyan-400 hover:bg-afflyt-glass-white rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Crea Nuova Automazione
                </button>
              </GlassCard>

              {/* Quick Stats */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-afflyt-cyan-400" />
                  Statistiche Rapide (24h)
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Deal Analizzati</span>
                    <span className="text-lg font-mono text-white">4,892</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Deal Pubblicati</span>
                    <span className="text-lg font-mono text-afflyt-cyan-400">147</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Conversion Rate</span>
                    <span className="text-lg font-mono text-afflyt-profit-400">3.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Score Medio</span>
                    <span className="text-lg font-mono text-white">78.5</span>
                  </div>
                  
                  <div className="pt-4 border-t border-afflyt-glass-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">API Calls Keepa</span>
                      <span className="text-sm font-mono text-white">12,453</span>
                    </div>
                    <div className="h-2 bg-afflyt-dark-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400"
                        style={{ width: '67%' }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">67% del limite giornaliero</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

## 2. COMPONENTE ONBOARDING FLOW

```tsx
// components/dashboard/OnboardingFlow.tsx
'use client';

import { useState } from 'react';
import { 
  Send, 
  Key, 
  Zap,
  CheckCircle,
  Circle,
  ArrowRight,
  Info,
  Sparkles,
  Bot,
  ChevronRight,
  Package
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface OnboardingFlowProps {
  progress: {
    channelConnected: boolean;
    credentialsSet: boolean;
    automationCreated: boolean;
  };
  onProgressUpdate: (progress: any) => void;
}

export const OnboardingFlow = ({ progress, onProgressUpdate }: OnboardingFlowProps) => {
  const [expandedStep, setExpandedStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Connetti il tuo Primo Canale',
      description: 'Collega Telegram o Discord per pubblicare le offerte',
      icon: Send,
      completed: progress.channelConnected,
      action: {
        label: 'Configura Canale',
        path: '/dashboard/settings/channels'
      },
      details: [
        'Crea un bot Telegram con @BotFather',
        'Aggiungi il bot al tuo canale',
        'Inserisci le credenziali in Afflyt'
      ],
      estimatedTime: '3 min'
    },
    {
      id: 2,
      title: 'Imposta le Credenziali API',
      description: 'Configura Keepa e i tuoi Tag Amazon per l\'affiliazione',
      icon: Key,
      completed: progress.credentialsSet,
      action: {
        label: 'Aggiungi Credenziali',
        path: '/dashboard/settings/credentials'
      },
      details: [
        'Inserisci la tua Keepa API Key',
        'Configura i Tag Amazon di affiliazione',
        'Opzionale: aggiungi credenziali extra'
      ],
      estimatedTime: '2 min'
    },
    {
      id: 3,
      title: 'Crea la tua Prima Automazione',
      description: 'Configura i filtri e inizia a pubblicare deal automaticamente',
      icon: Zap,
      completed: progress.automationCreated,
      action: {
        label: 'Crea Automazione',
        path: '/dashboard/automations/new'
      },
      details: [
        'Imposta i filtri (Score minimo, Categorie)',
        'Seleziona i canali di destinazione',
        'Attiva e lascia che Afflyt faccia il resto!'
      ],
      estimatedTime: '5 min'
    }
  ];

  const completedSteps = Object.values(progress).filter(Boolean).length;
  const progressPercentage = (completedSteps / 3) * 100;

  return (
    <div className="mb-8">
      {/* Welcome Hero */}
      <GlassCard className="p-8 mb-6 border-afflyt-cyan-500/30 bg-gradient-to-r from-afflyt-cyan-500/5 to-afflyt-plasma-500/5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-afflyt-dark-100" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Benvenuto nel Command Center di Afflyt Pro
                </h2>
                <p className="text-gray-400 mt-1">
                  Configura il sistema in 3 semplici passi e inizia a monetizzare
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progresso Configurazione</span>
                <span className="text-sm font-mono text-afflyt-cyan-400">
                  {completedSteps}/3 Completati
                </span>
              </div>
              <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tempo stimato rimanente: {10 - (completedSteps * 3)} minuti
              </p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="ml-8 p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
            <h3 className="text-sm font-medium text-afflyt-cyan-300 mb-3">
              Cosa otterrai:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-afflyt-profit-400 mt-0.5" />
                <span>Pubblicazione automatica 24/7</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-afflyt-profit-400 mt-0.5" />
                <span>Deal Score AI-powered</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-afflyt-profit-400 mt-0.5" />
                <span>ROI medio +247%</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {steps.map((step, index) => {
          const isActive = !step.completed && 
            (index === 0 || steps[index - 1].completed);
          
          return (
            <div
              key={step.id}
              className={`relative ${
                step.completed ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-50'
              }`}
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className={`hidden lg:block absolute top-12 left-full w-full h-0.5 -ml-3 z-0 ${
                  step.completed ? 'bg-afflyt-cyan-400' : 'bg-gray-700'
                }`} />
              )}

              <GlassCard 
                className={`relative z-10 p-6 ${
                  isActive 
                    ? 'border-afflyt-cyan-500/40 shadow-[0_0_30px_rgba(0,229,224,0.2)]' 
                    : step.completed 
                    ? 'border-afflyt-profit-400/30'
                    : 'border-afflyt-glass-border'
                } transition-all duration-500`}
              >
                {/* Step Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Step Number/Check */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold ${
                      step.completed
                        ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400'
                        : isActive
                        ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400 animate-pulse'
                        : 'bg-afflyt-dark-50 text-gray-600'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      step.completed
                        ? 'bg-afflyt-profit-400/10'
                        : isActive
                        ? 'bg-afflyt-cyan-500/10'
                        : 'bg-afflyt-dark-50'
                    }`}>
                      <step.icon className={`w-5 h-5 ${
                        step.completed
                          ? 'text-afflyt-profit-400'
                          : isActive
                          ? 'text-afflyt-cyan-400'
                          : 'text-gray-600'
                      }`} />
                    </div>
                  </div>

                  {/* Time Badge */}
                  {!step.completed && (
                    <span className="px-2 py-1 bg-afflyt-dark-50 rounded text-xs text-gray-400">
                      ~{step.estimatedTime}
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {step.description}
                </p>

                {/* Details List */}
                <div className="space-y-2 mb-4">
                  {step.details.map((detail, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-afflyt-cyan-400 font-mono text-xs mt-0.5">
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      <span className="text-xs text-gray-500">{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {!step.completed ? (
                  <CyberButton
                    variant={isActive ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full justify-center"
                    disabled={!isActive}
                    onClick={() => window.location.href = step.action.path}
                  >
                    {step.action.label}
                    <ArrowRight className="w-4 h-4" />
                  </CyberButton>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2 text-afflyt-profit-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Completato</span>
                  </div>
                )}
              </GlassCard>
            </div>
          );
        })}
      </div>

      {/* Helper Box */}
      <div className="mt-6 p-4 bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-afflyt-cyan-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white mb-1">
              Perché questi passi sono importanti?
            </p>
            <p className="text-xs text-gray-400">
              Ogni passo sblocca funzionalità critiche: i Canali permettono la pubblicazione, 
              le Credenziali attivano l'accesso ai dati Keepa in tempo reale, 
              e le Automazioni gestiscono tutto in automatico 24/7. 
              Una volta completata la configurazione, il sistema inizierà immediatamente a generare valore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 3. COMPONENTE KPI WIDGET

```tsx
// components/dashboard/KPIWidget.tsx
import { LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface KPIWidgetProps {
  title: string;
  icon: LucideIcon;
  mainValue: string;
  mainLabel: string;
  subValue?: string;
  subLabel?: string;
  trend?: {
    value: number;
    positive: boolean;
    label: string;
  };
  progress?: {
    value: number;
    label: string;
  };
  status?: 'good' | 'warning' | 'critical';
  activity?: {
    recentDeals: Array<{
      score: number;
      title: string;
      time: string;
    }>;
  };
  color: 'cyan' | 'plasma' | 'profit' | 'warning';
}

export const KPIWidget = ({
  title,
  icon: Icon,
  mainValue,
  mainLabel,
  subValue,
  subLabel,
  trend,
  progress,
  status,
  activity,
  color
}: KPIWidgetProps) => {
  const colorClasses = {
    cyan: 'text-afflyt-cyan-400 bg-afflyt-cyan-500/10',
    plasma: 'text-afflyt-plasma-400 bg-afflyt-plasma-500/10',
    profit: 'text-afflyt-profit-400 bg-afflyt-profit-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10'
  };

  const statusColors = {
    good: 'text-afflyt-profit-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };

  return (
    <GlassCard className="p-6 relative overflow-hidden group hover:border-afflyt-cyan-500/40 transition-all">
      {/* Background Glow Effect */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${colorClasses[color]} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[0]}`} />
            </div>
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          </div>
          
          {status && (
            <div className={`w-2 h-2 ${statusColors[status]} rounded-full ${
              status === 'critical' ? 'animate-pulse' : ''
            }`} />
          )}
        </div>

        {/* Main Value */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-white font-mono">{mainValue}</p>
          <p className="text-xs text-gray-500 mt-1">{mainLabel}</p>
        </div>

        {/* Secondary Value */}
        {subValue && (
          <div className="mb-3">
            <p className="text-lg font-medium text-gray-300 font-mono">{subValue}</p>
            <p className="text-xs text-gray-500">{subLabel}</p>
          </div>
        )}

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2 text-xs">
            <span className={trend.positive ? 'text-afflyt-profit-400' : 'text-red-400'}>
              {trend.positive ? '↑' : '↓'} {trend.value}%
            </span>
            <span className="text-gray-500">{trend.label}</span>
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="mt-3">
            <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${
                  progress.value > 80 
                    ? 'from-yellow-400 to-orange-400' 
                    : 'from-afflyt-cyan-500 to-afflyt-cyan-400'
                }`}
                style={{ width: `${progress.value}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress.label}</p>
          </div>
        )}

        {/* Activity List */}
        {activity && (
          <div className="mt-3 space-y-2">
            {activity.recentDeals.slice(0, 3).map((deal, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    deal.score >= 85 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-afflyt-cyan-500/20 text-afflyt-cyan-400'
                  }`}>
                    {deal.score}
                  </div>
                  <span className="text-gray-400 truncate max-w-[120px]">
                    {deal.title}
                  </span>
                </div>
                <span className="text-gray-600">{deal.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
```

## ACCEPTANCE CRITERIA ✅

### 1. **Onboarding in 3 Passi** ✓
- **Step 1**: Connetti Canale (Telegram/Discord)
- **Step 2**: Imposta Credenziali (Keepa + Amazon Tags)
- **Step 3**: Crea Prima Automazione
- **Progress Bar** visibile con tempo stimato
- **CTA chiare** che portano alle pagine giuste

### 2. **TTL & Governance** ✓
- **TTL del Piano** (72h) sempre visibile nell'header
- **Widget Limiti** con regole/offerte utilizzate vs max
- **Indicatori visivi** per stato (good/warning/critical)
- **Budget Keepa** con consumo e giorni rimanenti

### 3. **Core Value - Deal Score** ✓
- **Hot Deals Preview** con score visuali (colori gradient)
- **Score Medio** nelle statistiche rapide
- **Recent Activity** con gli ultimi deal pubblicati
- **Badge HOT** per deal con score ≥90

### 4. **NSM - Weekly Active Automations** ✓
- **WAA Counter** prominente nell'header (3/5 target)
- **Lista automazioni attive** con stato real-time
- **Performance metrics** per automazione
- **CTA per creazione** nuove automazioni

### 5. **Stati Dashboard Adaptive** ✓

**Stato NEW (Onboarding Focus)**:
- Hero welcome message prominente
- 3-step flow guidato con dettagli
- KPI minimal (placeholder o demo data)

**Stato PARTIAL (Mixed View)**:
- Onboarding con progress parziale
- KPI reali ma limitati
- Suggerimenti per completare setup

**Stato ACTIVE (Full Dashboard)**:
- No onboarding, solo KPI
- Hot Deals preview
- Automation performance
- Full statistics grid

### 6. **Design System Cyber Intelligence** ✓
- Glass morphism consistente
- Color coding (cyan/plasma/profit/warning)
- Font mono per dati numerici
- Animazioni pulse per stati live
- Corner cuts sui CTA principali

## FEATURES BONUS

1. **System Status Indicator**: LED verde "Sistema Attivo" con pulse
2. **Estimated Time**: Tempo rimanente per completare onboarding
3. **Value Proposition Box**: ROI e benefici visibili durante onboarding
4. **Quick Stats 24h**: Metriche rapide per utenti attivi
5. **API Calls Tracker**: Visualizzazione consumo Keepa real-time

La dashboard si adatta perfettamente allo stato dell'utente, guidando i nuovi verso la prima automazione (conversione) e mostrando il valore (Deal Score, ROI) agli utenti attivi! 🚀