'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Notification, ToastNotification } from './types';
import { API_BASE } from '@/lib/api/config';

interface NotificationContextType {
    // Persistent notifications (from DB)
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    // Actions
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;

    // Toast notifications (temporary)
    toasts: ToastNotification[];
    showToast: (toast: Omit<ToastNotification, 'id'>) => void;
    dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'afflyt_notifications_cache';
const TOAST_DEFAULT_DURATION = 5000;

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toasts, setToasts] = useState<ToastNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Calculate unread count
    const unreadCount = notifications.filter(n => n.status !== 'READ' && n.status !== 'DISMISSED').length;

    // Load cached notifications on mount
    useEffect(() => {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setNotifications(parsed.slice(0, 50)); // Keep last 50
            } catch (e) {
                console.warn('Failed to parse cached notifications');
            }
        }
    }, []);

    // Save notifications to cache
    useEffect(() => {
        if (notifications.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
        }
    }, [notifications]);

    // Cleanup toast timeouts on unmount
    useEffect(() => {
        return () => {
            toastTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Mark notification as read
    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n)
        );

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`${API_BASE}/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => n.status !== 'READ').map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() }))
        );

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`${API_BASE}/api/notifications/read-all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: unreadIds })
            });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, [notifications]);

    // Dismiss notification
    const dismissNotification = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`${API_BASE}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
        }
    }, []);

    // Show toast notification
    const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
        const id = generateId();
        const newToast: ToastNotification = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after timeout (unless persistent)
        if (!toast.persistent) {
            const timeout = setTimeout(() => {
                dismissToast(id);
            }, toast.autoDismiss || TOAST_DEFAULT_DURATION);

            toastTimeoutsRef.current.set(id, timeout);
        }

        // Play sound if enabled
        if (toast.sound) {
            playNotificationSound();
        }
    }, []);

    // Dismiss toast
    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));

        // Clear timeout
        const timeout = toastTimeoutsRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            toastTimeoutsRef.current.delete(id);
        }
    }, []);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        toasts,
        showToast,
        dismissToast
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Audio not supported or blocked
    }
}
