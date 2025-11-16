'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VendorForm from '@/components/forms/VendorForm'
import { Alert } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewVendorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vendor')
      }

      // Redirect to vendor details page
      router.push(`/purchases/vendors/${data.data._id}`)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/purchases/vendors"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Vendor</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a new vendor/supplier record
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
      <VendorForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
