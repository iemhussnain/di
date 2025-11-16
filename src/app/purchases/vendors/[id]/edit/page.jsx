'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VendorForm from '@/components/forms/VendorForm'
import { Alert, Skeleton } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditVendorPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (params.id) {
      fetchVendor()
    }
  }, [params.id])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/vendors/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vendor')
      }

      setVendor(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/vendors/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update vendor')
      }

      // Redirect to vendor details page
      router.push(`/purchases/vendors/${params.id}`)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error && !vendor) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/purchases/vendors/${params.id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Vendor</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Update vendor information for {vendor?.vendor_name}
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
      {vendor && <VendorForm vendor={vendor} onSubmit={handleSubmit} isLoading={isSubmitting} />}
    </div>
  )
}
