/**
 * Payments List Page
 * View and manage all payments and receipts
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Input, Badge, Select, Alert, Skeleton, Table } from '@/components/ui'
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, DollarSign } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [partyTypeFilter, setPartyTypeFilter] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Mock user ID
  const userId = '507f1f77bcf86cd799439011'

  useEffect(() => {
    fetchPayments()
  }, [currentPage, searchTerm, typeFilter, statusFilter, partyTypeFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('payment_type', typeFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (partyTypeFilter) params.append('party_type', partyTypeFilter)

      const response = await fetch(`/api/payments?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.totalCount || 0)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch payments')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (paymentId) => {
    if (!confirm('Post this payment? This will create accounting entries.')) return

    try {
      const response = await fetch(`/api/payments/${paymentId}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted_by: userId }),
      })

      if (response.ok) {
        alert('Payment posted successfully!')
        fetchPayments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to post payment')
      }
    } catch (error) {
      alert('Failed to post payment')
    }
  }

  const handleCancel = async (paymentId) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    try {
      const response = await fetch(`/api/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_by: userId, cancellation_reason: reason }),
      })

      if (response.ok) {
        alert('Payment cancelled successfully!')
        fetchPayments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel payment')
      }
    } catch (error) {
      alert('Failed to cancel payment')
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      Posted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Reconciled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return <Badge className={variants[status] || ''}>{status}</Badge>
  }

  const getTypeBadge = (type) => {
    const variants = {
      Receipt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return <Badge className={variants[type] || ''}>{type}</Badge>
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

  if (loading && payments.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage customer receipts and vendor payments
          </p>
        </div>
        <Link href="/sales/payments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Payment
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by payment no, party name, reference..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>

            <div>
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All Types</option>
                <option value="Receipt">Receipts</option>
                <option value="Payment">Payments</option>
              </Select>
            </div>

            <div>
              <Select
                value={partyTypeFilter}
                onChange={(e) => {
                  setPartyTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All Parties</option>
                <option value="Customer">Customers</option>
                <option value="Vendor">Vendors</option>
              </Select>
            </div>

            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Posted">Posted</option>
                <option value="Reconciled">Reconciled</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Payments</div>
            <div className="text-2xl font-bold mt-2">{totalCount}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Receipts</div>
            <div className="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
              {payments.filter((p) => p.payment_type === 'Receipt' && p.status !== 'Cancelled').length}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payments Out</div>
            <div className="text-2xl font-bold mt-2 text-orange-600 dark:text-orange-400">
              {payments.filter((p) => p.payment_type === 'Payment' && p.status !== 'Cancelled').length}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Unposted</div>
            <div className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
              {payments.filter((p) => p.status === 'Draft').length}
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Payment No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Party
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 text-sm">
                      <Link
                        href={`/sales/payments/${payment._id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {payment.payment_no}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-4 text-sm">{getTypeBadge(payment.payment_type)}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium">{payment.party_name}</div>
                      <div className="text-xs text-gray-500">{payment.party_code}</div>
                    </td>
                    <td className="px-4 py-4 text-sm">{payment.payment_method}</td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-4 text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/sales/payments/${payment._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {payment.status === 'Draft' && !payment.posted && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePost(payment._id)}
                              title="Post Payment"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(payment._id)}
                              title="Cancel Payment"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing page {currentPage} of {totalPages} ({totalCount} total payments)
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
