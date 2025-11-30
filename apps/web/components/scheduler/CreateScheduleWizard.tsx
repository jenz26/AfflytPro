'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { API_BASE } from '@/lib/api/config';

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

interface CreateScheduleWizardProps {
  editingPost: ScheduledPost | null;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

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

export function CreateScheduleWizard({ editingPost, onComplete, onCancel }: CreateScheduleWizardProps) {
  const t = useTranslations('scheduler.wizard');
  const [step, setStep] = useState(1);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [showCustomCron, setShowCustomCron] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: editingPost?.name || '',
    type: editingPost?.type || 'CUSTOM',
    channelId: editingPost?.channel?.id || '',
    content: editingPost?.content || '',
    mediaUrl: editingPost?.mediaUrl || '',
    schedule: editingPost?.schedule || '0 9 * * *',
    timezone: editingPost?.timezone || 'Europe/Rome',
    conflictSettings: {
      skipIfDealPending: true,
      bufferMinutes: 10,
      rescheduleOnConflict: false,
      maxRescheduleMinutes: 60,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/user/channels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.name.trim()) newErrors.name = t('errors.nameRequired');
      if (!formData.type) newErrors.type = t('errors.typeRequired');
      if (!formData.channelId) newErrors.channelId = t('errors.channelRequired');
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
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      onComplete(formData);
    }
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
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-afflyt-glass-border">
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
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-afflyt-glass-border">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
                  <select
                    value={formData.channelId}
                    onChange={(e) => updateFormData('channelId', e.target.value)}
                    className={`w-full px-4 py-3 bg-afflyt-glass-white border rounded-lg text-white focus:outline-none ${
                      errors.channelId ? 'border-red-500' : 'border-afflyt-glass-border focus:border-afflyt-cyan-500'
                    }`}
                  >
                    <option value="">{t('placeholders.selectChannel')}</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name} ({channel.platform})
                      </option>
                    ))}
                  </select>
                )}
                {errors.channelId && <p className="text-red-400 text-sm mt-1">{errors.channelId}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Content */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.content')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => updateFormData('content', e.target.value)}
                  placeholder={t('placeholders.content')}
                  rows={8}
                  className={`w-full px-4 py-3 bg-afflyt-glass-white border rounded-lg text-white placeholder:text-gray-600 focus:outline-none resize-none ${
                    errors.content ? 'border-red-500' : 'border-afflyt-glass-border focus:border-afflyt-cyan-500'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {t('contentHelp')}
                  </p>
                  <p className={`text-xs ${formData.content.length > 4096 ? 'text-red-400' : 'text-gray-500'}`}>
                    {formData.content.length}/4096
                  </p>
                </div>
                {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
              </div>

              {/* Media URL (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.mediaUrl')} <span className="text-gray-500">({t('optional')})</span>
                </label>
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(e) => updateFormData('mediaUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
                />
              </div>

              {/* Variables Help */}
              <div className="p-4 bg-afflyt-glass-white rounded-lg">
                <p className="text-sm font-medium text-white mb-2">{t('variablesTitle')}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <code className="text-afflyt-cyan-400">{'{{date}}'}</code>
                  <span className="text-gray-400">{t('variables.date')}</span>
                  <code className="text-afflyt-cyan-400">{'{{time}}'}</code>
                  <span className="text-gray-400">{t('variables.time')}</span>
                  <code className="text-afflyt-cyan-400">{'{{channelName}}'}</code>
                  <span className="text-gray-400">{t('variables.channelName')}</span>
                  <code className="text-afflyt-cyan-400">{'{{link}}'}</code>
                  <span className="text-gray-400">{t('variables.link')}</span>
                </div>
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
            <div className="space-y-6">
              <div className="p-4 bg-afflyt-glass-white rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">{t('review.title')}</h3>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('fields.name')}</span>
                    <span className="text-white">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('fields.type')}</span>
                    <span className="text-white">
                      {POST_TYPES.find((t) => t.value === formData.type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('fields.channel')}</span>
                    <span className="text-white">
                      {channels.find((c) => c.id === formData.channelId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('fields.schedule')}</span>
                    <span className="text-white font-mono">{formData.schedule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('fields.timezone')}</span>
                    <span className="text-white">
                      {TIMEZONES.find((t) => t.value === formData.timezone)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-afflyt-glass-white rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">{t('review.contentPreview')}</h4>
                <p className="text-white text-sm whitespace-pre-wrap line-clamp-6">
                  {formData.content}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-afflyt-glass-border">
          <div>
            {step > 1 && (
              <CyberButton variant="ghost" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </CyberButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CyberButton variant="ghost" onClick={onCancel}>
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
      </GlassCard>
    </div>
  );
}
