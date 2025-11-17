import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const path = req.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/']
  const isPublicRoute = publicRoutes.includes(path)

  // Allow access to login and register pages
  if (path === '/login' || path === '/register') {
    // If user is already logged in, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Allow access to home page
  if (path === '/') {
    return NextResponse.next()
  }

  // If not authenticated and not on public route, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access (optional - can be enhanced later)
  // Example: Admin-only routes
  if (path.startsWith('/admin') && token?.role !== 'Admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

// Specify which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth API routes)
     * - /api/auth/register (registration endpoint)
     * - /_next/* (Next.js internals)
     * - /static/* (static files)
     * - /favicon.ico, /robots.txt (static files)
     */
    '/((?!api/auth|_next|static|favicon.ico|robots.txt).*)',
  ],
}
