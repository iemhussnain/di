'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import JournalEntryForm from '@/components/forms/JournalEntryForm'
import { Alert } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewJournalEntryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mock user ID - in production this would come from auth context
  const userId = '507f1f77bcf86cd799439011'

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create journal entry')
      }

      // Redirect to journal entry details page
      router.push(`/accounting/journal/${data.data._id}`)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/accounting/journal"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Journal Entry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a new manual journal entry
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {/* Form */}
      <JournalEntryForm onSubmit={handleSubmit} isLoading={isLoading} userId={userId} />
    </div>
  )
}
