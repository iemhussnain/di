/**
 * Providers Component
 * Wraps the app with necessary providers (React Query, Toaster, etc.)
 */

'use client'

import { Toaster } from 'react-hot-toast'

export function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  )
}
