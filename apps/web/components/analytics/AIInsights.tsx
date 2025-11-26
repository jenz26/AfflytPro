'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import {
    Brain,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Target,
    Zap
} from 'lucide-react';
import Link from 'next/link';

interface Insight {
    type: 'success' | 'warning' | 'info' | 'opportunity';
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: { label: string; href: string };
    metric?: { value: number; unit: string; trend?: 'up' | 'down' };
}

interface InsightsSummary {
    totalLinks: number;
    activeLinks: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    cvr: number;
}

interface AIInsightsProps {
    insights: Insight[];
    score: number;
    summary: InsightsSummary;
    loading?: boolean;
}

function getInsightIcon(type: Insight['type']) {
    switch (type) {
        case 'success':
            return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
        case 'warning':
            return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
        case 'opportunity':
            return <Lightbulb className="w-5 h-5 text-purple-400" />;
        default:
            return <Zap className="w-5 h-5 text-cyan-400" />;
    }
}

function getInsightBorder(type: Insight['type']): string {
    switch (type) {
        case 'success':
            return 'border-emerald-500/30 bg-emerald-500/5';
        case 'warning':
            return 'border-yellow-500/30 bg-yellow-500/5';
        case 'opportunity':
            return 'border-purple-500/30 bg-purple-500/5';
        default:
            return 'border-cyan-500/30 bg-cyan-500/5';
    }
}

function getPriorityBadge(priority: Insight['priority']) {
    const colors = {
        high: 'bg-red-500/20 text-red-400',
        medium: 'bg-yellow-500/20 text-yellow-400',
        low: 'bg-gray-500/20 text-gray-400'
    };
    return colors[priority];
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
}

function getScoreGradient(score: number): string {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-cyan-500 to-blue-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
}

export function AIInsights({ insights, score, summary, loading }: AIInsightsProps) {
    if (loading) {
        return (
            <div className="space-y-6">
                <GlassCard className="p-6">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-white/10 rounded mb-6" />
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 bg-white/10 rounded-full" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded" />
                            ))}
                        </div>
                    </div>
                </GlassCard>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <GlassCard key={i} className="p-6 animate-pulse">
                            <div className="h-6 w-3/4 bg-white/10 rounded mb-2" />
                            <div className="h-4 w-full bg-white/5 rounded" />
                        </GlassCard>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Health Score Card */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Performance Health Score</h3>
                        <p className="text-sm text-gray-400">AI-powered analysis of your affiliate performance</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Score Circle */}
                    <div className="relative">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="12"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${score * 4.4} 440`}
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" className={score >= 60 ? 'stop-cyan-500' : 'stop-yellow-500'} stopColor={score >= 60 ? '#06b6d4' : '#eab308'} />
                                    <stop offset="100%" className={score >= 60 ? 'stop-blue-500' : 'stop-orange-500'} stopColor={score >= 60 ? '#3b82f6' : '#f97316'} />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                            <span className="text-sm text-gray-400">out of 100</span>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Active Links</p>
                            <p className="text-xl font-bold text-white">
                                {summary.activeLinks}<span className="text-sm text-gray-500">/{summary.totalLinks}</span>
                            </p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Total Clicks</p>
                            <p className="text-xl font-bold text-white">{summary.totalClicks.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Conversions</p>
                            <p className="text-xl font-bold text-white">{summary.totalConversions}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Revenue</p>
                            <p className="text-xl font-bold text-emerald-400">{summary.totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">CVR</p>
                            <p className="text-xl font-bold text-white">{summary.cvr}%</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Insights Found</p>
                            <p className="text-xl font-bold text-purple-400">{insights.length}</p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Insights Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI-Powered Recommendations
                </h3>
                <span className="text-sm text-gray-400">{insights.length} insights</span>
            </div>

            {/* Insights List */}
            {insights.length === 0 ? (
                <GlassCard className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">All Good!</h4>
                    <p className="text-gray-400 text-sm">
                        No critical insights at this time. Keep up the great work!
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {insights.map((insight, index) => (
                        <GlassCard
                            key={index}
                            className={`p-5 border ${getInsightBorder(insight.type)} hover:bg-white/5 transition-colors`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {getInsightIcon(insight.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-white font-semibold">{insight.title}</h4>
                                        <span className={`px-2 py-0.5 text-xs rounded ${getPriorityBadge(insight.priority)}`}>
                                            {insight.priority}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3">{insight.description}</p>

                                    {/* Metric if available */}
                                    {insight.metric && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`text-lg font-bold ${
                                                insight.metric.trend === 'up' ? 'text-emerald-400' :
                                                insight.metric.trend === 'down' ? 'text-red-400' : 'text-white'
                                            }`}>
                                                {insight.metric.value}{insight.metric.unit}
                                            </span>
                                            {insight.metric.trend && (
                                                insight.metric.trend === 'up'
                                                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                    : <TrendingDown className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                    )}

                                    {/* Action button if actionable */}
                                    {insight.actionable && insight.action && (
                                        <Link
                                            href={insight.action.href}
                                            className="inline-flex items-center gap-1 text-sm text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors"
                                        >
                                            {insight.action.label}
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Pro Tip */}
            <GlassCard className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <p className="text-sm text-gray-300">
                        <span className="text-purple-400 font-medium">Pro Tip:</span> Check your insights weekly to stay ahead of trends and optimize your affiliate strategy.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
}
