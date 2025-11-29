import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/onboarding', '/settings'];

// Routes that are public (auth pages)
const publicRoutes = ['/auth/login', '/auth/magic-link', '/auth/reset-password', '/auth/verify-email'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale from pathname
  const pathnameLocale = locales.find(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Get the path without locale prefix
  const pathWithoutLocale = pathnameLocale
    ? pathname.replace(`/${pathnameLocale}`, '') || '/'
    : pathname;

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathWithoutLocale.startsWith(route)
  );

  // Check if this is a public auth route
  const isPublicRoute = publicRoutes.some(route =>
    pathWithoutLocale.startsWith(route)
  );

  // Get token from cookie or header
  const token = request.cookies.get('token')?.value;

  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const locale = pathnameLocale || defaultLocale;
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page with a token, redirect to dashboard
  if (isPublicRoute && token && pathWithoutLocale.startsWith('/auth/login')) {
    const locale = pathnameLocale || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Continue with i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (e.g. favicon.ico, robots.txt, etc.)
  // - Redirect short links (/r/*)
  matcher: ['/((?!api|_next|r/|.*\\..*).*)']
};
