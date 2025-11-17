'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Alert, Skeleton } from '@/components/ui'
import SalesOrderForm from '@/components/forms/SalesOrderForm'

export default function EditSalesOrderPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/sales-orders/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.data)
      } else {
        setError(data.error || 'Failed to fetch order')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    const response = await fetch(`/api/sales-orders/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update sales order')
    }

    router.push(`/sales/orders/${params.id}`)
  }

  const handleCancel = () => {
    router.push(`/sales/orders/${params.id}`)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <p>{error || 'Order not found'}</p>
        </Alert>
      </div>
    )
  }

  if (order.status !== 'Draft') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <p>Only Draft orders can be edited. This order is {order.status}.</p>
        </Alert>
        <Link href={`/sales/orders/${params.id}`} className="text-blue-600 hover:underline mt-4 block">
          View Order
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/sales/orders/${params.id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Sales Order</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{order.order_no}</p>
        </div>
      </div>

      <SalesOrderForm initialData={order} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
