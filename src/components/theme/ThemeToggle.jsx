/**
 * Theme Toggle Component
 * Button to switch between light and dark themes
 */

'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-1 rounded-md bg-gray-100 dark:bg-gray-800 p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded transition-all ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title="Light mode"
      >
        <Sun
          className={`h-4 w-4 ${
            theme === 'light' ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title="System theme"
      >
        <Monitor
          className={`h-4 w-4 ${
            theme === 'system' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded transition-all ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title="Dark mode"
      >
        <Moon
          className={`h-4 w-4 ${
            theme === 'dark' ? 'text-indigo-500' : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </button>
    </div>
  )
}
