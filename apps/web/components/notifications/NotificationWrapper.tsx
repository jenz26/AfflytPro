'use client';

import { NotificationProvider } from '@/lib/notifications';
import { ToastContainer } from './ToastContainer';

interface NotificationWrapperProps {
    children: React.ReactNode;
}

export function NotificationWrapper({ children }: NotificationWrapperProps) {
    return (
        <NotificationProvider>
            {children}
            <ToastContainer />
        </NotificationProvider>
    );
}
