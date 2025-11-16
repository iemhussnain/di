/**
 * Edit Customer Page
 * Edit an existing customer
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import CustomerForm from '@/components/forms/CustomerForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditCustomerPage() {
  const params = useParams()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
    }
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setCustomer(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch customer')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('An error occurred while fetching customer')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400">Loading customer...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Customer not found</p>
          <Link href="/sales/customers" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to Customers
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
            href="/sales/customers"
            className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>

        {/* Form */}
        <CustomerForm customer={customer} isEdit={true} />
      </div>
    </DashboardLayout>
  )
}
