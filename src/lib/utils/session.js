/**
 * User Session Utility
 *
 * TODO: CRITICAL SECURITY ISSUE
 * This file contains a MOCK user session that returns a hardcoded user ID.
 * This MUST be replaced with proper authentication before production deployment.
 *
 * Recommended implementations:
 * 1. NextAuth.js for session management
 * 2. JWT-based authentication
 * 3. OAuth providers (Google, Microsoft, etc.)
 *
 * Steps to implement proper authentication:
 * 1. Install NextAuth: npm install next-auth
 * 2. Create /app/api/auth/[...nextauth]/route.js
 * 3. Configure providers and session strategy
 * 4. Replace getCurrentUserId() with actual session retrieval
 * 5. Add middleware for protected routes
 * 6. Update all components to use useSession() hook
 */

/**
 * Get current user ID
 *
 * @returns {string} User ID
 *
 * WARNING: This is a MOCK implementation
 * Replace with actual session management in production
 *
 * Example with NextAuth:
 * ```javascript
 * import { getServerSession } from "next-auth/next"
 * import { authOptions } from "@/app/api/auth/[...nextauth]/route"
 *
 * export async function getCurrentUserId() {
 *   const session = await getServerSession(authOptions)
 *   if (!session?.user?.id) {
 *     throw new Error('Unauthorized')
 *   }
 *   return session.user.id
 * }
 * ```
 */
export function getCurrentUserId() {
  // TODO: Replace with actual session management
  // This is a MOCK user ID for development only
  console.warn(
    '🚨 SECURITY WARNING: Using hardcoded user ID. Implement proper authentication before production!'
  )
  return '507f1f77bcf86cd799439011'
}

/**
 * Hook for client-side user session
 *
 * WARNING: This is a MOCK implementation
 * Replace with actual session hook in production
 *
 * Example with NextAuth:
 * ```javascript
 * import { useSession } from 'next-auth/react'
 *
 * export function useCurrentUser() {
 *   const { data: session, status } = useSession()
 *   return {
 *     userId: session?.user?.id,
 *     user: session?.user,
 *     isLoading: status === 'loading',
 *     isAuthenticated: status === 'authenticated'
 *   }
 * }
 * ```
 */
export function useCurrentUser() {
  // TODO: Replace with actual session hook
  console.warn(
    '🚨 SECURITY WARNING: Using hardcoded user ID. Implement proper authentication before production!'
  )
  return {
    userId: '507f1f77bcf86cd799439011',
    user: {
      id: '507f1f77bcf86cd799439011',
      name: 'Mock User',
      email: 'mock@example.com',
    },
    isLoading: false,
    isAuthenticated: true,
  }
}

/**
 * Check if user is authenticated (server-side)
 *
 * WARNING: This is a MOCK implementation
 * Always returns true - NO SECURITY
 */
export async function isAuthenticated() {
  // TODO: Implement actual authentication check
  return true
}

/**
 * Require authentication middleware
 *
 * WARNING: This is a MOCK implementation
 * Does nothing - NO SECURITY
 */
export async function requireAuth() {
  // TODO: Implement actual authentication requirement
  // Should redirect to login if not authenticated
  return true
}
