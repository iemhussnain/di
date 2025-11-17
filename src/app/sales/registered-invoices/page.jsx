'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageTransition, SlideIn, FadeIn, StaggerContainer, StaggerTableRow } from '@/components/animations'
import { TableSkeleton } from '@/components/animations/SkeletonLoader'
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices'

export default function RegisteredSalesInvoicesPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    from_date: '',
    to_date: '',
    is_registered: 'true', // Only registered invoices
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  })

  // Use React Query hook for data fetching
  const { data, isLoading, error, refetch } = useInvoices(filters, pagination)
  const deleteInvoice = useDeleteInvoice()

  // Extract data from React Query response
  const invoices = data?.invoices || data?.data || []
  const paginationData = data?.pagination || {
    page: pagination.page,
    limit: pagination.limit,
    total: 0,
    pages: 0,
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      await deleteInvoice.mutateAsync(id)
      refetch()
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
      'Posted': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700',
      'Cancelled': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700',
    }
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status}
      </span>
    )
  }

  const getPaymentStatusBadge = (status) => {
    const colors = {
      'Unpaid': 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700',
      'Partially Paid': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
      'Paid': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700',
      'Overdue': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700',
    }
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <PageTransition className="space-y-8 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <SlideIn direction="down" className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Registered Sales Invoices
            </h1>
            <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full shadow-sm">
              FBR Compliant
            </span>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Manage FBR-compliant invoices for registered customers with NTN or STRN
          </p>
        </div>
        <Link
          href="/sales/registered-invoices/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </SlideIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Payment Status
            </label>
            <select
              value={filters.payment_status}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">All Payment Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              From Date
            </label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              To Date
            </label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
        </div>
        </div>
      </FadeIn>

      {/* Invoices Table */}
      <FadeIn delay={0.2}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={9} />
          ) : error ? (
            <div className="p-16 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <svg className="w-16 h-16 mx-auto text-red-300 dark:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Failed to load invoices</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{error?.message || 'An error occurred'}</p>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : invoices.length === 0 ? (
          <div className="p-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No invoices found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get started by creating your first FBR-compliant invoice</p>
              <Link
                href="/sales/registered-invoices/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Invoice
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      NTN/STRN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <StaggerContainer staggerDelay={0.05}>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.map((invoice) => (
                      <StaggerTableRow key={invoice._id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/sales/registered-invoices/${invoice._id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
                          >
                            {invoice.invoice_no}
                          </Link>
                          <span className="px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                            FBR
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{invoice.customer_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{invoice.customer_code}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {invoice.customer_ntn && <div className="font-medium">NTN: {invoice.customer_ntn}</div>}
                        {invoice.customer_strn && <div className="text-xs mt-0.5">STRN: {invoice.customer_strn}</div>}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-200">
                        Rs. {invoice.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-200">
                        Rs. {invoice.amount_due.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {getPaymentStatusBadge(invoice.payment_status)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium space-x-3">
                        <Link
                          href={`/sales/registered-invoices/${invoice._id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
                        >
                          View
                        </Link>
                        {invoice.status === 'Draft' && (
                          <Link
                            href={`/sales/registered-invoices/${invoice._id}/edit`}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-colors"
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                      </StaggerTableRow>
                    ))}
                  </tbody>
                </StaggerContainer>
              </table>
            </div>

            {/* Pagination */}
            {paginationData.pages > 1 && (
              <div className="px-6 py-5 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="text-gray-900 dark:text-white font-semibold">Page {paginationData.page}</span> of {paginationData.pages}
                  <span className="text-gray-500 dark:text-gray-400 ml-2">({paginationData.total} total invoices)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: paginationData.page - 1 })}
                    disabled={paginationData.page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: paginationData.page + 1 })}
                    disabled={paginationData.page === paginationData.pages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </FadeIn>
    </PageTransition>
  )
}
