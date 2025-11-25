import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use the locale prefix for all routes
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (e.g. favicon.ico, robots.txt, etc.)
  // - Redirect short links (/r/*)
  matcher: ['/((?!api|_next|r/|.*\\..*).*)']
};
