/**
 * Auth utilities for token management
 */

const TOKEN_KEY = 'token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Save auth token to both localStorage and cookie
 */
export function setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;

    // Save to localStorage for API calls
    localStorage.setItem(TOKEN_KEY, token);

    // Save to cookie for middleware auth checks
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove auth token from both localStorage and cookie
 */
export function removeAuthToken(): void {
    if (typeof window === 'undefined') return;

    // Remove from localStorage
    localStorage.removeItem(TOKEN_KEY);

    // Remove cookie by setting expired date
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Check if user is authenticated (has token)
 */
export function isAuthenticated(): boolean {
    return !!getAuthToken();
}
