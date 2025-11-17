'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Input, Badge, Alert, Skeleton, Table } from '@/components/ui'
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, FileText } from 'lucide-react'

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [customers, setCustomers] = useState([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchOrders()
    fetchCustomers()
  }, [currentPage, searchTerm, statusFilter, customerFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (customerFilter) params.append('customer_id', customerFilter)

      const response = await fetch(`/api/sales-orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.totalCount || 0)
      } else {
        throw new Error(data.error || 'Failed to fetch orders')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=1000&status=Active')
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sales order?')) return

    try {
      const response = await fetch(`/api/sales-orders/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchOrders()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete order')
      }
    } catch (error) {
      alert('Failed to delete order')
    }
  }

  const handleConfirm = async (id) => {
    if (!confirm('Are you sure you want to confirm this order? This will reduce inventory.')) return

    try {
      const response = await fetch(`/api/sales-orders/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_by: '507f1f77bcf86cd799439011' }),
      })

      if (response.ok) {
        alert('Order confirmed successfully!')
        fetchOrders()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to confirm order')
      }
    } catch (error) {
      alert('Failed to confirm order')
    }
  }

  const handleCreateInvoice = async (id) => {
    if (!confirm('Create invoice from this order?')) return

    try {
      const response = await fetch(`/api/sales-orders/${id}/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: '507f1f77bcf86cd799439011' }),
      })

      if (response.ok) {
        const data = await response.json()
        alert('Invoice created successfully!')
        window.location.href = `/sales/invoices/${data.data._id}`
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create invoice')
      }
    } catch (error) {
      alert('Failed to create invoice')
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
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage customer orders and track fulfillment
          </p>
        </div>
        <Link href="/sales/orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Invoiced">Invoiced</option>
              <option value="Partially Delivered">Partially Delivered</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.customer_name}
                </option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4 mr-2" />
              {totalCount} order{totalCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No sales orders found</p>
              <Link href="/sales/orders/new">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Order
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{order.order_no}</div>
                      {order.reference_no && (
                        <div className="text-xs text-gray-500">Ref: {order.reference_no}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(order.grand_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link href={`/sales/orders/${order._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {order.status === 'Draft' && (
                          <>
                            <Link href={`/sales/orders/${order._id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirm(order._id)}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}

                        {order.status === 'Confirmed' && !order.invoice_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateInvoice(order._id)}
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
