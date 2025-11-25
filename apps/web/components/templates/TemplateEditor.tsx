'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { TelegramPreview } from './TelegramPreview';
import { PlanType } from '@/components/dashboard/PlanBadge';
import { UpgradePrompt } from '@/components/upsell/UpgradePrompt';
import {
  Sparkles,
  Type,
  Wand2,
  Save,
  RotateCcw,
  Tag,
  Euro,
  Percent,
  Star,
  MessageSquare,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface TemplateEditorProps {
  initialTemplate?: string;
  initialUseAI?: boolean;
  initialAIPrompt?: string;
  initialAITone?: string;
  onSave: (data: {
    template: string;
    useAI: boolean;
    aiPrompt?: string;
    aiTone?: string;
  }) => Promise<void>;
  userPlan: PlanType;
}

// Default templates by locale (can't use next-intl for this due to {} conflicts)
const DEFAULT_TEMPLATES = {
  it: `🔥 *{title}*

💰 Prezzo: €{price} ~~€{originalPrice}~~
💸 Risparmi: €{savings} (-{discount}%)
⭐ Rating: {rating}/5 ({reviewCount} recensioni)

{aiDescription}

👉 [Vedi su Amazon](LINK)

_#Ad | Deal trovato da Afflyt Pro 🤖_`,
  en: `🔥 *{title}*

💰 Price: €{price} ~~€{originalPrice}~~
💸 You save: €{savings} (-{discount}%)
⭐ Rating: {rating}/5 ({reviewCount} reviews)

{aiDescription}

👉 [View on Amazon](LINK)

_#Ad | Deal found by Afflyt Pro 🤖_`
};

const VARIABLES = [
  { key: '{title}', icon: Type },
  { key: '{price}', icon: Euro },
  { key: '{originalPrice}', icon: Tag },
  { key: '{discount}', icon: Percent },
  { key: '{savings}', icon: Euro },
  { key: '{rating}', icon: Star },
  { key: '{reviewCount}', icon: MessageSquare },
  { key: '{category}', icon: Tag },
  { key: '{aiDescription}', icon: Sparkles, requiresPlan: 'PRO' as PlanType },
];

export function TemplateEditor({
  initialTemplate,
  initialUseAI = false,
  initialAIPrompt = '',
  initialAITone = 'enthusiastic',
  onSave,
  userPlan,
}: TemplateEditorProps) {
  const locale = useLocale();
  const t = useTranslations('templates');
  const tEditor = useTranslations('templates.editor');
  const tAI = useTranslations('templates.ai');
  const tUpgrade = useTranslations('templates.upgrade');

  // Get default template based on locale
  const DEFAULT_TEMPLATE = DEFAULT_TEMPLATES[locale as keyof typeof DEFAULT_TEMPLATES] || DEFAULT_TEMPLATES.it;

  const [template, setTemplate] = useState(initialTemplate || DEFAULT_TEMPLATE);
  const [useAI, setUseAI] = useState(initialUseAI);
  const [aiPrompt, setAIPrompt] = useState(initialAIPrompt);
  const [aiTone, setAITone] = useState(initialAITone);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGeneratedPreview, setAIGeneratedPreview] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showAIUpgrade, setShowAIUpgrade] = useState(false);

  const canUseAI = userPlan === 'PRO' || userPlan === 'BUSINESS';

  const AI_TONES = [
    { value: 'professional', emoji: '💼' },
    { value: 'enthusiastic', emoji: '🎉' },
    { value: 'casual', emoji: '😎' },
    { value: 'urgent', emoji: '⚡' },
    { value: 'technical', emoji: '🔧' },
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = template;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newTemplate = before + variable + after;
      setTemplate(newTemplate);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleReset = () => {
    if (confirm(tEditor('resetConfirm'))) {
      setTemplate(DEFAULT_TEMPLATE);
      setUseAI(false);
      setAIPrompt('');
      setAITone('enthusiastic');
      setAIGeneratedPreview('');
    }
  };

  const handleGeneratePreview = async () => {
    if (!canUseAI) {
      setShowAIUpgrade(true);
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: 'Echo Dot (5ª generazione) | Altoparlante intelligente...',
          category: 'Elettronica',
          price: 24.99,
          originalPrice: 64.99,
          customPrompt: aiPrompt || undefined,
          tone: aiTone,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate preview');

      const { description } = await response.json();
      setAIGeneratedPreview(description);
    } catch (error) {
      console.error('Failed to generate AI preview:', error);
      alert(t('save.error'));
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSave = async () => {
    // Validate template has required variables
    if (!template.includes('{title}')) {
      alert(tEditor('validation.titleRequired'));
      return;
    }

    if (useAI && !template.includes('{aiDescription}')) {
      alert(tEditor('validation.aiMissing'));
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        template,
        useAI: canUseAI ? useAI : false,
        aiPrompt: useAI && canUseAI ? aiPrompt : undefined,
        aiTone: useAI && canUseAI ? aiTone : undefined,
      });
    } catch (error) {
      console.error('Failed to save template:', error);
      alert(t('save.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upgrade prompt for AI features */}
      {showAIUpgrade && (
        <div className="mb-6">
          <UpgradePrompt
            currentPlan={userPlan}
            feature={tUpgrade('feature')}
            message={tUpgrade('message')}
            benefits={[
              tUpgrade('benefits.descriptions'),
              tUpgrade('benefits.customize'),
              tUpgrade('benefits.prompts'),
              tUpgrade('benefits.testing'),
            ]}
            variant="banner"
            onClose={() => setShowAIUpgrade(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="space-y-6">
          {/* Template Editor */}
          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Type className="w-5 h-5 text-afflyt-cyan-400" />
                {tEditor('title')}
              </h3>
              <CyberButton
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {tEditor('reset')}
              </CyberButton>
            </div>

            {/* Variable Buttons */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">{tEditor('variables.title')}:</p>
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((variable) => {
                  const Icon = variable.icon;
                  const isLocked = variable.requiresPlan && !canUseAI;
                  // Get translation key
                  const varKey = variable.key.replace('{', '').replace('}', '');
                  const varLabel = varKey === 'title' ? 'title_var' : varKey;

                  return (
                    <button
                      key={variable.key}
                      onClick={() => {
                        if (isLocked) {
                          setShowAIUpgrade(true);
                        } else {
                          insertVariable(variable.key);
                        }
                      }}
                      disabled={isLocked}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono
                        transition-colors
                        ${isLocked
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                          : 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300 hover:bg-afflyt-cyan-500/30'
                        }
                      `}
                      title={tEditor(`variables.${varLabel}`)}
                    >
                      <Icon className="w-3 h-3" />
                      {variable.key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id="template-textarea"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-64 bg-gray-900 text-white rounded-lg p-4 font-mono text-sm border border-gray-700 focus:border-afflyt-cyan-500 focus:outline-none resize-none"
              placeholder={tEditor('placeholder')}
              spellCheck={false}
            />

            <p className="text-xs text-gray-500 mt-2">
              {tEditor('markdownHint')}
            </p>
          </GlassCard>

          {/* AI Settings */}
          <GlassCard padding="lg" className={!canUseAI ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">{tAI('title')}</h3>
                {!canUseAI && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded">
                    {tAI('proBadge')}
                  </span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => {
                    if (!canUseAI) {
                      setShowAIUpgrade(true);
                      return;
                    }
                    setUseAI(e.target.checked);
                  }}
                  className="sr-only peer"
                  disabled={!canUseAI}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-afflyt-cyan-500"></div>
              </label>
            </div>

            {useAI && canUseAI && (
              <div className="space-y-4">
                {/* AI Tone */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    {tAI('toneLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_TONES.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => setAITone(tone.value)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${aiTone === tone.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }
                        `}
                      >
                        {tone.emoji} {tAI(`tones.${tone.value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    {tAI('customPromptLabel')}
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    className="w-full h-20 bg-gray-900 text-white rounded-lg p-3 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                    placeholder={tAI('customPromptPlaceholder')}
                  />
                </div>

                {/* Generate Preview Button */}
                <CyberButton
                  variant="secondary"
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview}
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isGeneratingPreview ? tAI('generating') : tAI('generatePreview')}
                </CyberButton>

                <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-300">
                    {tAI('hint')}
                  </p>
                </div>
              </div>
            )}

            {!canUseAI && (
              <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-bold mb-1">
                    {tAI('unlock.title')}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    {tAI('unlock.description')}
                  </p>
                  <CyberButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAIUpgrade(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {tAI('unlock.upgradeButton')}
                  </CyberButton>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Save Button */}
          <CyberButton
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? tEditor('saving') : tEditor('save')}
          </CyberButton>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-6 h-fit">
          <TelegramPreview
            template={template}
            useAI={useAI && canUseAI}
            aiGeneratedText={aiGeneratedPreview}
            sampleData={{
              title: 'Echo Dot (5ª generazione) | Altoparlante intelligente...',
              price: 24.99,
              originalPrice: 64.99,
              discount: 62,
              rating: 4.7,
              reviewCount: 89543,
              savings: 40.00,
              category: 'Elettronica',
            }}
          />
        </div>
      </div>
    </div>
  );
}
