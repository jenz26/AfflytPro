'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MessageSquare,
  Clock,
  Settings,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
  Type,
  Link as LinkIcon,
  Image,
  Loader2,
  Send,
} from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';
import { Analytics } from '@/components/analytics/PostHogProvider';
import { parseCronToHumanReadable, formatContentPreview } from '@/lib/utils/cron-parser';

// Types
interface ScheduledPost {
  id: string;
  name: string;
  type: string;
  content: string;
  mediaUrl?: string;
  schedule: string;
  timezone: string;
  isActive: boolean;
  channelId?: string;
  channel?: {
    id: string;
    name: string;
    platform: string;
  };
}

interface Channel {
  id: string;
  name: string;
  platform: string;
  channelId: string;
}

interface ChannelWithTag extends Channel {
  amazonTag?: string;
}

interface AffiliateTag {
  id: string;
  tag: string;
  label: string;
  marketplace: string;
  isDefault: boolean;
}

const BOUNTY_TEMPLATES = [
  { id: 'prime', name: 'Amazon Prime', url: 'https://www.amazon.it/amazonprime', emoji: '📦' },
  { id: 'audible', name: 'Audible', url: 'https://www.amazon.it/hz/audible', emoji: '🎧' },
  { id: 'kindle', name: 'Kindle Unlimited', url: 'https://www.amazon.it/kindle-unlimited', emoji: '📚' },
  { id: 'music', name: 'Amazon Music', url: 'https://www.amazon.it/music/unlimited', emoji: '🎵' },
  { id: 'kids', name: 'Kids+', url: 'https://www.amazon.it/amazonkidsplus', emoji: '👶' },
  { id: 'custom', name: 'URL Personalizzato', url: '', emoji: '🔗' },
];

interface CreateScheduleWizardProps {
  editingPost: ScheduledPost | null;
  onComplete: (data: any) => void;
  onCancel: () => void;
  onTestPublish?: (data: any) => Promise<void>;
}

// Content Variables for click-to-insert
const CONTENT_VARIABLES = [
  { key: '{{date}}', label: 'Data corrente', icon: Calendar },
  { key: '{{time}}', label: 'Ora corrente', icon: Clock },
];

// Default content templates for each bounty type
const BOUNTY_CONTENT_TEMPLATES: Record<string, string> = {
  'prime': '📦 *Prova Amazon Prime GRATIS per 30 giorni!*\n\n✅ Spedizioni illimitate in 1 giorno\n✅ Prime Video incluso\n✅ Amazon Music\n✅ Prime Reading\n\n👉 Attiva ora: {{link}}\n\n_Offerta riservata ai nuovi iscritti_',
  'audible': '🎧 *Prova Audible GRATIS per 30 giorni!*\n\n📚 1 audiolibro gratis a scelta\n🎁 Accesso a migliaia di podcast\n📱 Ascolta ovunque, anche offline\n\n👉 Inizia ora: {{link}}\n\n_Puoi disdire quando vuoi_',
  'kindle': '📚 *Kindle Unlimited - 30 giorni GRATIS!*\n\n📖 Oltre 1 milione di eBook\n🎧 Migliaia di audiolibri\n📰 Riviste incluse\n\n👉 Prova gratis: {{link}}\n\n_Leggi senza limiti_',
  'music': '🎵 *Amazon Music Unlimited GRATIS!*\n\n🎶 100 milioni di brani HD\n📱 Ascolta offline\n🔊 Audio spaziale e HD\n\n👉 Prova 30 giorni gratis: {{link}}\n\n_Cancella quando vuoi_',
  'kids': '👶 *Amazon Kids+ - Prova GRATUITA!*\n\n📚 Migliaia di libri per bambini\n🎮 App e giochi educativi\n🎬 Video per tutte le età\n👨‍👩‍👧‍👦 Controllo genitori incluso\n\n👉 Attiva ora: {{link}}',
  'custom': '🎁 *Offerta speciale!*\n\n👉 {{link}}',
};

