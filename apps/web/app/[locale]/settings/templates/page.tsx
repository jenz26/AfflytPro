'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { PlanType } from '@/components/dashboard/PlanBadge';
import { MessageSquare, Plus, Trash2, Edit } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';

interface MessageTemplate {
  id: string;
  name: string;
  template: string;
  useAI: boolean;
  aiPrompt?: string;
  aiTone?: string;
  isDefault: boolean;
  createdAt: string;
}

export default function TemplatesPage() {
  const t = useTranslations('templates');
  const tList = useTranslations('templates.list');
  const tDelete = useTranslations('templates.delete');
  const tSave = useTranslations('templates.save');

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<PlanType>('FREE');

  // Fetch templates and user plan on mount
  useEffect(() => {
    fetchTemplates();
    fetchUserPlan();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      // TODO: Replace with actual user API endpoint
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data.plan || 'FREE');
      }
    } catch (error) {
      console.error('Failed to fetch user plan:', error);
    }
  };

  const handleSaveTemplate = async (data: {
    template: string;
    useAI: boolean;
    aiPrompt?: string;
    aiTone?: string;
  }) => {
    try {
      const url = selectedTemplate
        ? `/api/templates/${selectedTemplate.id}`
        : '/api/templates';

      const response = await fetch(url, {
        method: selectedTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplate?.name || 'New Template',
          ...data,
        }),
      });

      if (response.ok) {
        await fetchTemplates();
        setSelectedTemplate(null);
        setIsCreating(false);
        alert(tSave('success'));
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm(tDelete('confirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTemplates();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert(tDelete('error'));
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-afflyt-dark-50 rounded w-64"></div>
        <div className="h-96 bg-afflyt-dark-50 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">{t('subtitle')}</p>
        <CyberButton
          variant="primary"
          onClick={handleCreateNew}
          disabled={isCreating}
        >
          <Plus className="w-4 h-4" />
          {t('newTemplate')}
        </CyberButton>
      </div>

      {/* Content */}
      {selectedTemplate || isCreating ? (
        <div>
          <div className="mb-4">
            <CyberButton
              variant="ghost"
              onClick={() => {
                setSelectedTemplate(null);
                setIsCreating(false);
              }}
            >
              ← {t('backToList')}
            </CyberButton>
          </div>
          <TemplateEditor
            initialTemplate={selectedTemplate?.template}
            initialUseAI={selectedTemplate?.useAI}
            initialAIPrompt={selectedTemplate?.aiPrompt}
            initialAITone={selectedTemplate?.aiTone}
            onSave={handleSaveTemplate}
            userPlan={userPlan}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <GlassCard className="md:col-span-2 lg:col-span-3 p-12">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  {tList('noTemplates')}
                </h3>
                <p className="text-gray-400 mb-6">
                  {tList('noTemplatesDesc')}
                </p>
                <CyberButton variant="primary" onClick={handleCreateNew}>
                  <Plus className="w-4 h-4" />
                  {tList('createFirst')}
                </CyberButton>
              </div>
            </GlassCard>
          ) : (
            templates.map((template) => (
              <GlassCard
                key={template.id}
                className="p-6 hover:border-afflyt-cyan-500/50 transition-colors cursor-pointer relative"
              >
                {/* Default Badge */}
                {template.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-afflyt-cyan-500/20 text-afflyt-cyan-300 text-xs font-bold rounded">
                      {tList('defaultBadge')}
                    </span>
                  </div>
                )}

                <div onClick={() => handleSelectTemplate(template)}>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {template.name}
                  </h3>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400 line-clamp-4 font-mono">
                      {template.template.substring(0, 120)}...
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.useAI && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded flex items-center gap-1">
                        AI
                      </span>
                    )}
                    {template.aiTone && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {template.aiTone}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    {tList('createdOn')} {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-afflyt-glass-border">
                  <CyberButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4" />
                    {tList('actions.edit')}
                  </CyberButton>
                  {!template.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}
    </div>
  );
}
