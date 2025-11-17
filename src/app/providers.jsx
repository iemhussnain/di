/**
 * Providers Component
 * Wraps the app with necessary providers (Theme, Toaster, React Query, etc.)
 */

'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query/devtools'

export function Providers({ children }) {
  // Create QueryClient instance - use useState to ensure it's only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus in production
            refetchOnWindowFocus: process.env.NODE_ENV === 'development',
            // Retry failed requests 1 time
            retry: 1,
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            cacheTime: 10 * 60 * 1000,
          },
          mutations: {
            // Retry failed mutations 0 times (don't retry by default)
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
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
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  )
}
