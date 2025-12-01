'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Check,
    Trash2,
    CheckCheck,
    AlertCircle,
    AlertTriangle,
    Info,
    Zap,
    BarChart3,
    Settings,
    CreditCard,
    X
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications/context';
import type { Notification } from '@/lib/notifications/types';

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
    Bell,
    Check,
    AlertCircle,
    AlertTriangle,
    Info,
    Zap,
    BarChart3,
    Settings,
    CreditCard,
};

// Get icon component by name
function getIconComponent(iconName?: string): React.ElementType {
    if (!iconName) return Bell;
    return iconMap[iconName] || Bell;
}

// Format relative time
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// Get type styles
function getTypeStyles(type: string, category: string) {
    if (type === 'AUTOMATION_ERROR' || category === 'SYSTEM') {
        if (type.includes('ERROR') || type.includes('FAILED')) {
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-400',
            };
        }
    }
    if (type.includes('WARNING') || type.includes('LIMIT')) {
        return {
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
        };
    }
    if (type.includes('SUCCESS') || type.includes('ACTIVATED')) {
        return {
            bg: 'bg-green-500/10',
            text: 'text-green-400',
        };
    }
    return {
        bg: 'bg-afflyt-cyan-500/10',
        text: 'text-afflyt-cyan-400',
    };
}

interface NotificationItemProps {
    notification: Notification;
    onMarkRead: () => void;
    onDelete: () => void;
}

function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
    const Icon = getIconComponent(notification.icon);
    const styles = getTypeStyles(notification.type, notification.category);
    const isUnread = notification.status !== 'READ' && notification.status !== 'DISMISSED';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`
                flex items-start gap-3 p-4 border-b border-gray-800 last:border-0
                hover:bg-gray-800/50 transition-colors
                ${isUnread ? 'bg-afflyt-cyan-500/5' : ''}
            `}
        >
            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${styles.bg}
            `}>
                <Icon className={`w-5 h-5 ${styles.text}`} />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white text-sm mb-1">
                    {notification.title}
                </h4>
                <p className="text-sm text-gray-400 leading-snug mb-2 line-clamp-2">
                    {notification.body}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <time>{formatRelativeTime(notification.createdAt)}</time>
                    {notification.actionUrl && (
                        <a
                            href={notification.actionUrl}
                            className="text-afflyt-cyan-400 hover:text-afflyt-cyan-300 font-medium"
                        >
                            {notification.actionLabel || 'Vedi'} →
                        </a>
                    )}
                </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
                {isUnread && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors"
                        title="Segna come letta"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 rounded transition-colors"
                    title="Elimina"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification
    } = useNotifications();

    // Fetch notifications on mount and when opening
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Fetch when opening
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 mt-2 w-96 bg-afflyt-dark-50 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="font-semibold text-white">Notifiche</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 text-xs text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        Segna tutte
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {isLoading && notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-afflyt-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Caricamento...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nessuna notifica</p>
                                    <p className="text-xs mt-1">Le tue notifiche appariranno qui</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkRead={() => markAsRead(notification.id)}
                                            onDelete={() => dismissNotification(notification.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-700 text-center">
                                <a
                                    href="/settings/notifications"
                                    className="text-xs text-gray-400 hover:text-afflyt-cyan-400 transition-colors"
                                >
                                    Gestisci preferenze notifiche
                                </a>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
