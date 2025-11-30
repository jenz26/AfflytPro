'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Activity,
  Database,
  Server,
  RefreshCw,
  Ticket,
  Zap,
  Radio,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Plus,
  Trash2,
  Shield,
  Crown,
  Copy,
  Eye,
  MoreVertical,
  Download,
  Play,
  Settings
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { API_BASE } from '@/lib/api/config';

// Types
interface OverviewStats {
  users: {
    total: number;
    active: number;
    recentSignups: number;
    byPlan: Record<string, number>;
  };
  channels: { total: number };
  automations: { total: number; active: number };
  clicks: { total: number; today: number };
  conversions: { total: number };
  betaCodes: { total: number; used: number; available: number };
  revenue: { mrr: number; arr: number };
}

interface HealthStatus {
  api: { status: string; timestamp: string };
  database: { status: string; error?: string };
  redis: { status: string; error?: string };
  keepa: { status: string; lastProcessed?: string; queueDepth?: number; error?: string };
}

interface KeepaStats {
  tokens: { available: number; usedToday: number; lastRefill?: string };
  queue: { depth: number; processing: boolean };
  cache: { totalCategories: number; fresh: number; stale: number };
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  plan: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  _count: { channels: number; automationRules: number };
}

interface BetaCode {
  id: string;
  code: string;
  isActive: boolean;
  usedAt?: string;
  notes?: string;
  assignedEmail?: string;
  createdAt: string;
  users: Array<{ id: string; email: string; name?: string }>;
}

interface AutomationLog {
  id: string;
  dealsFetched: number;
  dealsPublished: number;
  createdAt: string;
  rule: { id: string; name: string; user: { email: string } };
}

interface Channel {
  id: string;
  name: string;
  platform: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; email: string; name?: string };
  _count: { automationRules: number };
}

interface Automation {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; email: string; name?: string };
  channel: { id: string; name: string; platform: string };
}

interface AuthLog {
  id: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { id: string; email: string; name?: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'beta' | 'channels' | 'automations' | 'keepa' | 'logs'>('overview');

  // State for all sections
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [keepaStats, setKeepaStats] = useState<KeepaStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [betaCodes, setBetaCodes] = useState<BetaCode[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsTotal, setChannelsTotal] = useState(0);
  const [channelsPage, setChannelsPage] = useState(1);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationsTotal, setAutomationsTotal] = useState(0);
  const [automationsPage, setAutomationsPage] = useState(1);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [logsTab, setLogsTab] = useState<'automation' | 'auth'>('automation');

