import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip auth for login page and auth API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Domain Restriction (Production Only)
  const isProd = process.env.NODE_ENV === 'production';
  const allowedHost = 'bismate-dataset.vercel.app';

  if (isProd && pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Block if origin/referer exists and doesn't match our allowed host
    const isInvalidOrigin = origin && !origin.includes(allowedHost);
    const isInvalidReferer = referer && !referer.includes(allowedHost);
    
    if (isInvalidOrigin || (referer && isInvalidReferer)) {
      return new NextResponse('Forbidden: Invalid Origin', { status: 403 });
    }
  }

  // 3. Check for session cookie
  const session = request.cookies.get('session');

  // 3. Redirect to login if no session
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