const POST_TYPES = [
  { value: 'CUSTOM', label: 'Custom Content', description: 'Testo libero programmato' },
  { value: 'BOUNTY', label: 'Bounty Link', description: 'Link bounty Amazon (Prime, Audible, etc.)' },
  { value: 'RECAP', label: 'Daily Recap', description: 'Top deals delle ultime 24h' },
  { value: 'CROSS_PROMO', label: 'Cross Promo', description: 'Promozione altri canali' },
  { value: 'WELCOME', label: 'Welcome Message', description: 'Messaggio di benvenuto' },
  { value: 'SPONSORED', label: 'Sponsored', description: 'Contenuto sponsorizzato' },
];

const SCHEDULE_PRESETS = [
  { value: '0 9 * * *', label: 'Ogni giorno alle 9:00' },
  { value: '0 12 * * *', label: 'Ogni giorno alle 12:00' },
  { value: '0 18 * * *', label: 'Ogni giorno alle 18:00' },
  { value: '0 21 * * *', label: 'Ogni giorno alle 21:00' },
  { value: '0 9 * * 1-5', label: 'Giorni feriali alle 9:00' },
  { value: '0 10 * * 0', label: 'Ogni domenica alle 10:00' },
  { value: '0 */6 * * *', label: 'Ogni 6 ore' },
  { value: 'custom', label: 'Personalizzato...' },
];