  // Actions loading states
  const [generating, setGenerating] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [triggeringPrefetch, setTriggeringPrefetch] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [deletingCodeId, setDeletingCodeId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState<{ plan?: string; role?: string; isActive?: boolean }>({});

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Check admin access and fetch initial data
  const fetchAdminData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      setLoading(true);
      setError(null);

      // Fetch overview stats
      const statsRes = await fetch(`${API_BASE}/admin/stats/overview`, { headers });
      if (statsRes.status === 403) {
        setError('Non hai i permessi per accedere a questa pagina');
        return;
      }
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      setStats(await statsRes.json());

      // Fetch health status
      const healthRes = await fetch(`${API_BASE}/admin/health`, { headers });
      if (healthRes.ok) setHealth(await healthRes.json());

      // Fetch Keepa stats
      const keepaRes = await fetch(`${API_BASE}/admin/keepa/stats`, { headers });
      if (keepaRes.ok) setKeepaStats(await keepaRes.json());

    } catch (err) {
      console.error('Admin fetch error:', err);
      setError('Errore nel caricamento dei dati admin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(
        `${API_BASE}/admin/users?page=${usersPage}&limit=10&search=${usersSearch}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUsersTotal(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [usersPage, usersSearch]);

  // Fetch beta codes
  const fetchBetaCodes = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`${API_BASE}/admin/beta-codes`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBetaCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to fetch beta codes:', err);
    }
  }, []);

  // Fetch automation logs
  const fetchLogs = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [automationRes, authRes] = await Promise.all([
        fetch(`${API_BASE}/admin/logs/automation?limit=20`, { headers }),
        fetch(`${API_BASE}/admin/logs/auth?limit=20`, { headers })
      ]);
      if (automationRes.ok) {
        const data = await automationRes.json();
        setAutomationLogs(data.logs);
      }
      if (authRes.ok) {
        const data = await authRes.json();
        setAuthLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`${API_BASE}/admin/channels?page=${channelsPage}&limit=10`, { headers });
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
        setChannelsTotal(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  }, [channelsPage]);

  // Fetch automations
  const fetchAutomations = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`${API_BASE}/admin/automations?page=${automationsPage}&limit=10`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations);
        setAutomationsTotal(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch automations:', err);
    }
  }, [automationsPage]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'beta') fetchBetaCodes();
  }, [activeTab, fetchBetaCodes]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    if (activeTab === 'channels') fetchChannels();
  }, [activeTab, fetchChannels]);

  useEffect(() => {
    if (activeTab === 'automations') fetchAutomations();
  }, [activeTab, fetchAutomations]);

  // Generate beta codes
  const generateBetaCodes = async (count: number) => {
    const token = getToken();
    if (!token) return;

    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/beta-codes/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count, prefix: 'AFFLYT' })
      });

      if (res.ok) {
        await fetchBetaCodes();
      }
    } catch (err) {
      console.error('Failed to generate codes:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Update beta code (assign email)
  const updateBetaCode = async (id: string, assignedEmail: string | null) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/admin/beta-codes/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedEmail })
      });

      if (res.ok) {
        await fetchBetaCodes();
        setEditingCodeId(null);
        setEditingEmail('');
      }
    } catch (err) {
      console.error('Failed to update code:', err);
    }
  };

  // Delete beta code
  const deleteBetaCode = async (id: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/admin/beta-codes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchBetaCodes();
        setDeletingCodeId(null);
      }
    } catch (err) {
      console.error('Failed to delete code:', err);
    }
  };

  // Update user
  const updateUser = async (id: string, data: { plan?: string; role?: string; isActive?: boolean }) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        await fetchUsers();
        setEditingUserId(null);
        setEditingUserData({});
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  // Clear Keepa cache
  const clearCache = async () => {
    const token = getToken();
    if (!token) return;

    setClearingCache(true);
    try {
      await fetch(`${API_BASE}/admin/actions/clear-cache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchAdminData();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearingCache(false);
    }
  };

