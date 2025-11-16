/**
 * Custom 404 Not Found Page
 * Displayed when a page is not found
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-24 w-24 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The page might have been
          moved, deleted, or never existed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Need help?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link
              href="/dashboard"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/accounting/accounts"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Accounts
            </Link>
            <Link
              href="/settings"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
