'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Shield,
    Key,
    Smartphone,
    Monitor,
    Globe,
    LogOut,
    AlertTriangle,
    Download,
    Trash2,
    Check,
    Eye,
    EyeOff,
    Loader2,
    Copy,
    QrCode,
    RefreshCw,
    XCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { API_BASE } from '@/lib/api/config';
import { removeAuthToken } from '@/lib/auth';

interface Session {
    id: string;
    deviceType: string;
    browser: string;
    os: string;
    ipAddress: string;
    location: string | null;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
}

interface TwoFactorStatus {
    enabled: boolean;
    enabledAt: string | null;
    backupCodesRemaining: number;
}

export default function SecurityPage() {
    const t = useTranslations('settings.security');
    const tCommon = useTranslations('common');
    const locale = useLocale();

    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isRevokingSessions, setIsRevokingSessions] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    // 2FA State
    const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
    const [is2FALoading, setIs2FALoading] = useState(true);
    const [showSetup2FA, setShowSetup2FA] = useState(false);
    const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [is2FAVerifying, setIs2FAVerifying] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
    const [show2FADisable, setShow2FADisable] = useState(false);
    const [disableCode, setDisableCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [is2FADisabling, setIs2FADisabling] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

    // Sessions State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const lastPasswordChange = '45 days ago';

    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    };

    // Fetch 2FA status
    useEffect(() => {
        const fetch2FAStatus = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                const response = await fetch(`${API_BASE}/security/2fa/status`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setTwoFactorStatus(data);
                }
            } catch (error) {
                console.error('Failed to fetch 2FA status:', error);
            } finally {
                setIs2FALoading(false);
            }
        };

        fetch2FAStatus();
    }, []);

    // Fetch sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                const response = await fetch(`${API_BASE}/security/sessions`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setSessions(data.sessions || []);
                }
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            } finally {
                setIsSessionsLoading(false);
            }
        };

        fetchSessions();
    }, []);

    // 2FA Setup
    const handleSetup2FA = async () => {
        setTwoFactorError(null);
        setShowSetup2FA(true);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/2fa/setup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                setTwoFactorError(data.message || 'Error setting up 2FA');
                return;
            }

            setSetupData({ secret: data.secret, otpauthUrl: data.otpauthUrl });
        } catch (error) {
            setTwoFactorError('Connection error. Please try again.');
        }
    };

    // Verify 2FA code
    const handleVerify2FA = async () => {
        if (verifyCode.length !== 6) return;

        setIs2FAVerifying(true);
        setTwoFactorError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: verifyCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                setTwoFactorError(data.message || 'Invalid code');
                setIs2FAVerifying(false);
                return;
            }

            // Success! Show backup codes
            setBackupCodes(data.backupCodes);
            setTwoFactorStatus({ enabled: true, enabledAt: new Date().toISOString(), backupCodesRemaining: 10 });
            setShowSetup2FA(false);
            setSetupData(null);
            setVerifyCode('');
        } catch (error) {
            setTwoFactorError('Connection error. Please try again.');
        } finally {
            setIs2FAVerifying(false);
        }
    };

    // Disable 2FA
    const handleDisable2FA = async () => {
        if (disableCode.length !== 6 || !disablePassword) return;

        setIs2FADisabling(true);
        setTwoFactorError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: disableCode, password: disablePassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setTwoFactorError(data.message || 'Error disabling 2FA');
                setIs2FADisabling(false);
                return;
            }

            setTwoFactorStatus({ enabled: false, enabledAt: null, backupCodesRemaining: 0 });
            setShow2FADisable(false);
            setDisableCode('');
            setDisablePassword('');
        } catch (error) {
            setTwoFactorError('Connection error. Please try again.');
        } finally {
            setIs2FADisabling(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError(null);
        setPasswordSuccess(false);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError(t('password.mismatch'));
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('La password deve contenere almeno 8 caratteri');
            return;
        }

        setIsChangingPassword(true);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordError(data.message || 'Errore durante il cambio password');
                return;
            }

            setPasswordSuccess(true);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error) {
            setPasswordError('Errore di connessione. Riprova più tardi.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleRevokeAllSessions = async () => {
        setIsRevokingSessions(true);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/sessions`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Errore durante la revoca delle sessioni');
                return;
            }

            // Refresh sessions list
            const sessionsRes = await fetch(`${API_BASE}/security/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (sessionsRes.ok) {
                const sessionsData = await sessionsRes.json();
                setSessions(sessionsData.sessions || []);
            }
        } catch (error) {
            alert('Errore di connessione. Riprova più tardi.');
        } finally {
            setIsRevokingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId));
            }
        } catch (error) {
            console.error('Error revoking session:', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') return;

        setIsDeleting(true);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/auth/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    password: deletePassword,
                    confirmation: deleteConfirmation,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Errore durante l\'eliminazione dell\'account');
                setIsDeleting(false);
                return;
            }

            removeAuthToken();
            localStorage.removeItem('user');
            window.location.href = `/${locale}/auth/login`;
        } catch (error) {
            alert('Errore di connessione. Riprova più tardi.');
            setIsDeleting(false);
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        if (deviceType === 'mobile' || deviceType === 'tablet') {
            return Smartphone;
        }
        return Monitor;
    };

    const formatLastActive = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const copyBackupCodes = () => {
        if (backupCodes) {
            navigator.clipboard.writeText(backupCodes.join('\n'));
        }
    };

    return (
        <div className="max-w-3xl space-y-8">
            {/* Password Section */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('password.title')}</h3>
                        <p className="text-sm text-gray-500">
                            {t('password.lastChanged', { time: lastPasswordChange })}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('password.current')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('password.new')}
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('password.confirm')}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {passwordError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="p-3 bg-afflyt-profit-400/10 border border-afflyt-profit-400/20 rounded-lg text-afflyt-profit-400 text-sm flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            {t('password.changed')}
                        </div>
                    )}

                    <CyberButton
                        variant="secondary"
                        onClick={handlePasswordChange}
                        disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isChangingPassword}
                    >
                        {isChangingPassword ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvataggio...
                            </>
                        ) : (
                            t('password.change')
                        )}
                    </CyberButton>
                </div>
            </GlassCard>

            {/* Two-Factor Authentication */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-afflyt-profit-400/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-afflyt-profit-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('twoFactor.title')}</h3>
                        <p className="text-sm text-gray-500">{t('twoFactor.description')}</p>
                    </div>
                </div>

                {is2FALoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-afflyt-cyan-400 animate-spin" />
                    </div>
                ) : backupCodes ? (
                    // Show backup codes after enabling 2FA
                    <div className="space-y-4">
                        <div className="p-4 bg-afflyt-profit-400/10 border border-afflyt-profit-400/30 rounded-lg">
                            <div className="flex items-center gap-2 text-afflyt-profit-400 mb-3">
                                <Check className="w-5 h-5" />
                                <span className="font-semibold">2FA Enabled Successfully!</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator.
                            </p>
                            <div className="bg-afflyt-dark-50 p-4 rounded-lg font-mono text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.map((code, i) => (
                                        <div key={i} className="text-gray-300">{code}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <CyberButton variant="secondary" size="sm" onClick={copyBackupCodes}>
                                    <Copy className="w-4 h-4" />
                                    Copy Codes
                                </CyberButton>
                                <CyberButton variant="ghost" size="sm" onClick={() => setBackupCodes(null)}>
                                    Done
                                </CyberButton>
                            </div>
                        </div>
                    </div>
                ) : showSetup2FA ? (
                    // 2FA Setup flow
                    <div className="space-y-4">
                        {setupData ? (
                            <>
                                <div className="p-4 bg-afflyt-dark-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <QrCode className="w-5 h-5 text-afflyt-cyan-400" />
                                        <span className="font-medium text-white">Scan with Authenticator App</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Scan this QR code with Google Authenticator, Authy, or any TOTP app.
                                    </p>
                                    {/* QR Code placeholder - in production use a QR library */}
                                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                                            alt="2FA QR Code"
                                            className="w-48 h-48"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">Or enter this secret manually:</p>
                                    <code className="block p-2 bg-afflyt-dark-100 rounded text-afflyt-cyan-400 text-sm font-mono break-all">
                                        {setupData.secret}
                                    </code>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Enter the 6-digit code from your app
                                    </label>
                                    <input
                                        type="text"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-center text-2xl tracking-widest focus:border-afflyt-cyan-500 focus:outline-none"
                                        maxLength={6}
                                    />
                                </div>

                                {twoFactorError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                        <XCircle className="w-4 h-4" />
                                        {twoFactorError}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <CyberButton
                                        variant="primary"
                                        onClick={handleVerify2FA}
                                        disabled={verifyCode.length !== 6 || is2FAVerifying}
                                    >
                                        {is2FAVerifying ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Verify & Enable'
                                        )}
                                    </CyberButton>
                                    <CyberButton variant="ghost" onClick={() => { setShowSetup2FA(false); setSetupData(null); }}>
                                        Cancel
                                    </CyberButton>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-afflyt-cyan-400 animate-spin" />
                            </div>
                        )}
                    </div>
                ) : show2FADisable ? (
                    // Disable 2FA flow
                    <div className="space-y-4">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">
                                You are about to disable two-factor authentication. This will make your account less secure.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Enter a code from your authenticator app
                            </label>
                            <input
                                type="text"
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono text-center text-2xl tracking-widest focus:border-red-500 focus:outline-none"
                                maxLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Enter your password
                            </label>
                            <input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-red-500 focus:outline-none"
                            />
                        </div>

                        {twoFactorError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {twoFactorError}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <CyberButton
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/10"
                                onClick={handleDisable2FA}
                                disabled={disableCode.length !== 6 || !disablePassword || is2FADisabling}
                            >
                                {is2FADisabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
                            </CyberButton>
                            <CyberButton variant="ghost" onClick={() => { setShow2FADisable(false); setDisableCode(''); setDisablePassword(''); }}>
                                Cancel
                            </CyberButton>
                        </div>
                    </div>
                ) : (
                    // Normal 2FA status view
                    <>
                        <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${twoFactorStatus?.enabled ? 'bg-afflyt-profit-400' : 'bg-gray-600'}`} />
                                <div>
                                    <div className="text-white font-medium">
                                        {t('twoFactor.status')}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {twoFactorStatus?.enabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
                                        {twoFactorStatus?.enabled && twoFactorStatus.backupCodesRemaining !== undefined && (
                                            <span className="ml-2 text-xs text-gray-600">
                                                ({twoFactorStatus.backupCodesRemaining} backup codes remaining)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <CyberButton
                                variant={twoFactorStatus?.enabled ? 'ghost' : 'primary'}
                                size="sm"
                                onClick={() => twoFactorStatus?.enabled ? setShow2FADisable(true) : handleSetup2FA()}
                            >
                                {twoFactorStatus?.enabled ? t('twoFactor.disable') : t('twoFactor.enable')}
                            </CyberButton>
                        </div>

                        {!twoFactorStatus?.enabled && (
                            <p className="mt-4 text-sm text-yellow-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('twoFactor.recommendation')}
                            </p>
                        )}
                    </>
                )}
            </GlassCard>

            {/* Active Sessions */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{t('sessions.title')}</h3>
                            <p className="text-sm text-gray-500">{t('sessions.description')}</p>
                        </div>
                    </div>
                    {sessions.length > 1 && (
                        <CyberButton
                            variant="ghost"
                            size="sm"
                            onClick={handleRevokeAllSessions}
                            disabled={isRevokingSessions}
                        >
                            {isRevokingSessions ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            {t('sessions.revokeAll')}
                        </CyberButton>
                    )}
                </div>

                {isSessionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-afflyt-cyan-400 animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No active sessions found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => {
                            const DeviceIcon = getDeviceIcon(session.deviceType);

                            return (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-afflyt-glass-white rounded-lg flex items-center justify-center">
                                            <DeviceIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">
                                                    {session.browser || 'Unknown'} on {session.os || session.deviceType || 'Unknown'}
                                                </span>
                                                {session.isCurrent && (
                                                    <span className="px-2 py-0.5 bg-afflyt-profit-400/20 text-afflyt-profit-400 text-xs font-medium rounded">
                                                        {t('sessions.current')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                {session.location && <span>{session.location}</span>}
                                                {session.ipAddress && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{session.ipAddress.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.xxx.xxx.$4')}</span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span>{formatLastActive(session.lastActiveAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {!session.isCurrent && (
                                        <button
                                            onClick={() => handleRevokeSession(session.id)}
                                            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            {t('sessions.revoke')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard className="p-6 border-red-500/30">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t('danger.title')}</h3>
                        <p className="text-sm text-gray-500">{t('danger.description')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Export Data */}
                    <div className="flex items-center justify-between p-4 bg-afflyt-dark-50/50 rounded-lg">
                        <div>
                            <div className="text-white font-medium">{t('danger.export.title')}</div>
                            <div className="text-sm text-gray-500">{t('danger.export.description')}</div>
                        </div>
                        <CyberButton variant="secondary" size="sm">
                            <Download className="w-4 h-4" />
                            {t('danger.export.button')}
                        </CyberButton>
                    </div>

                    {/* Delete Account */}
                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                        <div>
                            <div className="text-white font-medium">{t('danger.delete.title')}</div>
                            <div className="text-sm text-red-300">{t('danger.delete.description')}</div>
                        </div>
                        <CyberButton
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('danger.delete.button')}
                        </CyberButton>
                    </div>
                </div>
            </GlassCard>

            {/* Delete Account Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteConfirmation('');
                }}
                onConfirm={handleDeleteAccount}
                title={t('danger.delete.modal.title')}
                message={
                    <div className="space-y-4">
                        <p>{t('danger.delete.modal.warning')}</p>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>{t('danger.delete.modal.item1')}</li>
                            <li>{t('danger.delete.modal.item2')}</li>
                            <li>{t('danger.delete.modal.item3')}</li>
                        </ul>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Inserisci la tua password
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Password"
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-red-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Scrivi <span className="text-red-400 font-mono">DELETE</span> per confermare
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                                placeholder="DELETE"
                                className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white font-mono focus:border-red-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <p className="text-red-300 font-medium">{t('danger.delete.modal.final')}</p>
                    </div>
                }
                confirmText={t('danger.delete.modal.confirm')}
                cancelText={tCommon('cancel')}
                variant="danger"
                isLoading={isDeleting}
                confirmDisabled={deleteConfirmation !== 'DELETE' || !deletePassword}
            />
        </div>
    );
}
