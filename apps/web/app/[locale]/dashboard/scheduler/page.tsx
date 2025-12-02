'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  Plus,
  Grid3x3,
  List,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Send,
  Eye,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { API_BASE } from '@/lib/api/config';
import { CreateScheduleWizard } from '@/components/scheduler/CreateScheduleWizard';
import { Analytics } from '@/components/analytics/PostHogProvider';

// Types
interface ScheduledPost {
  id: string;
  name: string;
  type: 'CUSTOM' | 'BOUNTY' | 'RECAP' | 'CROSS_PROMO' | 'WELCOME' | 'SPONSORED';
  content: string;
  mediaUrl?: string;
  schedule: string;
  timezone: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  failCount: number;
  totalClicks: number;
  channel: {
    id: string;
    name: string;
    platform: string;
    channelId: string;
  };
  _count?: {
    executions: number;
  };
}

interface PostExecution {
  id: string;
  executedAt: string;
  status: string;
  error?: string;
  messageId?: string;
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  CUSTOM: { label: 'Custom', color: 'bg-gray-500', icon: 'Edit' },
  BOUNTY: { label: 'Bounty', color: 'bg-purple-500', icon: 'Gift' },
  RECAP: { label: 'Recap', color: 'bg-blue-500', icon: 'TrendingUp' },
  CROSS_PROMO: { label: 'Cross Promo', color: 'bg-orange-500', icon: 'Users' },
  WELCOME: { label: 'Welcome', color: 'bg-green-500', icon: 'UserPlus' },
  SPONSORED: { label: 'Sponsored', color: 'bg-yellow-500', icon: 'DollarSign' },
};

