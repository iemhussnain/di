/**
 * Edit Item Page
 * Edit an existing inventory item/product
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import ItemForm from '@/components/forms/ItemForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditItemPage() {
  const params = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchItem()
    }
  }, [params.id])

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setItem(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch item')
      }
    } catch (error) {
      console.error('Error fetching item:', error)
      toast.error('An error occurred while fetching item')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400">Loading item...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Item not found</p>
          <Link
            href="/inventory/items"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to Items
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/inventory/items"
            className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Items
          </Link>
        </div>

        {/* Form */}
        <ItemForm item={item} isEdit={true} />
      </div>
    </DashboardLayout>
  )
}
