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
      throw error; // Re-throw to let TemplateEditor handle it
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-afflyt-cyan-400" />
              {t('title')}
            </h1>
            <CyberButton
              variant="primary"
              onClick={handleCreateNew}
              disabled={isCreating}
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('newTemplate')}
            </CyberButton>
          </div>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
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
              <GlassCard padding="lg" className="md:col-span-2 lg:col-span-3">
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {tList('noTemplates')}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {tList('noTemplatesDesc')}
                  </p>
                  <CyberButton variant="primary" onClick={handleCreateNew}>
                    <Plus className="w-5 h-5 mr-2" />
                    {tList('createFirst')}
                  </CyberButton>
                </div>
              </GlassCard>
            ) : (
              templates.map((template) => (
                <GlassCard
                  key={template.id}
                  padding="lg"
                  className="hover:border-afflyt-cyan-500/50 transition-colors cursor-pointer relative"
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
                          ✨ AI
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
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                    <CyberButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
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
    </div>
  );
}