const TIMEZONES = [
  { value: 'Europe/Rome', label: 'Roma (CET/CEST)' },
  { value: 'Europe/London', label: 'Londra (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Parigi (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlino (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'UTC', label: 'UTC' },
];

export function CreateScheduleWizard({ editingPost, onComplete, onCancel, onTestPublish }: CreateScheduleWizardProps) {
  const t = useTranslations('scheduler.wizard');
  const [step, setStep] = useState(1);
  const [channels, setChannels] = useState<ChannelWithTag[]>([]);
  const [affiliateTags, setAffiliateTags] = useState<AffiliateTag[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [showCustomCron, setShowCustomCron] = useState(false);
  const [showCustomBountyUrl, setShowCustomBountyUrl] = useState(false);
  const [isTestPublishing, setIsTestPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: editingPost?.name || '',
    type: editingPost?.type || 'CUSTOM',
    channelId: editingPost?.channel?.id || '',
    content: editingPost?.content || '',
    mediaUrl: editingPost?.mediaUrl || '',
    schedule: editingPost?.schedule || '0 9 * * *',
    timezone: editingPost?.timezone || 'Europe/Rome',
    // Bounty-specific settings
    bountyTemplate: 'prime',
    bountyUrl: '',
    affiliateTagId: '',
    conflictSettings: {
      skipIfDealPending: true,
      bufferMinutes: 10,
      rescheduleOnConflict: false,
      maxRescheduleMinutes: 60,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    // Track wizard opened
    Analytics.track('schedule_wizard_opened', {
      is_edit: !!editingPost,
      initial_type: editingPost?.type || 'CUSTOM',
    });
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch channels and affiliate tags in parallel
      const [channelsRes, tagsRes] = await Promise.all([
        fetch(`${API_BASE}/user/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/user/affiliate-tags`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const channelsData = await channelsRes.json();
      setChannels(channelsData.channels || []);

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAffiliateTags(tagsData.tags || []);

        // Auto-select default tag if none selected
        if (!formData.affiliateTagId) {
          const defaultTag = (tagsData.tags || []).find((t: AffiliateTag) => t.isDefault);
          if (defaultTag) {
            setFormData(prev => ({ ...prev, affiliateTagId: defaultTag.id }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Get the selected affiliate tag
  const selectedTag = affiliateTags.find(t => t.id === formData.affiliateTagId);

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.name.trim()) newErrors.name = t('errors.nameRequired');
      if (!formData.type) newErrors.type = t('errors.typeRequired');
      if (!formData.channelId) newErrors.channelId = t('errors.channelRequired');
      // Bounty-specific validation
      if (formData.type === 'BOUNTY') {
        if (formData.bountyTemplate === 'custom' && !formData.bountyUrl.trim()) {
          newErrors.bountyUrl = t('errors.bountyUrlRequired') || 'URL bounty richiesto';
        }
        // Check if affiliate tag is selected
        if (!formData.affiliateTagId) {
          newErrors.affiliateTagId = t('errors.affiliateTagRequired') || 'Seleziona un tag affiliato per i post bounty';
        }
      }
    }

    if (stepNum === 2) {
      if (!formData.content.trim()) newErrors.content = t('errors.contentRequired');
      if (formData.content.length > 4096) newErrors.content = t('errors.contentTooLong');
    }

    if (stepNum === 3) {
      if (!formData.schedule.trim()) newErrors.schedule = t('errors.scheduleRequired');
      // Basic cron validation
      const parts = formData.schedule.trim().split(/\s+/);
      if (parts.length !== 5) newErrors.schedule = t('errors.invalidCron');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      // Track step completion
      Analytics.track('schedule_wizard_step_completed', {
        step: step,
        step_name: steps[step - 1]?.label || `Step ${step}`,
        type: formData.type,
        bounty_template: formData.type === 'BOUNTY' ? formData.bountyTemplate : null,
      });
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      // Track wizard completion
      Analytics.track('schedule_wizard_completed', {
        is_edit: !!editingPost,
        type: formData.type,
        bounty_template: formData.type === 'BOUNTY' ? formData.bountyTemplate : null,
        schedule: formData.schedule,
        timezone: formData.timezone,
        has_media: !!formData.mediaUrl,
        content_length: formData.content.length,
      });
      onComplete(formData);
    }
  };

  const handleCancel = () => {
    // Track wizard abandoned
    Analytics.track('schedule_wizard_abandoned', {
      step: step,
      step_name: steps[step - 1]?.label || `Step ${step}`,
      is_edit: !!editingPost,
      type: formData.type,
      bounty_template: formData.type === 'BOUNTY' ? formData.bountyTemplate : null,
    });
    onCancel();
  };

  const handleTestPublish = async () => {
    if (!onTestPublish || !formData.channelId) return;

    setIsTestPublishing(true);
    try {
      await onTestPublish(formData);
    } finally {
      setIsTestPublishing(false);
    }
  };

  // Insert variable at cursor position in textarea
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newContent = before + variable + after;

    updateFormData('content', newContent);

    // Restore cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // Reset content to default template based on type
  const resetContent = () => {
    // For BOUNTY type, use the selected bounty template
    if (formData.type === 'BOUNTY') {
      const bountyContent = BOUNTY_CONTENT_TEMPLATES[formData.bountyTemplate] || BOUNTY_CONTENT_TEMPLATES['custom'];
      updateFormData('content', bountyContent);
      return;
    }

    const defaults: Record<string, string> = {
      'CUSTOM': '',
      'RECAP': '📊 *Top Deals di oggi {{date}}*\n\nEcco le migliori offerte trovate oggi:\n\n{{deals}}\n\n_Prezzi soggetti a variazione_',
      'CROSS_PROMO': '📢 *Ti consiglio questo canale!*\n\n[Inserisci nome e link del canale da promuovere]\n\n_Ci trovi sempre offerte pazzesche!_',
      'WELCOME': '👋 *Benvenuto nel canale!*\n\n🎯 Qui troverai le migliori offerte Amazon ogni giorno\n💰 Sconti verificati e aggiornati\n🔔 Attiva le notifiche per non perdere nulla!\n\n_Buon risparmio!_',
      'SPONSORED': '📌 *Contenuto sponsorizzato*\n\n[Inserisci il tuo messaggio qui]\n\n_#Ad #Sponsorizzato_',
    };
    updateFormData('content', defaults[formData.type] || '');
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const steps = [
    { num: 1, label: t('steps.basics'), icon: Settings },
    { num: 2, label: t('steps.content'), icon: MessageSquare },
    { num: 3, label: t('steps.schedule'), icon: Clock },
    { num: 4, label: t('steps.review'), icon: Check },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full max-h-[90vh] flex flex-col bg-afflyt-dark-50 border border-afflyt-glass-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-afflyt-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-afflyt-dark-100" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingPost ? t('editTitle') : t('createTitle')}
              </h2>
              <p className="text-sm text-gray-400">{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-afflyt-glass-border">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  step >= s.num ? 'text-afflyt-cyan-400' : 'text-gray-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step > s.num
                      ? 'bg-afflyt-cyan-500 text-white'
                      : step === s.num
                      ? 'bg-afflyt-cyan-500/20 border border-afflyt-cyan-500'
                      : 'bg-gray-700 text-gray-500'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className="text-sm hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder={t('placeholders.name')}
                  className={`w-full px-4 py-3 bg-afflyt-glass-white border rounded-lg text-white placeholder:text-gray-600 focus:outline-none ${
                    errors.name ? 'border-red-500' : 'border-afflyt-glass-border focus:border-afflyt-cyan-500'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.type')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {POST_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateFormData('type', type.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.type === type.value
                          ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                          : 'border-afflyt-glass-border hover:border-gray-500'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{type.label}</p>
                      <p className="text-xs text-gray-400">{type.description}</p>
                    </button>
                  ))}
                </div>
                {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
              </div>

              {/* Bounty Settings - only shown when BOUNTY type is selected */}
              {formData.type === 'BOUNTY' && (
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-purple-300">💎 Configurazione Bounty</p>

                  {/* Bounty Template Selection */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">
                      {t('fields.bountyTemplate') || 'Seleziona Bounty'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {BOUNTY_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            updateFormData('bountyTemplate', template.id);
                            if (template.id !== 'custom') {
                              updateFormData('bountyUrl', template.url);
                              setShowCustomBountyUrl(false);
                            } else {
                              updateFormData('bountyUrl', '');
                              setShowCustomBountyUrl(true);
                            }
                            // Auto-populate content with template
                            const contentTemplate = BOUNTY_CONTENT_TEMPLATES[template.id];
                            if (contentTemplate) {
                              updateFormData('content', contentTemplate);
                            }
                          }}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            formData.bountyTemplate === template.id
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-afflyt-glass-border hover:border-purple-500/50'
                          }`}
                        >
                          <span className="text-lg">{template.emoji}</span>
                          <p className="text-xs text-white mt-1">{template.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom URL input */}
                  {showCustomBountyUrl && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        URL Personalizzato
                      </label>
                      <input
                        type="url"
                        value={formData.bountyUrl}
                        onChange={(e) => updateFormData('bountyUrl', e.target.value)}
                        placeholder="https://www.amazon.it/..."
                        className={`w-full px-3 py-2 bg-afflyt-dark-100 border rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none ${
                          errors.bountyUrl ? 'border-red-500' : 'border-afflyt-glass-border focus:border-purple-500'
                        }`}
                      />
                      {errors.bountyUrl && <p className="text-red-400 text-xs mt-1">{errors.bountyUrl}</p>}
                    </div>
                  )}

                  {/* Affiliate Tag Selection */}
                  <div className="pt-2 border-t border-purple-500/20">
                    <label className="block text-xs text-gray-400 mb-2">
                      {t('fields.affiliateTag') || 'Tag Affiliato'}
                    </label>
                    {affiliateTags.length === 0 ? (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-xs text-yellow-400">
                          ⚠️ Nessun tag configurato. <a href="/settings/affiliate-tags" className="underline hover:text-yellow-300">Aggiungi un tag</a>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {affiliateTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => updateFormData('affiliateTagId', tag.id)}
                            className={`w-full p-2 rounded-lg border text-left transition-all ${
                              formData.affiliateTagId === tag.id
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-afflyt-glass-border hover:border-purple-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-white">{tag.label}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{tag.tag}</p>
                              </div>
                              {tag.isDefault && (
                                <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-300 text-[10px] rounded">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.affiliateTagId && (
                      <p className="text-red-400 text-xs mt-1">{errors.affiliateTagId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Channel */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.channel')}
                </label>
                {loadingChannels ? (
                  <div className="text-center py-4 text-gray-400">{t('loadingChannels')}</div>
                ) : channels.length === 0 ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400">{t('noChannels')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => updateFormData('channelId', channel.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                          formData.channelId === channel.id
                            ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                            : 'border-afflyt-glass-border hover:border-gray-500 bg-afflyt-glass-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          channel.platform === 'TELEGRAM'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {channel.platform === 'TELEGRAM' ? '📢' : '📱'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{channel.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 font-mono truncate">{channel.channelId}</p>
                            {channel.amazonTag && (
                              <span className="text-xs text-purple-400 font-mono">#{channel.amazonTag}</span>
                            )}
                          </div>
                        </div>
                        {formData.channelId === channel.id && (
                          <Check className="w-5 h-5 text-afflyt-cyan-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {errors.channelId && <p className="text-red-400 text-sm mt-1">{errors.channelId}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Content */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Type-specific instructions */}
              {formData.type === 'BOUNTY' && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm font-medium text-purple-300 mb-1">💎 Bounty Link</p>
                  <p className="text-xs text-gray-400">
                    {t('bountyHelp') || 'Scrivi il messaggio per il tuo bounty link. Il link affiliato verrà generato automaticamente. Usa {{link}} per posizionare il link.'}
                  </p>
                </div>
              )}

              {formData.type === 'RECAP' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm font-medium text-blue-300 mb-1">📊 Daily Recap</p>
                  <p className="text-xs text-gray-400">
                    {t('recapHelp') || 'Il recap giornaliero includerà automaticamente i top deals delle ultime 24h.'}
                  </p>
                </div>
              )}

              {/* Content Editor */}
              <div className="p-4 bg-afflyt-dark-100/50 rounded-lg border border-afflyt-glass-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <Type className="w-4 h-4 text-afflyt-cyan-400" />
                    {t('fields.content')}
                  </label>
                  <button
                    type="button"
                    onClick={resetContent}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Variable Buttons - Click to Insert */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">{t('variablesTitle') || 'Clicca per inserire'}:</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_VARIABLES.map((variable) => {
                      const Icon = variable.icon;
                      return (
                        <button
                          key={variable.key}
                          type="button"
                          onClick={() => insertVariable(variable.key)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono bg-afflyt-cyan-500/20 text-afflyt-cyan-300 hover:bg-afflyt-cyan-500/30 transition-colors"
                          title={variable.label}
                        >
                          <Icon className="w-3 h-3" />
                          {variable.key}
                        </button>
                      );
                    })}
                    {/* Type-specific variables */}
                    {formData.type === 'BOUNTY' && (
                      <button
                        type="button"
                        onClick={() => insertVariable('{{link}}')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                        title="Link affiliato bounty"
                      >
                        <LinkIcon className="w-3 h-3" />
                        {'{{link}}'}
                      </button>
                    )}
                    {formData.type === 'RECAP' && (
                      <button
                        type="button"
                        onClick={() => insertVariable('{{deals}}')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                        title="Lista top deals"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {'{{deals}}'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={formData.content}
                  onChange={(e) => updateFormData('content', e.target.value)}
                  placeholder={
                    formData.type === 'BOUNTY'
                      ? '🎁 Prova gratis Amazon Prime!\n\n30 giorni di spedizioni gratuite, Prime Video e molto altro.\n\n👉 {{link}}'
                      : formData.type === 'RECAP'
                      ? '📊 Top Deals di oggi {{date}}\n\nEcco le migliori offerte trovate oggi:\n\n{{deals}}'
                      : t('placeholders.content')
                  }
                  rows={10}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none resize-none ${
                    errors.content ? 'border-red-500' : 'border-gray-700 focus:border-afflyt-cyan-500'
                  }`}
                  spellCheck={false}
                />

                {/* Footer with character count */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Supporta *grassetto*, _corsivo_, [link](url)
                  </p>
                  <p className={`text-xs font-mono ${
                    formData.content.length > 4096
                      ? 'text-red-400'
                      : formData.content.length > 3500
                      ? 'text-yellow-400'
                      : 'text-gray-500'
                  }`}>
                    {formData.content.length}/4096
                  </p>
                </div>
                {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
              </div>

              {/* Media URL (optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Image className="w-4 h-4 text-gray-400" />
                  {t('fields.mediaUrl')} <span className="text-gray-500 text-xs">({t('optional')})</span>
                </label>
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(e) => updateFormData('mediaUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">URL immagine o GIF da allegare al messaggio</p>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Schedule Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.schedule')}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {SCHEDULE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        if (preset.value === 'custom') {
                          setShowCustomCron(true);
                        } else {
                          updateFormData('schedule', preset.value);
                          setShowCustomCron(false);
                        }
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.schedule === preset.value && !showCustomCron
                          ? 'border-afflyt-cyan-500 bg-afflyt-cyan-500/10'
                          : 'border-afflyt-glass-border hover:border-gray-500'
                      }`}
                    >
                      <p className="text-sm text-white">{preset.label}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Cron */}
                {showCustomCron && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('customCronLabel')}
                    </label>
                    <input
                      type="text"
                      value={formData.schedule}
                      onChange={(e) => updateFormData('schedule', e.target.value)}
                      placeholder="0 9 * * *"
                      className={`w-full px-4 py-3 bg-afflyt-glass-white border rounded-lg text-white font-mono placeholder:text-gray-600 focus:outline-none ${
                        errors.schedule ? 'border-red-500' : 'border-afflyt-glass-border focus:border-afflyt-cyan-500'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('cronHelp')}</p>
                  </div>
                )}
                {errors.schedule && <p className="text-red-400 text-sm mt-1">{errors.schedule}</p>}
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.timezone')}
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => updateFormData('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg text-white focus:outline-none focus:border-afflyt-cyan-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conflict Settings */}
              <div className="p-4 bg-afflyt-glass-white rounded-lg space-y-4">
                <p className="text-sm font-medium text-white">{t('conflictSettings.title')}</p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.conflictSettings.skipIfDealPending}
                    onChange={(e) =>
                      updateFormData('conflictSettings', {
                        ...formData.conflictSettings,
                        skipIfDealPending: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-600 text-afflyt-cyan-500 focus:ring-afflyt-cyan-500"
                  />
                  <span className="text-sm text-gray-300">{t('conflictSettings.skipIfDealPending')}</span>
                </label>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    {t('conflictSettings.bufferMinutes')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.conflictSettings.bufferMinutes}
                    onChange={(e) =>
                      updateFormData('conflictSettings', {
                        ...formData.conflictSettings,
                        bufferMinutes: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-24 px-3 py-2 bg-afflyt-dark-100 border border-afflyt-glass-border rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="p-4 bg-afflyt-glass-white rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">{t('review.title')}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-afflyt-glass-border">
                    <span className="text-gray-400 text-sm">{t('fields.name')}</span>
                    <span className="text-white font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-afflyt-glass-border">
                    <span className="text-gray-400 text-sm">{t('fields.type')}</span>
                    <span className="text-white">
                      {POST_TYPES.find((t) => t.value === formData.type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-afflyt-glass-border">
                    <span className="text-gray-400 text-sm">{t('fields.channel')}</span>
                    <span className="text-white">
                      {channels.find((c) => c.id === formData.channelId)?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-afflyt-glass-border">
                    <span className="text-gray-400 text-sm">{t('fields.schedule')}</span>
                    <div className="text-right">
                      <span className="text-white">{parseCronToHumanReadable(formData.schedule)}</span>
                      <p className="text-xs text-gray-500 font-mono">{formData.schedule}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">{t('fields.timezone')}</span>
                    <span className="text-white">
                      {TIMEZONES.find((t) => t.value === formData.timezone)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="p-4 bg-afflyt-glass-white rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">{t('review.contentPreview')}</h4>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-white text-sm whitespace-pre-wrap font-mono">
                    {formData.content ? formatContentPreview(formData.content) : <span className="text-gray-500 italic">Nessun contenuto</span>}
                  </p>
                </div>
                {(formData.content.includes('{{link}}') || formData.content.includes('{{deals}}') || formData.content.includes('{{date}}') || formData.content.includes('{{time}}')) && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Le variabili verranno sostituite al momento della pubblicazione
                  </p>
                )}
              </div>

              {/* Test Publish Button */}
              {onTestPublish && formData.channelId && (
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Play className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {t('review.testPublish') || 'Pubblica Ora'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {t('review.testPublishDesc') || 'Invia subito questo messaggio al canale selezionato'}
                        </p>
                      </div>
                    </div>
                    <CyberButton
                      variant="secondary"
                      onClick={handleTestPublish}
                      disabled={isTestPublishing}
                      className="bg-green-500/20 border-green-500/40 hover:bg-green-500/30 text-green-300"
                    >
                      {isTestPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Invio...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Invia Ora
                        </>
                      )}
                    </CyberButton>
                  </div>
                </div>
              )}

              {/* Warning if no channel selected */}
              {!formData.channelId && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Nessun canale selezionato. Il post verrà salvato ma non pubblicato.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between p-4 border-t border-afflyt-glass-border">
          <div>
            {step > 1 && (
              <CyberButton variant="ghost" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </CyberButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CyberButton variant="ghost" onClick={handleCancel}>
              {t('cancel')}
            </CyberButton>
            {step < 4 ? (
              <CyberButton variant="primary" onClick={handleNext}>
                {t('next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </CyberButton>
            ) : (
              <CyberButton variant="primary" onClick={handleSubmit}>
                {editingPost ? t('save') : t('create')}
              </CyberButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
