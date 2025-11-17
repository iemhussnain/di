import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Allow access to login and register pages
    if (path === '/login' || path === '/register') {
      // If user is already logged in, redirect to dashboard
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // If not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check role-based access (optional - can be enhanced later)
    // Example: Admin-only routes
    if (path.startsWith('/admin') && token.role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

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
