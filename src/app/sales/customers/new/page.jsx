/**
 * New Customer Page
 * Create a new customer
 */

'use client'

import DashboardLayout from '@/components/layout/dashboard-layout'
import CustomerForm from '@/components/forms/CustomerForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewCustomerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/sales/customers"
            className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>

        {/* Form */}
        <CustomerForm />
      </div>
    </DashboardLayout>
  )
}
