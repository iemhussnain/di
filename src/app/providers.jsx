/**
 * Providers Component
 * Wraps the app with necessary providers (Theme, Toaster, etc.)
 */

'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster
        position="top-right"
        toastOptions={{
          // Light mode styles
          className: '',
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
          // Success
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          // Error
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      </ThemeProvider>
    </SessionProvider>
  )
}
