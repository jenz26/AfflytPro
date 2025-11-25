'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Search,
  Book,
  Zap,
  Link2,
  DollarSign,
  BarChart3,
  Video,
  MessageCircle,
  Mail,
  Calendar,
  ExternalLink,
  ChevronRight,
  FileText,
  HelpCircle,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Download,
  Key,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { CommandBar } from '@/components/navigation/CommandBar';

interface GuideSection {
  icon: any;
  title: string;
  description: string;
  guides: Guide[];
}

interface Guide {
  title: string;
  description: string;
  href: string;
  isNew?: boolean;
}

export default function HelpPage() {
  const t = useTranslations('help');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Links
  const quickLinks = [
    { title: t('quickLinks.telegram'), href: `/${locale}/help/guides/telegram-bot-setup` },
    { title: t('quickLinks.firstAutomation'), href: '#guide-automation' },
    { title: t('quickLinks.dealScore'), href: '#guide-score' },
    { title: t('quickLinks.apiLimits'), href: '#guide-limits' },
  ];

  // Knowledge Base Sections
  const sections: GuideSection[] = [
    {
      icon: BarChart3,
      title: t('sections.dashboard.title'),
      description: t('sections.dashboard.description'),
      guides: [
        { title: t('sections.dashboard.guides.readMetrics'), description: t('sections.dashboard.guides.readMetricsDesc'), href: '#dashboard-metrics' },
        { title: t('sections.dashboard.guides.dealScore'), description: t('sections.dashboard.guides.dealScoreDesc'), href: '#dashboard-score' },
        { title: t('sections.dashboard.guides.roi'), description: t('sections.dashboard.guides.roiDesc'), href: '#dashboard-roi' },
        { title: t('sections.dashboard.guides.export'), description: t('sections.dashboard.guides.exportDesc'), href: '#dashboard-export' },
      ]
    },
    {
      icon: Zap,
      title: t('sections.automations.title'),
      description: t('sections.automations.description'),
      guides: [
        { title: t('sections.automations.guides.createBasic'), description: t('sections.automations.guides.createBasicDesc'), href: '#automation-basic' },
        { title: t('sections.automations.guides.advancedFilters'), description: t('sections.automations.guides.advancedFiltersDesc'), href: '#automation-filters' },
        { title: t('sections.automations.guides.scheduling'), description: t('sections.automations.guides.schedulingDesc'), href: '#automation-scheduling' },
        { title: t('sections.automations.guides.troubleshooting'), description: t('sections.automations.guides.troubleshootingDesc'), href: '#automation-troubleshoot' },
      ]
    },
    {
      icon: Link2,
      title: t('sections.integrations.title'),
      description: t('sections.integrations.description'),
      guides: [
        { title: t('sections.integrations.guides.telegram'), description: t('sections.integrations.guides.telegramDesc'), href: `/${locale}/help/guides/telegram-bot-setup`, isNew: true },
        { title: t('sections.integrations.guides.discord'), description: t('sections.integrations.guides.discordDesc'), href: '#integration-discord' },
        { title: t('sections.integrations.guides.email'), description: t('sections.integrations.guides.emailDesc'), href: '#integration-email' },
        { title: t('sections.integrations.guides.webhooks'), description: t('sections.integrations.guides.webhooksDesc'), href: '#integration-webhooks' },
      ]
    },
    {
      icon: DollarSign,
      title: t('sections.monetization.title'),
      description: t('sections.monetization.description'),
      guides: [
        { title: t('sections.monetization.guides.bestPractices'), description: t('sections.monetization.guides.bestPracticesDesc'), href: '#monetization-practices' },
        { title: t('sections.monetization.guides.optimize'), description: t('sections.monetization.guides.optimizeDesc'), href: '#monetization-optimize' },
        { title: t('sections.monetization.guides.compliance'), description: t('sections.monetization.guides.complianceDesc'), href: '#monetization-compliance' },
        { title: t('sections.monetization.guides.multiChannel'), description: t('sections.monetization.guides.multiChannelDesc'), href: '#monetization-multichannel' },
      ]
    }
  ];

  // Common Issues
  const commonIssues = [
    {
      title: t('troubleshooting.issues.telegramNotPublishing'),
      severity: 'high' as const,
      solutions: [
        t('troubleshooting.solutions.checkPermissions'),
        t('troubleshooting.solutions.verifyToken'),
      ],
      guideLink: '#telegram-troubleshoot'
    },
    {
      title: t('troubleshooting.issues.lowDealScore'),
      severity: 'medium' as const,
      solutions: [
        t('troubleshooting.solutions.adjustFilters'),
        t('troubleshooting.solutions.changeCategories'),
      ],
      guideLink: '#score-optimization'
    },
    {
      title: t('troubleshooting.issues.apiLimitsReached'),
      severity: 'high' as const,
      solutions: [
        t('troubleshooting.solutions.monitorUsage'),
        t('troubleshooting.solutions.optimizeRules'),
      ],
      guideLink: '#api-limits'
    }
  ];

  return (
    <>
      <CommandBar />
      <div className="min-h-screen bg-afflyt-dark-900 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">

        {/* Hero Section with Search */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-afflyt-cyan-300 bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-300 mb-10">
            {t('hero.subtitle')}
          </p>

          {/* Search Bar - Improved visibility */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afflyt-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 bg-afflyt-glass-white border-2 border-afflyt-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-afflyt-cyan-500 focus:ring-2 focus:ring-afflyt-cyan-500/20 transition shadow-lg shadow-afflyt-cyan-500/10"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-gray-400 font-medium">{t('hero.popularLinks')}:</span>
            {quickLinks.map((link, index) => {
              const isExternalLink = link.href.startsWith('#');
              const Component = isExternalLink ? 'a' : Link;

              return (
              <Component
                key={index}
                href={link.href}
                className="text-sm px-4 py-2 bg-afflyt-glass-white border border-afflyt-cyan-500/30 rounded-lg text-afflyt-cyan-400 hover:bg-afflyt-cyan-500/10 hover:border-afflyt-cyan-500 hover:shadow-lg hover:shadow-afflyt-cyan-500/20 transition-all"
              >
                {link.title}
              </Component>
            )})}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-10">
            <GlassCard className="p-4 text-center border-afflyt-cyan-500/20">
              <div className="text-3xl font-bold text-afflyt-cyan-400 mb-1">47</div>
              <div className="text-sm text-gray-400">{t('hero.stats.guides')}</div>
            </GlassCard>
            <GlassCard className="p-4 text-center border-afflyt-profit-400/20">
              <div className="text-3xl font-bold text-afflyt-profit-400 mb-1">3 min</div>
              <div className="text-sm text-gray-400">{t('hero.stats.avgSolutionTime')}</div>
            </GlassCard>
            <GlassCard className="p-4 text-center border-afflyt-plasma-400/20">
              <div className="text-3xl font-bold text-afflyt-plasma-400 mb-1">94%</div>
              <div className="text-sm text-gray-400">{t('hero.stats.satisfaction')}</div>
            </GlassCard>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Knowledge Base Sections */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Book className="w-6 h-6 text-afflyt-cyan-400" />
                {t('knowledgeBase.title')}
              </h2>

              <div className="space-y-6">
                {sections.map((section, sectionIndex) => (
                  <GlassCard key={sectionIndex} className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-afflyt-cyan-500/20 to-afflyt-cyan-600/20 flex items-center justify-center shrink-0">
                        <section.icon className="w-6 h-6 text-afflyt-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.guides.map((guide, guideIndex) => {
                        const isExternalLink = guide.href.startsWith('#');
                        const Component = isExternalLink ? 'a' : Link;

                        return (
                        <Component
                          key={guideIndex}
                          href={guide.href}
                          className="group p-4 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg hover:bg-afflyt-dark-100 hover:border-afflyt-cyan-500/50 hover:shadow-lg hover:shadow-afflyt-cyan-500/10 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-white group-hover:text-afflyt-cyan-400 transition">
                              {guide.title}
                            </h4>
                            {guide.isNew && (
                              <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-bold rounded animate-pulse">
                                {t('badges.new')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            {guide.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-afflyt-cyan-400 font-medium group-hover:gap-2 transition-all">
                            {t('knowledgeBase.readMore')}
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </Component>
                      )})}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Troubleshooting Hub */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-afflyt-cyan-400" />
                {t('troubleshooting.title')}
              </h2>

              <GlassCard className="p-6">
                <div className="space-y-4">
                  {commonIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="p-4 bg-afflyt-dark-50 border-l-4 rounded-lg"
                      style={{
                        borderLeftColor: issue.severity === 'high' ? '#EF4444' : '#F59E0B'
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle
                          className="w-5 h-5 shrink-0 mt-0.5"
                          style={{ color: issue.severity === 'high' ? '#EF4444' : '#F59E0B' }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-2">{issue.title}</h4>
                          <ul className="space-y-1 text-sm text-gray-300">
                            {issue.solutions.map((solution, sIndex) => (
                              <li key={sIndex} className="flex items-start gap-2">
                                <span className="text-afflyt-cyan-400 mt-1">→</span>
                                <span>{solution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <a
                        href={issue.guideLink}
                        className="inline-flex items-center gap-1 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 hover:gap-2 transition-all font-medium"
                      >
                        {t('troubleshooting.fullGuide')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Video Library Placeholder */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Video className="w-6 h-6 text-afflyt-cyan-400" />
                {t('videoLibrary.title')}
              </h2>

              <GlassCard className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-afflyt-cyan-500/20 to-afflyt-cyan-600/20 rounded-xl flex items-center justify-center">
                  <Video className="w-8 h-8 text-afflyt-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('videoLibrary.comingSoon')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t('videoLibrary.comingSoonDesc')}
                </p>
              </GlassCard>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="sticky top-24 space-y-6">
            <GlassCard className="p-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-4">
                {t('quickActions.title')}
              </h3>

              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white hover:bg-afflyt-dark-100 hover:border-afflyt-cyan-500/50 transition flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-afflyt-cyan-400" />
                  <span className="text-sm">{t('quickActions.resetPassword')}</span>
                </button>

                <button className="w-full text-left p-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white hover:bg-afflyt-dark-100 hover:border-afflyt-cyan-500/50 transition flex items-center gap-3">
                  <Download className="w-4 h-4 text-afflyt-cyan-400" />
                  <span className="text-sm">{t('quickActions.exportData')}</span>
                </button>

                <button className="w-full text-left p-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white hover:bg-afflyt-dark-100 hover:border-afflyt-cyan-500/50 transition flex items-center gap-3">
                  <Key className="w-4 h-4 text-afflyt-cyan-400" />
                  <span className="text-sm">{t('quickActions.regenerateApiKey')}</span>
                </button>

                <button className="w-full text-left p-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white hover:bg-afflyt-dark-100 hover:border-afflyt-cyan-500/50 transition flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-afflyt-cyan-400" />
                  <span className="text-sm">{t('quickActions.reportIssue')}</span>
                </button>

                <button className="w-full text-left p-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white hover:bg-afflyt-dark-100 hover:border-afflyt-cyan-500/50 transition flex items-center gap-3">
                  <Lightbulb className="w-4 h-4 text-afflyt-cyan-400" />
                  <span className="text-sm">{t('quickActions.suggestFeature')}</span>
                </button>
              </div>

              <div className="mt-6 p-3 bg-afflyt-cyan-500/10 border border-afflyt-cyan-500/30 rounded-lg">
                <p className="text-xs text-afflyt-cyan-400 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  {t('quickActions.proTip')}
                </p>
              </div>
            </GlassCard>

            {/* Support Widget */}
            <GlassCard className="p-6 bg-gradient-to-br from-afflyt-cyan-500/10 to-afflyt-cyan-600/10 border-afflyt-cyan-500/30 max-h-[calc(50vh-4rem)] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-2">
                {t('support.title')}
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                {t('support.subtitle')}
              </p>

              <div className="space-y-2">
                <CyberButton
                  variant="primary"
                  className="w-full justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('support.liveChat')}
                </CyberButton>

                <CyberButton
                  variant="secondary"
                  className="w-full justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {t('support.emailSupport')}
                </CyberButton>

                <CyberButton
                  variant="secondary"
                  className="w-full justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {t('support.bookCall')}
                </CyberButton>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                {t('support.responseTime')}
              </p>
            </GlassCard>

            {/* What's New */}
            <GlassCard className="p-6 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-afflyt-profit-400" />
                {t('whatsNew.title')}
              </h3>

              <div className="space-y-3">
                <div className="pb-3 border-b border-afflyt-glass-border">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-bold rounded">
                      {t('badges.new')}
                    </span>
                    <span className="text-xs text-gray-400">24 Nov 2025</span>
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    {t('whatsNew.telegram')}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {t('whatsNew.telegramDesc')}
                  </p>
                </div>

                <div className="pb-3 border-b border-afflyt-glass-border">
                  <span className="text-xs text-gray-400 block mb-1">20 Nov 2025</span>
                  <h4 className="text-sm font-medium text-white mb-1">
                    {t('whatsNew.dealScore')}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {t('whatsNew.dealScoreDesc')}
                  </p>
                </div>

                <a
                  href="#changelog"
                  className="inline-flex items-center gap-1 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 hover:gap-2 transition-all font-medium"
                >
                  {t('whatsNew.viewAll')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </GlassCard>
            </div>

          </div>
        </div>

        </div>
      </div>
    </>
  );
}
