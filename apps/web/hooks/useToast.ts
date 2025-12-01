'use client';

import { useNotifications } from '@/lib/notifications';

type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

interface ToastOptions {
    title: string;
    message: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    autoDismiss?: number;
    persistent?: boolean;
    sound?: boolean;
}

export function useToast() {
    const { showToast } = useNotifications();

    const toast = {
        success: (title: string, message: string, options?: Partial<ToastOptions>) => {
            showToast({
                type: 'SUCCESS',
                title,
                message,
                autoDismiss: 5000,
                ...options,
            });
        },

        error: (title: string, message: string, options?: Partial<ToastOptions>) => {
            showToast({
                type: 'ERROR',
                title,
                message,
                autoDismiss: 7000, // Longer for errors
                ...options,
            });
        },

        warning: (title: string, message: string, options?: Partial<ToastOptions>) => {
            showToast({
                type: 'WARNING',
                title,
                message,
                autoDismiss: 6000,
                ...options,
            });
        },

        info: (title: string, message: string, options?: Partial<ToastOptions>) => {
            showToast({
                type: 'INFO',
                title,
                message,
                autoDismiss: 5000,
                ...options,
            });
        },

        custom: (type: ToastType, options: ToastOptions) => {
            showToast({
                type,
                ...options,
            });
        },
    };

    return toast;
}
