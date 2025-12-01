'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ToastNotification } from '@/lib/notifications/types';

interface ToastProps extends ToastNotification {
    onDismiss: (id: string) => void;
}

const typeConfig = {
    SUCCESS: {
        icon: Check,
        className: 'bg-green-500/10 border-green-500/30',
        iconClassName: 'text-green-400',
        titleClassName: 'text-green-400',
    },
    ERROR: {
        icon: AlertCircle,
        className: 'bg-red-500/10 border-red-500/30',
        iconClassName: 'text-red-400',
        titleClassName: 'text-red-400',
    },
    WARNING: {
        icon: AlertTriangle,
        className: 'bg-amber-500/10 border-amber-500/30',
        iconClassName: 'text-amber-400',
        titleClassName: 'text-amber-400',
    },
    INFO: {
        icon: Info,
        className: 'bg-afflyt-cyan-500/10 border-afflyt-cyan-500/30',
        iconClassName: 'text-afflyt-cyan-400',
        titleClassName: 'text-afflyt-cyan-400',
    },
};

export function Toast({
    id,
    type,
    title,
    message,
    actionLabel,
    onAction,
    onDismiss,
    autoDismiss,
    persistent,
}: ToastProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    useEffect(() => {
        if (!persistent && autoDismiss) {
            const timer = setTimeout(() => onDismiss(id), autoDismiss);
            return () => clearTimeout(timer);
        }
    }, [id, autoDismiss, persistent, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, x: 100 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
                flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md
                shadow-lg max-w-md w-full ${config.className}
            `}
        >
            <div className={`flex-shrink-0 mt-0.5 ${config.iconClassName}`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm mb-1 ${config.titleClassName}`}>
                    {title}
                </h4>
                <p className="text-sm text-gray-300 leading-snug">
                    {message}
                </p>

                {actionLabel && onAction && (
                    <button
                        onClick={() => {
                            onAction();
                            onDismiss(id);
                        }}
                        className="mt-2 text-xs font-medium text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors"
                    >
                        {actionLabel} →
                    </button>
                )}
            </div>

            <button
                onClick={() => onDismiss(id)}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
