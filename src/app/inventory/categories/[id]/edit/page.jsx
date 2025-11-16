/**
 * Edit Category Page
 * Edit an existing product category
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import CategoryForm from '@/components/forms/CategoryForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditCategoryPage() {
  const params = useParams()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCategory()
    }
  }, [params.id])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setCategory(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch category')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      toast.error('An error occurred while fetching category')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400">Loading category...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!category) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Category not found</p>
          <Link
            href="/inventory/categories"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to Categories
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
            href="/inventory/categories"
            className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Categories
          </Link>
        </div>

        {/* Form */}
        <CategoryForm category={category} isEdit={true} />
      </div>
    </DashboardLayout>
  )
}
