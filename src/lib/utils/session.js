/**
 * User Session Utility
 *
 * Provides session management using NextAuth.js
 * Server-side and client-side session utilities
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Get current user ID (server-side)
 *
 * @returns {Promise<string>} User ID
 * @throws {Error} If user is not authenticated
 */
export async function getCurrentUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please login')
  }
  return session.user.id
}

/**
 * Get current user session (server-side)
 *
 * @returns {Promise<Object|null>} User session object or null
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * Hook for client-side user session
 *
 * @returns {Object} User session object with helper properties
 */
export function useCurrentUser() {
  // Note: This must be imported and used from 'next-auth/react' directly in client components
  // This is a re-export for convenience
  // Example usage:
  // import { useSession } from 'next-auth/react'
  // const { data: session, status } = useSession()

  throw new Error('Use useSession from next-auth/react directly in client components')
}

/**
 * Check if user is authenticated (server-side)
 *
 * @returns {Promise<boolean>} Whether user is authenticated
 */
export async function isAuthenticated() {
  const session = await getServerSession(authOptions)
  return !!session?.user
}

/**
 * Require authentication middleware (server-side)
 *
 * @throws {Error} If user is not authenticated
 * @returns {Promise<Object>} User session
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized - Authentication required')
  }
  return session
}
