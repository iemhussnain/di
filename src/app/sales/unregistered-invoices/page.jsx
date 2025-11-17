'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UnregisteredInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    customer_id: '',
    from_date: '',
    to_date: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        is_registered: 'false', // Only unregistered invoices
        ...filters
      })

      const res = await fetch(`/api/sales-invoices?${params}`)
      if (!res.ok) throw new Error('Failed to fetch invoices')

      const data = await res.json()
      setInvoices(data.invoices)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [pagination.page, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to page 1
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const res = await fetch(`/api/sales-invoices/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete invoice')

      fetchInvoices()
    } catch (err) {
      alert(err.message)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'Posted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status] || ''}`}>
        {status}
      </span>
    )
  }

  const getPaymentStatusBadge = (status) => {
    const styles = {
      'Unpaid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Partially Paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status] || ''}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Unregistered Sales Invoices
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Simple invoices without FBR registration requirements
          </p>
        </div>
        <Link
          href="/sales/unregistered-invoices/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            placeholder="From Date"
            value={filters.from_date}
            onChange={(e) => handleFilterChange('from_date', e.target.value)}
            className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
          />

          <input
            type="date"
            placeholder="To Date"
            value={filters.to_date}
            onChange={(e) => handleFilterChange('to_date', e.target.value)}
            className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
          />

          <button
            onClick={() => {
              setFilters({
                search: '',
                status: '',
                customer_id: '',
                from_date: '',
                to_date: ''
              })
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      {!loading && !error && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No unregistered invoices found
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.invoice_number}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded">
                              Unregistered
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {invoice.customer_id?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Rs. {invoice.total_amount?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentStatusBadge(invoice.payment_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Link
                              href={`/sales/unregistered-invoices/${invoice._id}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </Link>
                            {invoice.status === 'Draft' && (
                              <>
                                <Link
                                  href={`/sales/unregistered-invoices/${invoice._id}/edit`}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelete(invoice._id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total invoices)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
