/**
 * New Category Page
 * Create a new product category
 */

'use client'

import DashboardLayout from '@/components/layout/dashboard-layout'
import CategoryForm from '@/components/forms/CategoryForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewCategoryPage() {
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
        <CategoryForm />
      </div>
    </DashboardLayout>
  )
}
