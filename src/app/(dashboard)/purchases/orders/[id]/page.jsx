'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PurchaseOrderDetailsPage({ params }) {
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/purchase-orders/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this purchase order?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/approve`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        alert('Purchase order approved successfully')
      } else {
        alert(data.error || 'Failed to approve purchase order')
      }
    } catch (error) {
      alert('Failed to approve purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSend = async () => {
    if (!confirm('Mark this purchase order as sent to vendor?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/send`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        alert('Purchase order marked as sent to vendor')
      } else {
        alert(data.error || 'Failed to send purchase order')
      }
    } catch (error) {
      alert('Failed to send purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReceive = async () => {
    const qty = prompt('Enter received quantity:')
    if (!qty) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received_quantity: parseFloat(qty) }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        alert(data.message)
      } else {
        alert(data.error || 'Failed to receive items')
      }
    } catch (error) {
      alert('Failed to receive items')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateBill = () => {
    router.push(`/purchases/invoices/new?po_id=${params.id}`)
  }

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        alert('Purchase order cancelled successfully')
      } else {
        alert(data.error || 'Failed to cancel purchase order')
      }
    } catch (error) {
      alert('Failed to cancel purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Purchase order not found</div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Sent to Vendor': 'bg-purple-100 text-purple-800',
      'Partially Received': 'bg-indigo-100 text-indigo-800',
      'Received': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase Order {order.order_number}
          </h1>
          <div className="mt-2">
            {getStatusBadge(order.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/purchases/orders"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back to List
          </Link>
          {order.is_editable && (
            <Link
              href={`/purchases/orders/${order._id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {order.status === 'Pending Approval' && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Approve Order
            </button>
          )}
          {order.status === 'Approved' && (
            <button
              onClick={handleSend}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Mark as Sent to Vendor
            </button>
          )}
          {['Sent to Vendor', 'Partially Received'].includes(order.status) && (
            <button
              onClick={handleReceive}
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Receive Items
            </button>
          )}
          {['Received', 'Partially Received'].includes(order.status) && !order.bills_created && (
            <button
              onClick={handleCreateBill}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Bill
            </button>
          )}
          {!['Cancelled', 'Received'].includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Order Information
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Order Number</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {order.order_number}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Order Date</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(order.order_date).toLocaleDateString()}
              </dd>
            </div>
            {order.expected_delivery_date && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Expected Delivery</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(order.expected_delivery_date).toLocaleDateString()}
                </dd>
              </div>
            )}
            {order.approved_at && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Approved At</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(order.approved_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vendor Information
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Vendor Name</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {order.vendor_id?.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Vendor Code</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {order.vendor_id?.vendor_code}
              </dd>
            </div>
            {order.vendor_id?.email && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {order.vendor_id.email}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Order Items
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tax %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {item.item_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                    Rs. {item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right">
                    {item.tax_rate}%
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                    Rs. {((item.quantity * item.unit_price) * (1 + item.tax_rate / 100)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rs. {order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rs. {order.tax_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-gray-900 dark:text-white">
                  Rs. {order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Notes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.notes}
          </p>
        </div>
      )}
    </div>
  )
}
