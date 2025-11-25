# FVD 2: UX Design Settings Hub - Cyber Intelligence System 🔐

## 1. LAYOUT IMPOSTAZIONI HUB

```tsx
// app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { 
  User, 
  CreditCard, 
  Key, 
  Send, 
  Tag,
  Shield,
  ChevronRight,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

export default function SettingsHub() {
  const [activeSection, setActiveSection] = useState('profile');

  const settingsSections = [
    {
      id: 'profile',
      label: 'Profilo',
      icon: User,
      description: 'Informazioni personali e preferenze',
      status: 'completed',
      path: '/dashboard/settings/profile'
    },
    {
      id: 'billing',
      label: 'Fatturazione',
      icon: CreditCard,
      description: 'Piano, pagamenti e fatture',
      status: 'completed',
      path: '/dashboard/settings/billing'
    },
    {
      id: 'channels',
      label: 'Canali di Pubblicazione',
      icon: Send,
      description: 'Telegram, Discord e altre destinazioni',
      status: 'action_required',
      badge: '1 da configurare',
      path: '/dashboard/settings/channels'
    },
    {
      id: 'credentials',
      label: 'Credenziali API',
      icon: Key,
      description: 'Chiavi API sicure (BYOK)',
      status: 'secured',
      badge: '2 attive',
      path: '/dashboard/settings/credentials'
    },
    {
      id: 'tags',
      label: 'Tag Amazon',
      icon: Tag,
      description: 'I tuoi tag di affiliazione',
      status: 'completed',
      path: '/dashboard/settings/tags'
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-afflyt-profit-400';
      case 'action_required': return 'text-yellow-400';
      case 'secured': return 'text-afflyt-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return CheckCircle;
      case 'action_required': return AlertCircle;
      case 'secured': return Lock;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-afflyt-dark-100 pl-72"> {/* Accounting for sidebar */}
      {/* Header */}
      <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-afflyt-cyan-400" />
                Command Settings
              </h1>
              <p className="text-gray-400 mt-1">
                Centro di controllo per configurazioni e sicurezza
              </p>
            </div>
            
            {/* Security Score */}
            <GlassCard className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-afflyt-dark-100"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.85)}`}
                      className="text-afflyt-cyan-400 transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                    85%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Security Score</p>
                  <p className="text-afflyt-cyan-400 font-mono">Ottimo</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
          {settingsSections.map((section) => {
            const StatusIcon = getStatusIcon(section.status);
            
            return (
              <button
                key={section.id}
                onClick={() => window.location.href = section.path}
                className="group relative"
              >
                <GlassCard className="p-6 hover:border-afflyt-cyan-500/40 transition-all duration-300">
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-afflyt-cyan-500/0 via-afflyt-cyan-500/20 to-afflyt-cyan-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Icon Container */}
                      <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center group-hover:bg-afflyt-cyan-500/20 transition-colors">
                        <section.icon className="w-6 h-6 text-afflyt-cyan-400" />
                      </div>
                      
                      {/* Content */}
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white group-hover:text-afflyt-cyan-300 transition-colors">
                          {section.label}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {section.description}
                        </p>
                        
                        {section.badge && (
                          <span className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-afflyt-dark-100 rounded-full text-xs">
                            {StatusIcon && <StatusIcon className={`w-3 h-3 ${getStatusColor(section.status)}`} />}
                            <span className={getStatusColor(section.status)}>
                              {section.badge}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-afflyt-cyan-400 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </GlassCard>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8 max-w-6xl">
          <GlassCard className="p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">API Calls/24h</p>
            <p className="text-2xl font-bold text-white font-mono">12.4K</p>
            <p className="text-xs text-afflyt-profit-400 mt-1">↑ 23%</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Canali Attivi</p>
            <p className="text-2xl font-bold text-white font-mono">3</p>
            <p className="text-xs text-gray-400 mt-1">2 Telegram, 1 Discord</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Credenziali</p>
            <p className="text-2xl font-bold text-white font-mono">5</p>
            <p className="text-xs text-afflyt-cyan-400 mt-1">Tutte sicure</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Ultimo Accesso</p>
            <p className="text-2xl font-bold text-white font-mono">2m</p>
            <p className="text-xs text-gray-400 mt-1">Da Montagnana</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
```

## 2. PAGINA CREDENZIALI API (BYOK)

```tsx
// app/dashboard/settings/credentials/page.tsx
'use client';

import { useState } from 'react';
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2,
  Shield,
  CheckCircle,
  AlertTriangle,
  Bot,
  Cloud,
  ShoppingBag,
  ArrowLeft,
  Lock,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface Credential {
  id: string;
  name: string;
  type: 'telegram_bot' | 'keepa' | 'amazon_pa';
  value: string;
  lastUsed: string;
  status: 'active' | 'inactive' | 'expired';
  icon: any;
}

export default function CredentialsPage() {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCredential, setNewCredential] = useState({
    type: '',
    name: '',
    value: ''
  });

  const credentials: Credential[] = [
    {
      id: '1',
      name: 'Afflyt Telegram Bot',
      type: 'telegram_bot',
      value: '6789012345:ABCdefGHIjklMNOpqrsTUVwxyz1234567890',
      lastUsed: '2 minuti fa',
      status: 'active',
      icon: Bot
    },
    {
      id: '2',
      name: 'Keepa API Key',
      type: 'keepa',
      value: 'kp_1234567890abcdef1234567890abcdef',
      lastUsed: '1 ora fa',
      status: 'active',
      icon: Cloud
    }
  ];

  const credentialTypes = [
    {
      type: 'telegram_bot',
      label: 'Telegram Bot Token',
      icon: Bot,
      description: 'Token del tuo bot Telegram da @BotFather',
      placeholder: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz...',
      instructions: [
        'Apri Telegram e cerca @BotFather',
        'Invia il comando /newbot',
        'Scegli un nome e username per il bot',
        'Copia il token qui'
      ]
    },
    {
      type: 'keepa',
      label: 'Keepa API',
      icon: Cloud,
      description: 'Chiave API per accesso ai dati Keepa',
      placeholder: 'kp_xxxxxxxxxxxxx...'
    },
    {
      type: 'amazon_pa',
      label: 'Amazon PA API',
      icon: ShoppingBag,
      description: 'Credenziali Amazon Product Advertising',
      placeholder: 'AKIA...'
    }
  ];

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    // Show toast notification
  };

  const handleToggleVisibility = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-afflyt-dark-100 pl-72">
      {/* Header */}
      <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.href = '/dashboard/settings'}
                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Key className="w-6 h-6 text-afflyt-cyan-400" />
                  Credenziali API Vault
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Gestione sicura delle tue chiavi API (BYOK - Bring Your Own Key)
                </p>
              </div>
            </div>

            <CyberButton onClick={() => setIsAddingNew(true)} variant="primary">
              <Plus className="w-4 h-4" />
              Aggiungi Credenziale
            </CyberButton>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-8 pt-6">
        <GlassCard className="p-4 border-afflyt-cyan-500/30 bg-afflyt-cyan-500/5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-afflyt-cyan-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-afflyt-cyan-300 font-medium">
                Vault Sicuro End-to-End
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Le tue credenziali sono crittografate con AES-256 e mai condivise. 
                Solo tu hai accesso alle tue chiavi API.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Add New Credential Form */}
        {isAddingNew && (
          <GlassCard className="mb-6 p-6 border-afflyt-cyan-500/40">
            <h3 className="text-lg font-semibold text-white mb-4">
              Nuova Credenziale
            </h3>
            
            {/* Type Selection */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {credentialTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setNewCredential({ ...newCredential, type: type.type })}
                  className={`p-4 rounded-lg border transition-all ${
                    newCredential.type === type.type
                      ? 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/40 text-white'
                      : 'bg-afflyt-glass-white border-afflyt-glass-border text-gray-400 hover:border-afflyt-cyan-500/20'
                  }`}
                >
                  <type.icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{type.label}</p>
                </button>
              ))}
            </div>

            {/* Selected Type Details */}
            {newCredential.type && (
              <div className="space-y-4">
                {newCredential.type === 'telegram_bot' && (
                  <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
                    <p className="text-sm font-medium text-white mb-3">
                      Come ottenere il Token:
                    </p>
                    <ol className="space-y-2">
                      {credentialTypes[0].instructions?.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-afflyt-cyan-400 font-mono">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Identificativo
                    </label>
                    <input
                      type="text"
                      value={newCredential.name}
                      onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                      placeholder="es. Bot Produzione"
                      className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Valore Chiave/Token
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={newCredential.value}
                        onChange={(e) => setNewCredential({ ...newCredential, value: e.target.value })}
                        placeholder={credentialTypes.find(t => t.type === newCredential.type)?.placeholder}
                        className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-1 focus:ring-afflyt-cyan-500/50"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CyberButton variant="primary" className="flex-1">
                    <Lock className="w-4 h-4" />
                    Salva nel Vault
                  </CyberButton>
                  <CyberButton 
                    variant="ghost" 
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewCredential({ type: '', name: '', value: '' });
                    }}
                  >
                    Annulla
                  </CyberButton>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Existing Credentials */}
        <div className="space-y-4">
          {credentials.map((cred) => (
            <GlassCard key={cred.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-afflyt-cyan-500/10 rounded-lg flex items-center justify-center">
                    <cred.icon className="w-6 h-6 text-afflyt-cyan-400" />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {cred.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cred.status === 'active' 
                          ? 'bg-afflyt-profit-400/20 text-afflyt-profit-400' 
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {cred.status === 'active' ? 'Attiva' : 'Inattiva'}
                      </span>
                    </div>

                    {/* Value Display */}
                    <div className="flex items-center gap-2 mb-3">
                      <code className="flex-1 px-3 py-2 bg-afflyt-dark-50 rounded text-sm font-mono text-gray-400">
                        {showValues[cred.id] 
                          ? cred.value 
                          : '••••••••••••••••••••••••••••••••••••'}
                      </code>
                      
                      <button
                        onClick={() => handleToggleVisibility(cred.id)}
                        className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                      >
                        {showValues[cred.id] ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleCopy(cred.value, cred.id)}
                        className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Tipo: {cred.type.replace('_', ' ').toUpperCase()}</span>
                      <span>•</span>
                      <span>Ultimo uso: {cred.lastUsed}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 3. PAGINA CANALI DI PUBBLICAZIONE

```tsx
// app/dashboard/settings/channels/page.tsx
'use client';

import { useState } from 'react';
import { 
  Send, 
  Plus,
  Bot,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  ExternalLink,
  Copy,
  ChevronRight,
  Info
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface Channel {
  id: string;
  name: string;
  type: 'telegram' | 'discord' | 'slack';
  status: 'connected' | 'pending' | 'error';
  channelId?: string;
  botLinked?: boolean;
  messagesCount?: number;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      name: 'Offerte Tech Italia',
      type: 'telegram',
      status: 'connected',
      channelId: '@offertetechita',
      botLinked: true,
      messagesCount: 1247
    },
    {
      id: '2',
      name: 'Test Channel',
      type: 'telegram',
      status: 'pending',
      channelId: '@testchannel',
      botLinked: false
    }
  ]);

  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [newChannel, setNewChannel] = useState({
    type: 'telegram',
    name: '',
    channelId: '',
    botToken: ''
  });

  const channelTypes = [
    {
      type: 'telegram',
      icon: Send,
      label: 'Telegram',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      type: 'discord',
      icon: MessageSquare,
      label: 'Discord',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const telegramSetupSteps = [
    {
      step: 1,
      title: 'Crea il Bot',
      description: 'Configura il tuo bot Telegram',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-afflyt-dark-50 rounded-lg border border-afflyt-glass-border">
            <h4 className="text-sm font-medium text-white mb-3">
              Istruzioni per creare il bot:
            </h4>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-afflyt-cyan-400 font-mono text-sm">01.</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Apri Telegram e cerca <code className="px-2 py-1 bg-afflyt-dark-100 rounded text-afflyt-cyan-400">@BotFather</code>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-afflyt-cyan-400 font-mono text-sm">02.</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Invia il comando <code className="px-2 py-1 bg-afflyt-dark-100 rounded text-afflyt-cyan-400">/newbot</code>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-afflyt-cyan-400 font-mono text-sm">03.</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Scegli un nome (es: "Afflyt Deals Bot") e username (deve finire con "bot")
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-afflyt-cyan-400 font-mono text-sm">04.</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Copia il token che ricevi
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bot Token (dal BotFather)
            </label>
            <div className="relative">
              <input
                type="password"
                value={newChannel.botToken}
                onChange={(e) => setNewChannel({ ...newChannel, botToken: e.target.value })}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
              />
              <Bot className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400/50" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Il token verrà salvato nel Vault Credenziali in modo sicuro
            </p>
          </div>
        </div>
      )
    },
    {
      step: 2,
      title: 'Configura il Canale',
      description: 'Collega il bot al tuo canale',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome del Canale (per riferimento)
            </label>
            <input
              type="text"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              placeholder="es. Offerte Prime Day"
              className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channel ID o Username
            </label>
            <input
              type="text"
              value={newChannel.channelId}
              onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
              placeholder="@nomedelcanale o -1001234567890"
              className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              Usa @ per canali pubblici, o l'ID numerico per canali privati
            </p>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">
                  Importante: Aggiungi il bot come amministratore
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Il bot deve essere amministratore del canale con permessi di pubblicazione
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: 'Verifica e Attiva',
      description: 'Test della connessione',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-afflyt-cyan-300 mb-3">
              Riepilogo Configurazione
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bot Token:</span>
                <span className="text-white font-mono">•••••••••:ABC***xyz</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Canale:</span>
                <span className="text-white">{newChannel.name || 'Non specificato'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Channel ID:</span>
                <span className="text-white font-mono">{newChannel.channelId || 'Non specificato'}</span>
              </div>
            </div>
          </div>

          <CyberButton variant="primary" className="w-full justify-center">
            <CheckCircle className="w-4 h-4" />
            Test Connessione e Attiva
          </CyberButton>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Invieremo un messaggio di test al canale per verificare la configurazione
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-afflyt-dark-100 pl-72">
      {/* Header */}
      <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.href = '/dashboard/settings'}
                className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Send className="w-6 h-6 text-afflyt-cyan-400" />
                  Canali di Pubblicazione
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Gestisci le destinazioni per le tue offerte
                </p>
              </div>
            </div>

            <CyberButton onClick={() => setIsAddingChannel(true)} variant="primary">
              <Plus className="w-4 h-4" />
              Aggiungi Canale
            </CyberButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Add Channel Flow */}
        {isAddingChannel && (
          <GlassCard className="mb-6 p-6 border-afflyt-cyan-500/40">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {telegramSetupSteps.map((s, index) => (
                <div key={s.step} className="flex items-center">
                  <div className={`flex items-center gap-3 ${setupStep >= s.step ? 'text-afflyt-cyan-400' : 'text-gray-600'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm ${
                      setupStep >= s.step 
                        ? 'border-afflyt-cyan-400 bg-afflyt-cyan-500/20' 
                        : 'border-gray-600'
                    }`}>
                      {setupStep > s.step ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        s.step
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.description}</p>
                    </div>
                  </div>
                  {index < telegramSetupSteps.length - 1 && (
                    <div className={`w-full max-w-[100px] h-0.5 mx-4 ${
                      setupStep > s.step ? 'bg-afflyt-cyan-400' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="mb-6">
              {telegramSetupSteps[setupStep - 1].content}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              {setupStep > 1 && (
                <CyberButton 
                  variant="ghost" 
                  onClick={() => setSetupStep(setupStep - 1)}
                >
                  Indietro
                </CyberButton>
              )}
              
              <div className="ml-auto flex gap-3">
                <CyberButton 
                  variant="ghost" 
                  onClick={() => {
                    setIsAddingChannel(false);
                    setSetupStep(1);
                    setNewChannel({ type: 'telegram', name: '', channelId: '', botToken: '' });
                  }}
                >
                  Annulla
                </CyberButton>
                
                {setupStep < 3 && (
                  <CyberButton 
                    variant="primary"
                    onClick={() => setSetupStep(setupStep + 1)}
                    disabled={
                      (setupStep === 1 && !newChannel.botToken) ||
                      (setupStep === 2 && (!newChannel.name || !newChannel.channelId))
                    }
                  >
                    Continua
                    <ChevronRight className="w-4 h-4" />
                  </CyberButton>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Existing Channels */}
        <div className="grid grid-cols-1 gap-4">
          {channels.map((channel) => {
            const typeConfig = channelTypes.find(t => t.type === channel.type);
            
            return (
              <GlassCard key={channel.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${typeConfig?.bgColor} rounded-lg flex items-center justify-center`}>
                      {typeConfig && <typeConfig.icon className={`w-6 h-6 ${typeConfig.color}`} />}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {channel.name}
                        </h3>
                        {channel.status === 'connected' ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Connesso
                          </span>
                        ) : channel.status === 'pending' ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Bot da aggiungere
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-400/20 text-red-400 text-xs rounded-full">
                            Errore
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="font-mono">{channel.channelId}</span>
                        {channel.messagesCount && (
                          <>
                            <span>•</span>
                            <span>{channel.messagesCount} messaggi inviati</span>
                          </>
                        )}
                        {!channel.botLinked && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-400">Bot non collegato</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-afflyt-glass-white rounded-lg transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-afflyt-glass-white rounded-lg border border-afflyt-glass-border">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-afflyt-cyan-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-gray-300 font-medium mb-1">
                Come funziona la pubblicazione?
              </p>
              <p className="text-gray-500">
                I deal che supereranno i tuoi filtri verranno automaticamente pubblicati sui canali attivi. 
                Puoi configurare template personalizzati per ogni canale nelle impostazioni avanzate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## ACCEPTANCE CRITERIA ✅

1. **Navigazione Chiara** ✓
   - Hub Settings con navigazione visuale alle sottosezioni
   - Breadcrumb e back button per tornare all'hub
   - Stati visuali per sezioni che richiedono azione

2. **Separazione BYOK/Canali** ✓
   - Credenziali API: vault sicuro per le chiavi
   - Canali: configurazione delle destinazioni
   - Flow guidato step-by-step per Telegram

3. **Sicurezza Percepita** ✓
   - Icone lucchetto e shield
   - Security score nell'hub
   - Messaggi che enfatizzano crittografia end-to-end
   - Mascheramento delle chiavi con toggle visibilità

4. **Stile Cyber Intelligence** ✓
   - Glass morphism consistente
   - Palette cyan/plasma mantenuta
   - Corner cuts sui bottoni
   - Font mono per dati sensibili

5. **Flow Telegram Completo** ✓
   - Step 1: Creazione bot con istruzioni chiare
   - Step 2: Configurazione canale
   - Step 3: Verifica e attivazione
   - Link chiaro tra Bot Token (Credentials) e Channel setup

Il design guida l'utente senza confusione: prima salva la chiave del bot nel Vault (Credenziali), poi la usa per configurare il canale (Canali). La separazione è logica e sicura! 🔐