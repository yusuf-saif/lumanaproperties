import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow health checks, cron jobs, and NextAuth handler routes to pass through completely
  if (
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Check for NextAuth / Auth.js session cookies (both standard and secure prefixes)
  const token =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'

  // If unauthenticated and trying to access protected route, redirect to /login
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and visiting login/auth pages, redirect to dashboard
  if (token && isAuthPage) {
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/health|api/cron|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