  // Trigger prefetch
  const triggerPrefetch = async () => {
    const token = getToken();
    if (!token) return;

    setTriggeringPrefetch(true);
    try {
      await fetch(`${API_BASE}/admin/actions/trigger-prefetch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to trigger prefetch:', err);
    } finally {
      setTriggeringPrefetch(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
      healthy: { color: 'text-emerald-500', icon: CheckCircle2 },
      unhealthy: { color: 'text-red-500', icon: XCircle },
      not_configured: { color: 'text-yellow-500', icon: AlertTriangle },
      unknown: { color: 'text-gray-400', icon: AlertTriangle },
    };
    const { color, icon: Icon } = config[status] || config.unknown;
    return <Icon className={`w-5 h-5 ${color}`} />;
  };

  const PlanBadge = ({ plan }: { plan: string }) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-500/20 text-gray-400',
      STARTER: 'bg-blue-500/20 text-blue-400',
      PRO: 'bg-purple-500/20 text-purple-400',
      BUSINESS: 'bg-amber-500/20 text-amber-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}>
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Accesso Negato</h2>
          <p className="text-gray-400">{error}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <p className="text-gray-400">Gestione completa della piattaforma Afflyt</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Utenti', icon: Users },
          { id: 'beta', label: 'Beta Codes', icon: Ticket },
          { id: 'channels', label: 'Canali', icon: Radio },
          { id: 'automations', label: 'Automazioni', icon: Zap },
          { id: 'keepa', label: 'Keepa Monitor', icon: Database },
          { id: 'logs', label: 'Logs', icon: Server },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Utenti</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.users.total}</p>
              <p className="text-xs text-emerald-400">+{stats.users.recentSignups} questa settimana</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Radio className="w-4 h-4" />
                <span className="text-sm">Canali</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.channels.total}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Automazioni</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.automations.total}</p>
              <p className="text-xs text-gray-400">{stats.automations.active} attive</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Click Totali</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.clicks.total.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{stats.clicks.today} oggi</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Ticket className="w-4 h-4" />
                <span className="text-sm">Beta Codes</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.betaCodes.available}</p>
              <p className="text-xs text-gray-400">{stats.betaCodes.used} usati</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Conversioni</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.conversions.total}</p>
            </GlassCard>
          </div>

          {/* Users by Plan */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Distribuzione Piani</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.users.byPlan).map(([plan, count]) => (
                <div key={plan} className="text-center p-4 rounded-lg bg-white/5">
                  <PlanBadge plan={plan} />
                  <p className="text-2xl font-bold text-white mt-2">{count}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* System Health */}
          {health && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">System Health</h3>
                <button
                  onClick={fetchAdminData}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(health).map(([service, status]) => (
                  <div key={service} className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                    <StatusBadge status={status.status} />
                    <div>
                      <p className="text-white font-medium capitalize">{service}</p>
                      <p className="text-xs text-gray-400">{status.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={clearCache}
                disabled={clearingCache}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {clearingCache ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Clear Keepa Cache
              </button>
              <button
                onClick={triggerPrefetch}
                disabled={triggeringPrefetch}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                {triggeringPrefetch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Trigger Prefetch
              </button>
              <button
                onClick={() => setActiveTab('beta')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Genera Beta Codes
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search */}
          <GlassCard className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per email o nome..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </GlassCard>

          {/* Users Table */}
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Utente</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Piano</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Ruolo</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Canali</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Automazioni</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Registrato</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{user.name || 'N/A'}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {editingUserId === user.id ? (
                          <select
                            value={editingUserData.plan || user.plan}
                            onChange={(e) => setEditingUserData({ ...editingUserData, plan: e.target.value })}
                            className="px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white"
                          >
                            <option value="FREE">FREE</option>
                            <option value="STARTER">STARTER</option>
                            <option value="PRO">PRO</option>
                            <option value="BUSINESS">BUSINESS</option>
                          </select>
                        ) : (
                          <PlanBadge plan={user.plan} />
                        )}
                      </td>
                      <td className="p-4">
                        {editingUserId === user.id ? (
                          <select
                            value={editingUserData.role || user.role}
                            onChange={(e) => setEditingUserData({ ...editingUserData, role: e.target.value })}
                            className="px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : user.role === 'ADMIN' ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Crown className="w-4 h-4" /> Admin
                          </span>
                        ) : (
                          <span className="text-gray-400">User</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-white">{user._count.channels}</td>
                      <td className="p-4 text-center text-white">{user._count.automationRules}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="p-4">
                        {editingUserId === user.id ? (
                          <select
                            value={editingUserData.isActive !== undefined ? String(editingUserData.isActive) : String(user.isActive)}
                            onChange={(e) => setEditingUserData({ ...editingUserData, isActive: e.target.value === 'true' })}
                            className="px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white"
                          >
                            <option value="true">Attivo</option>
                            <option value="false">Disattivo</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <span className="flex items-center gap-1 text-emerald-400 text-sm">
                                <CheckCircle2 className="w-4 h-4" /> Attivo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 text-sm">
                                <XCircle className="w-4 h-4" /> Disattivo
                              </span>
                            )}
                            {user.emailVerified && (
                              <span className="text-blue-400" title="Email verificata">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          {editingUserId === user.id ? (
                            <>
                              <button
                                onClick={() => updateUser(user.id, editingUserData)}
                                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                title="Salva"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingUserId(null); setEditingUserData({}); }}
                                className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                title="Annulla"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setEditingUserId(user.id); setEditingUserData({ plan: user.plan, role: user.role, isActive: user.isActive }); }}
                              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                              title="Modifica utente"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Mostrando {users.length} di {usersTotal} utenti
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  disabled={usersPage === 1}
                  className="px-3 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setUsersPage(p => p + 1)}
                  disabled={users.length < 10}
                  className="px-3 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Beta Codes Tab */}
      {activeTab === 'beta' && (
        <div className="space-y-6">
          {/* Generate Section */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Genera Nuovi Codici</h3>
            <div className="flex gap-3">
              {[1, 5, 10].map(count => (
                <button
                  key={count}
                  onClick={() => generateBetaCodes(count)}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Genera {count}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Codes List */}
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Codice</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Assegnato a</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Usato da</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Creato</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {betaCodes.map(code => (
                    <tr key={code.id} className="hover:bg-white/5">
                      <td className="p-4">
                        <code className="px-2 py-1 rounded bg-white/10 text-primary font-mono">
                          {code.code}
                        </code>
                      </td>
                      <td className="p-4">
                        {code.usedAt ? (
                          <span className="text-gray-400">Usato</span>
                        ) : code.isActive ? (
                          <span className="text-emerald-400">Disponibile</span>
                        ) : (
                          <span className="text-red-400">Disattivo</span>
                        )}
                      </td>
                      <td className="p-4">
                        {editingCodeId === code.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                              placeholder="email@esempio.com"
                              className="px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary w-48"
                              autoFocus
                            />
                            <button
                              onClick={() => updateBetaCode(code.id, editingEmail || null)}
                              className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              title="Salva"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingCodeId(null); setEditingEmail(''); }}
                              className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              title="Annulla"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={code.assignedEmail ? 'text-cyan-400' : 'text-gray-500'}>
                              {code.assignedEmail || '-'}
                            </span>
                            {!code.usedAt && (
                              <button
                                onClick={() => { setEditingCodeId(code.id); setEditingEmail(code.assignedEmail || ''); }}
                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                                title="Modifica email assegnata"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {code.users.length > 0 ? (
                          <span className="text-white">{code.users[0].email}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(code.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copia codice"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {deletingCodeId === code.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteBetaCode(code.id)}
                                className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                              >
                                Conferma
                              </button>
                              <button
                                onClick={() => setDeletingCodeId(null)}
                                className="px-2 py-1 rounded bg-white/10 text-gray-400 hover:bg-white/20 text-xs"
                              >
                                Annulla
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingCodeId(code.id)}
                              className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                              title="Elimina codice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Nome</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Piattaforma</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Proprietario</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Automazioni</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Creato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {channels.map(channel => (
                    <tr key={channel.id} className="hover:bg-white/5">
                      <td className="p-4 text-white font-medium">{channel.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs uppercase">
                          {channel.platform}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white text-sm">{channel.user.name || 'N/A'}</p>
                          <p className="text-gray-400 text-xs">{channel.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center text-white">{channel._count.automationRules}</td>
                      <td className="p-4">
                        {channel.isActive ? (
                          <span className="text-emerald-400 text-sm">Attivo</span>
                        ) : (
                          <span className="text-red-400 text-sm">Disattivo</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(channel.createdAt).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Mostrando {channels.length} di {channelsTotal} canali
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setChannelsPage(p => Math.max(1, p - 1))}
                  disabled={channelsPage === 1}
                  className="px-3 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setChannelsPage(p => p + 1)}
                  disabled={channels.length < 10}
                  className="px-3 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-6">
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Nome</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Canale</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Proprietario</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Creata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {automations.map(automation => (
                    <tr key={automation.id} className="hover:bg-white/5">
                      <td className="p-4 text-white font-medium">{automation.name}</td>
                      <td className="p-4">
                        <div>
                          <p className="text-white text-sm">{automation.channel.name}</p>
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs uppercase">
                            {automation.channel.platform}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white text-sm">{automation.user.name || 'N/A'}</p>
                          <p className="text-gray-400 text-xs">{automation.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {automation.isActive ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Attiva
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-sm">
                            <XCircle className="w-4 h-4" /> Inattiva
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(automation.createdAt).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Mostrando {automations.length} di {automationsTotal} automazioni
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutomationsPage(p => Math.max(1, p - 1))}
                  disabled={automationsPage === 1}
                  className="px-3 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setAutomationsPage(p => p + 1)}
                  disabled={automations.length < 10}
                  className="px-3 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Keepa Monitor Tab */}
      {activeTab === 'keepa' && keepaStats && (
        <div className="space-y-6">
          {/* Token Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Zap className="w-4 h-4" />
                <span>Token Disponibili</span>
              </div>
              <p className="text-3xl font-bold text-white">{keepaStats.tokens.available}</p>
              <p className="text-sm text-gray-400 mt-1">
                Usati oggi: {keepaStats.tokens.usedToday}
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Server className="w-4 h-4" />
                <span>Coda</span>
              </div>
              <p className="text-3xl font-bold text-white">{keepaStats.queue.depth}</p>
              <p className="text-sm text-gray-400 mt-1">
                {keepaStats.queue.processing ? (
                  <span className="text-emerald-400">In elaborazione...</span>
                ) : (
                  'In attesa'
                )}
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database className="w-4 h-4" />
                <span>Cache</span>
              </div>
              <p className="text-3xl font-bold text-white">{keepaStats.cache.totalCategories}</p>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-emerald-400">{keepaStats.cache.fresh} fresh</span>
                <span className="text-yellow-400">{keepaStats.cache.stale} stale</span>
              </div>
            </GlassCard>
          </div>

          {/* Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Azioni Keepa</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={clearCache}
                disabled={clearingCache}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {clearingCache ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Svuota Cache
              </button>
              <button
                onClick={triggerPrefetch}
                disabled={triggeringPrefetch}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                {triggeringPrefetch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Forza Prefetch
              </button>
              <button
                onClick={fetchAdminData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna Stats
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setLogsTab('automation')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                logsTab === 'automation' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Automation Logs
            </button>
            <button
              onClick={() => setLogsTab('auth')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                logsTab === 'auth' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Auth Events
            </button>
          </div>

          {/* Automation Logs */}
          {logsTab === 'automation' && (
            <GlassCard className="overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Automation Logs</h3>
                <button
                  onClick={fetchLogs}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-gray-400 font-medium">Automazione</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Utente</th>
                      <th className="text-center p-4 text-gray-400 font-medium">Deals Fetched</th>
                      <th className="text-center p-4 text-gray-400 font-medium">Pubblicati</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {automationLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="p-4 text-white">{log.rule?.name || 'N/A'}</td>
                        <td className="p-4 text-gray-400">{log.rule?.user?.email || 'N/A'}</td>
                        <td className="p-4 text-center text-white">{log.dealsFetched}</td>
                        <td className="p-4 text-center">
                          <span className={log.dealsPublished > 0 ? 'text-emerald-400' : 'text-gray-400'}>
                            {log.dealsPublished}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                          {new Date(log.createdAt).toLocaleString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* Auth Logs */}
          {logsTab === 'auth' && (
            <GlassCard className="overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Auth Events</h3>
                <button
                  onClick={fetchLogs}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-gray-400 font-medium">Evento</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Utente</th>
                      <th className="text-left p-4 text-gray-400 font-medium">IP</th>
                      <th className="text-left p-4 text-gray-400 font-medium">User Agent</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {authLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.eventType === 'LOGIN_SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                            log.eventType === 'LOGIN_FAILED' ? 'bg-red-500/20 text-red-400' :
                            log.eventType === 'MAGIC_LINK_SENT' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{log.user?.email || 'N/A'}</td>
                        <td className="p-4 text-gray-400 text-sm font-mono">{log.ipAddress || '-'}</td>
                        <td className="p-4 text-gray-400 text-xs max-w-[200px] truncate" title={log.userAgent}>
                          {log.userAgent || '-'}
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                          {new Date(log.createdAt).toLocaleString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