export default function SchedulerPage() {
  const t = useTranslations('scheduler');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showWizard, setShowWizard] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'paused'>('all');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<ScheduledPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPostLogs, setSelectedPostLogs] = useState<{ post: ScheduledPost; logs: PostExecution[] } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/scheduler`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const post = posts.find(p => p.id === id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/scheduler/${id}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Track scheduled post toggled
        Analytics.track('scheduled_post_toggled', {
          type: post?.type,
          new_state: !post?.isActive ? 'active' : 'paused'
        });
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to toggle post:', error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/scheduler/${id}/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(t('testSuccess'));
      } else {
        alert(result.message || t('testError'));
      }
    } catch (error) {
      console.error('Failed to test post:', error);
      alert(t('testError'));
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/scheduler/${postToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Track scheduled post deleted
        Analytics.track('scheduled_post_deleted', { type: postToDelete.type });
      }

      fetchPosts();
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewLogs = async (post: ScheduledPost) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/scheduler/${post.id}/logs?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSelectedPostLogs({ post, logs: data.logs || [] });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleCreatePost = async (postData: any) => {
    try {
      const token = localStorage.getItem('token');

      if (editingPost) {
        // Update existing post
        const response = await fetch(`${API_BASE}/api/scheduler/${editingPost.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          // Track scheduled post updated
          Analytics.track('scheduled_post_updated', { type: postData.type });
          setShowWizard(false);
          setEditingPost(null);
          fetchPosts();
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to update scheduled post');
        }
      } else {
        // Create new post
        const response = await fetch(`${API_BASE}/api/scheduler`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          // Track scheduled post created
          Analytics.track('scheduled_post_created', {
            type: postData.type,
            schedule: postData.schedule
          });
          setShowWizard(false);
          fetchPosts();
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to create scheduled post');
        }
      }
    } catch (error) {
      console.error('Failed to save scheduled post:', error);
      alert('Failed to save scheduled post');
    }
  };

  const activePostsCount = posts.filter((p) => p.isActive).length;
  const maxPosts = 50; // Based on plan

  const filteredPosts = posts.filter((post) => {
    if (filterType !== 'all' && post.type !== filterType) return false;
    if (filterActive === 'active' && !post.isActive) return false;
    if (filterActive === 'paused' && post.isActive) return false;
    return true;
  });

  const formatNextRun = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return t('overdue');
    if (diff < 60000) return t('lessThanMinute');
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t('minutes')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t('hours')}`;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-afflyt-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afflyt-dark-100">
      {/* Header */}
      <div className="px-8 py-6 border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-afflyt-dark-100" />
              </div>
              {t('title')}
            </h1>
            <p className="text-gray-400 mt-1">{t('subtitle')}</p>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4">
            <GlassCard className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-afflyt-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">{t('nextExecution')}</p>
                  <p className="text-sm font-mono text-white">
                    {posts.filter((p) => p.isActive && p.nextRunAt).length > 0
                      ? formatNextRun(
                          posts
                            .filter((p) => p.isActive && p.nextRunAt)
                            .sort((a, b) => new Date(a.nextRunAt!).getTime() - new Date(b.nextRunAt!).getTime())[0]
                            ?.nextRunAt
                        )
                      : t('noPending')}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            {/* Create Button */}
            <CyberButton variant="primary" onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('newSchedule')}
            </CyberButton>

            {/* Filter by Status */}
            <div className="flex items-center gap-1 p-1 bg-afflyt-glass-white rounded-lg">
              {['all', 'active', 'paused'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterActive(filter as any)}
                  className={`px-3 py-1.5 rounded text-sm transition-all ${
                    filterActive === filter
                      ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t(`filters.${filter}`)}
                </button>
              ))}
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg text-sm text-white focus:outline-none focus:border-afflyt-cyan-500"
            >
              <option value="all">{t('allTypes')}</option>
              {Object.entries(POST_TYPE_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="pl-10 pr-4 py-2 bg-afflyt-glass-white border border-afflyt-glass-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-afflyt-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-afflyt-glass-white rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'grid' ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'list' ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchPosts}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">{t('activeSchedules')}</span>
            <span className="font-mono text-white">
              {activePostsCount}/{maxPosts}
            </span>
          </div>
          <div className="h-2 bg-afflyt-dark-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                activePostsCount / maxPosts > 0.8
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400'
              }`}
              style={{ width: `${(activePostsCount / maxPosts) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('empty.title')}</h3>
            <p className="text-gray-400 mb-6">{t('empty.description')}</p>
            <CyberButton variant="primary" onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('empty.cta')}
            </CyberButton>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {filteredPosts.map((post) => (
              <ScheduledPostCard
                key={post.id}
                post={post}
                onToggle={() => handleToggle(post.id)}
                onTest={() => handleTest(post.id)}
                onEdit={() => {
                  setEditingPost(post);
                  setShowWizard(true);
                }}
                onDelete={() => setPostToDelete(post)}
                onViewLogs={() => handleViewLogs(post)}
                formatNextRun={formatNextRun}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Wizard Modal */}
      {showWizard && (
        <CreateScheduleWizard
          editingPost={editingPost}
          onComplete={handleCreatePost}
          onCancel={() => {
            setShowWizard(false);
            setEditingPost(null);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={postToDelete !== null}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDelete}
        title={t('deleteModal.title')}
        message={
          postToDelete ? (
            <div className="space-y-2">
              <p>{t('deleteModal.description')}</p>
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="font-semibold text-white">{postToDelete.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {postToDelete.channel?.name} - {POST_TYPE_LABELS[postToDelete.type]?.label}
                </p>
              </div>
              <p className="text-sm text-red-300">{t('deleteModal.warning')}</p>
            </div>
          ) : (
            ''
          )
        }
        confirmText={t('deleteModal.confirm')}
        cancelText={t('deleteModal.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Logs Modal */}
      {selectedPostLogs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-afflyt-glass-border">
              <h3 className="text-lg font-semibold text-white">{t('logs.title')}: {selectedPostLogs.post.name}</h3>
              <button
                onClick={() => setSelectedPostLogs(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedPostLogs.logs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">{t('logs.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {selectedPostLogs.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-afflyt-glass-white rounded-lg"
                    >
                      {log.status === 'SUCCESS' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${log.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                            {log.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.executedAt).toLocaleString('it-IT')}
                          </span>
                        </div>
                        {log.error && log.error !== '[TEST]' && (
                          <p className="text-xs text-gray-400 mt-1">{log.error}</p>
                        )}
                        {log.error === '[TEST]' && (
                          <p className="text-xs text-blue-400 mt-1">{t('logs.testExecution')}</p>
                        )}
                        {log.messageId && (
                          <p className="text-xs text-gray-500 mt-1">Message ID: {log.messageId}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ============================================
// SCHEDULED POST CARD COMPONENT
// ============================================

interface ScheduledPostCardProps {
  post: ScheduledPost;
  onToggle: () => void;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
  formatNextRun: (dateStr?: string) => string;
}

function ScheduledPostCard({
  post,
  onToggle,
  onTest,
  onEdit,
  onDelete,
  onViewLogs,
  formatNextRun,
}: ScheduledPostCardProps) {
  const t = useTranslations('scheduler');
  const [showMenu, setShowMenu] = useState(false);
  const typeConfig = POST_TYPE_LABELS[post.type] || POST_TYPE_LABELS.CUSTOM;

  return (
    <GlassCard
      className={`relative overflow-hidden transition-all ${
        post.isActive ? 'ring-1 ring-afflyt-cyan-500/30' : 'opacity-75'
      }`}
    >
      {/* Status Indicator */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          post.isActive ? 'bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400' : 'bg-gray-600'
        }`}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className="text-xs text-gray-500">{post.channel?.name}</span>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg shadow-xl z-20 py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-afflyt-glass-white flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t('actions.edit')}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onTest();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-afflyt-glass-white flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t('actions.test')}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onViewLogs();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-afflyt-glass-white flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('actions.logs')}
                  </button>
                  <hr className="my-1 border-afflyt-glass-border" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-afflyt-glass-white flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('actions.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{post.name}</h3>

        {/* Content Preview */}
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">{post.content.substring(0, 100)}...</p>

        {/* Schedule Info */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{post.schedule}</span>
          </div>
          {post.isActive && post.nextRunAt && (
            <div className="flex items-center gap-1 text-afflyt-cyan-400">
              <ChevronRight className="w-4 h-4" />
              <span>{formatNextRun(post.nextRunAt)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-afflyt-glass-white rounded">
            <p className="text-xs text-gray-500">{t('stats.runs')}</p>
            <p className="text-lg font-mono text-white">{post.runCount}</p>
          </div>
          <div className="text-center p-2 bg-afflyt-glass-white rounded">
            <p className="text-xs text-gray-500">{t('stats.fails')}</p>
            <p className={`text-lg font-mono ${post.failCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {post.failCount}
            </p>
          </div>
          <div className="text-center p-2 bg-afflyt-glass-white rounded">
            <p className="text-xs text-gray-500">{t('stats.clicks')}</p>
            <p className="text-lg font-mono text-white">{post.totalClicks}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            post.isActive
              ? 'bg-afflyt-cyan-500/20 text-afflyt-cyan-300 hover:bg-afflyt-cyan-500/30'
              : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
          }`}
        >
          {post.isActive ? (
            <>
              <Pause className="w-4 h-4" />
              {t('actions.pause')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t('actions.activate')}
            </>
          )}
        </button>
      </div>
    </GlassCard>
  );
}
