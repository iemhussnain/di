/**
 * Providers Component
 * Wraps the app with necessary providers (NextAuth, React Query, etc.)
 */

'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
