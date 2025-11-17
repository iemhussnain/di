'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SalesOrderForm from '@/components/forms/SalesOrderForm'

export default function NewSalesOrderPage() {
  const router = useRouter()

  const handleSubmit = async (formData) => {
    const response = await fetch('/api/sales-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create sales order')
    }

    router.push(`/sales/orders/${data.data._id}`)
  }

  const handleCancel = () => {
    router.push('/sales/orders')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/sales/orders"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Sales Order</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a new sales order for a customer
          </p>
        </div>
      </div>

      <SalesOrderForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
