'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePayrolls, useProcessPayroll } from '@/hooks/usePayroll'

export default function PayrollPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    status: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  // React Query hooks
  const { data, isLoading, error, refetch } = usePayrolls(
    {
      status: filters.status || undefined,
      month: filters.month,
      year: filters.year,
    },
    { page: currentPage, limit: 50 }
  )

  const processPayroll = useProcessPayroll()

  // Extract data
  const payrolls = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }

  const handleProcess = async (id) => {
    if (!confirm('Process this payroll? This will finalize all calculations.')) return

    processPayroll.mutate(id)
  }

  const handleMarkPaid = async (id) => {
    const paymentMode = prompt('Enter payment mode (Bank Transfer/Cash/Cheque):')
    if (!paymentMode) return

    // Note: This needs a dedicated hook - using fetch for now
    try {
      const res = await fetch(`/api/payroll/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_mode: paymentMode }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Payroll marked as paid')
        refetch()
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Failed to mark payroll as paid')
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Processed': 'bg-blue-100 text-blue-800',
      'Paid': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    )
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const calculateTotals = () => {
    return {
      gross: payrolls.reduce((sum, p) => sum + p.gross_salary, 0),
      deductions: payrolls.reduce((sum, p) => sum + p.total_deductions, 0),
      net: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
    }
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payroll Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Process employee salaries and manage payments
          </p>
        </div>
        <Link
          href="/hr/payroll/generate"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Generate Payroll
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Failed to load payroll: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filters & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter by Period
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="Draft">Draft</option>
                <option value="Processed">Processed</option>
                <option value="Paid">Paid</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Summary for {months[filters.month - 1]} {filters.year}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Gross Salary</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                Rs. {totals.gross.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Deductions</div>
              <div className="text-lg font-bold text-red-600">
                Rs. {totals.deductions.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Net Salary</div>
              <div className="text-lg font-bold text-green-600">
                Rs. {totals.net.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payroll records found for {months[filters.month - 1]} {filters.year}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Basic Salary
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {payroll.employee_name}
                      <div className="text-xs text-gray-500">{payroll.employee_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                      Rs. {payroll.basic_salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300 text-right">
                      Rs. {payroll.gross_salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                      Rs. {payroll.total_deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                      Rs. {payroll.net_salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {payroll.present_days}/{payroll.working_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/hr/payroll/${payroll._id}`}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        View
                      </Link>
                      {payroll.status === 'Draft' && (
                        <button
                          onClick={() => handleProcess(payroll._id)}
                          className="text-green-600 hover:text-green-800 mr-3"
                        >
                          Process
                        </button>
                      )}
                      {payroll.status === 'Processed' && (
                        <button
                          onClick={() => handleMarkPaid(payroll._id)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
