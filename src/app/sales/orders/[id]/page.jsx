'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Skeleton, Table } from '@/components/ui'
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, FileText } from 'lucide-react'

export default function SalesOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock user ID
  const userId = '507f1f77bcf86cd799439011'

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

  const handleConfirm = async () => {
    if (!confirm('Confirm this order? This will reduce inventory.')) return

    try {
      const response = await fetch(`/api/sales-orders/${params.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_by: userId }),
      })

      if (response.ok) {
        alert('Order confirmed successfully!')
        fetchOrder()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to confirm order')
      }
    } catch (error) {
      alert('Failed to confirm order')
    }
  }

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    try {
      const response = await fetch(`/api/sales-orders/${params.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_by: userId, cancellation_reason: reason }),
      })

      if (response.ok) {
        alert('Order cancelled successfully!')
        fetchOrder()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel order')
      }
    } catch (error) {
      alert('Failed to cancel order')
    }
  }

  const handleCreateInvoice = async () => {
    if (!confirm('Create invoice from this order?')) return

    try {
      const response = await fetch(`/api/sales-orders/${params.id}/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: userId }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/sales/invoices/${data.data._id}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create invoice')
      }
    } catch (error) {
      alert('Failed to create invoice')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      const response = await fetch(`/api/sales-orders/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/sales/orders')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete order')
      }
    } catch (error) {
      alert('Failed to delete order')
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Invoiced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Partially Delivered': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return <Badge className={variants[status] || ''}>{status}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/sales/orders"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{order.order_no}</h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{formatDate(order.order_date)}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {order.status === 'Draft' && (
            <>
              <Link href={`/sales/orders/${order._id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" onClick={handleConfirm}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}

          {(order.status === 'Draft' || order.status === 'Confirmed') && (
            <Button variant="outline" onClick={handleCancel}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}

          {order.status === 'Confirmed' && !order.invoice_id && (
            <Button onClick={handleCreateInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          )}

          {order.invoice_id && (
            <Link href={`/sales/invoices/${order.invoice_id}`}>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Subtotal</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(order.subtotal)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Discount</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(order.total_discount)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Tax</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(order.total_tax)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Grand Total</div>
            <div className="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
              {formatCurrency(order.grand_total)}
            </div>
          </div>
        </Card>
      </div>

      {/* Customer Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div className="font-medium">
                {order.customer_name} ({order.customer_code})
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Payment Terms</div>
              <div className="font-medium">{order.payment_terms}</div>
            </div>
            {order.expected_delivery_date && (
              <div>
                <div className="text-sm text-gray-500">Expected Delivery</div>
                <div className="font-medium">{formatDate(order.expected_delivery_date)}</div>
              </div>
            )}
            {order.reference_no && (
              <div>
                <div className="text-sm text-gray-500">Reference No</div>
                <div className="font-medium">{order.reference_no}</div>
              </div>
            )}
          </div>

          {order.shipping_address && (
            <div>
              <div className="text-sm text-gray-500">Shipping Address</div>
              <div className="font-medium">{order.full_shipping_address}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Order Lines */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Order Lines</h3>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tax
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.lines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium">
                        {line.item_id?.item_code || 'N/A'} - {line.item_id?.item_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{line.description || '-'}</td>
                    <td className="px-4 py-4 text-sm text-right">{line.quantity}</td>
                    <td className="px-4 py-4 text-sm text-right">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {formatCurrency(line.discount_amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {formatCurrency(line.tax_amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      {formatCurrency(line.line_total)}
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                  <td className="px-4 py-4 text-sm" colSpan="4">
                    Totals
                  </td>
                  <td className="px-4 py-4 text-sm text-right">
                    {formatCurrency(order.total_discount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right">
                    {formatCurrency(order.total_tax)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right">
                    {formatCurrency(order.grand_total)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {(order.notes || order.internal_notes) && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            {order.notes && (
              <div>
                <div className="text-sm text-gray-500">Customer Notes</div>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
            {order.internal_notes && (
              <div>
                <div className="text-sm text-gray-500">Internal Notes</div>
                <p className="whitespace-pre-wrap">{order.internal_notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Audit Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Created At</div>
              <div>{formatDate(order.createdAt)}</div>
            </div>
            {order.confirmed_at && (
              <div>
                <div className="text-gray-500">Confirmed At</div>
                <div>{formatDate(order.confirmed_at)}</div>
              </div>
            )}
            {order.cancelled_at && (
              <div>
                <div className="text-gray-500">Cancelled At</div>
                <div>{formatDate(order.cancelled_at)}</div>
              </div>
            )}
            {order.cancellation_reason && (
              <div className="col-span-2">
                <div className="text-gray-500">Cancellation Reason</div>
                <div>{order.cancellation_reason}</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
