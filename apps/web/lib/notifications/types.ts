// Notification types matching Prisma schema

export type NotificationType =
    | 'WELCOME'
    | 'EMAIL_VERIFIED'
    | 'PASSWORD_CHANGED'
    | 'NEW_LOGIN'
    | 'API_KEY_CREATED'
    | 'API_KEY_DELETED'
    | 'SUBSCRIPTION_ACTIVATED'
    | 'SUBSCRIPTION_UPDATED'
    | 'SUBSCRIPTION_CANCELED'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'TRIAL_ENDING'
    | 'LIMIT_WARNING'
    | 'LIMIT_REACHED'
    | 'AUTOMATION_SUCCESS'
    | 'AUTOMATION_ERROR'
    | 'CHANNEL_DISCONNECTED'
    | 'DAILY_REPORT'
    | 'WEEKLY_REPORT'
    | 'ONBOARDING_REMINDER'
    | 'FEATURE_ANNOUNCEMENT';

export type NotificationCategory = 'SYSTEM' | 'AUTOMATION' | 'ANALYTICS' | 'PRODUCT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ' | 'DISMISSED';

export interface Notification {
    id: string;
    type: NotificationType;
    category: NotificationCategory;
    priority: NotificationPriority;
    status: NotificationStatus;
    title: string;
    body: string;
    icon?: string; // Lucide icon name
    actionUrl?: string;
    actionLabel?: string;
    autoDismissMs?: number;
    createdAt: string;
    readAt?: string;
    dismissedAt?: string;
}

// Toast-specific notification (for temporary display)
export interface ToastNotification {
    id: string;
    type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
    title: string;
    message: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    autoDismiss?: number; // milliseconds
    persistent?: boolean;
    sound?: boolean;
}

// Notification preferences
export interface NotificationPreferences {
    inApp: {
        enabled: boolean;
        toast: boolean;
        sound: boolean;
        browser: boolean;
    };
    email: {
        dealPublished: boolean;
        dealPublishedFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
        weeklyReport: boolean;
        productUpdates: boolean;
    };
    telegram: {
        connected: boolean;
        username?: string;
    };
}
