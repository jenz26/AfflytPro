// API base URL - uses env var in production, localhost in dev
// Production fallback ensures it works even if env var is not set
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isProduction ? 'https://afflytpro-api-production.up.railway.app' : 'http://localhost:3001');
