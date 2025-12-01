'use client';

import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { useNotifications } from '@/lib/notifications/context';

export function ToastContainer() {
    const { toasts, dismissToast } = useNotifications();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            {...toast}
                            onDismiss={dismissToast}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}
