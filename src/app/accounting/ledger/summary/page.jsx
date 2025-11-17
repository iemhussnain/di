'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Input, Label, Alert, Skeleton, Table, Badge } from '@/components/ui'
import { FileText, Download, Eye } from 'lucide-react'

export default function LedgerSummaryPage() {
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showZeroBalances, setShowZeroBalances] = useState(false)

  // Date range state
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate,
        endDate,
        showZeroBalances: showZeroBalances.toString(),
      })

      const response = await fetch(`/api/ledger/summary?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ledger summary')
      }

      setSummaryData(data.data)
    } catch (err) {
      setError(err.message)
      setSummaryData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = (e) => {
    e.preventDefault()
    fetchSummary()
  }

  useEffect(() => {
    fetchSummary()
  }, [])

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

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!summaryData) return

    // Create CSV content
    const headers = [
      'Account Code',
      'Account Name',
      'Type',
      'Opening Balance',
      'Total Debits',
      'Total Credits',
      'Net Movement',
      'Closing Balance',
      'Transactions',
    ]

    const rows = summaryData.accounts.map((account) => [
      account.account_code,
      `"${account.account_name}"`,
      account.account_type,
      account.opening_balance,
      account.total_debits,
      account.total_credits,
      account.net_movement,
      account.closing_balance,
      account.transaction_count,
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'Totals',
      '',
      '',
      summaryData.totals.total_opening_balance,
      summaryData.totals.total_debits,
      summaryData.totals.total_credits,
      '',
      summaryData.totals.total_closing_balance,
    ].join('\n')

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger_summary_${startDate}_${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getAccountTypeBadge = (type) => {
    const variants = {
      Asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      Equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Revenue: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }

    return <Badge className={variants[type] || ''}>{type}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">General Ledger Summary</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of all account balances and movements
          </p>
        </div>
      </div>

      {/* Selection Form */}
      <Card>
        <div className="p-6">
          <form onSubmit={handleGenerateSummary} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showZeroBalances}
                    onChange={(e) => setShowZeroBalances(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show zero balances</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {summaryData && (
                  <>
                    <Button type="button" variant="outline" onClick={handlePrint}>
                      <FileText className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button type="button" variant="outline" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </>
                )}
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Generate Summary'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {/* Summary Display */}
      {summaryData && (
        <>
          {/* Period Information */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Summary Period</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(summaryData.start_date)} to {formatDate(summaryData.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Accounts</div>
                  <div className="text-2xl font-bold">{summaryData.accounts.length}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Totals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Opening Balance</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(summaryData.totals.total_opening_balance)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Debits</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(summaryData.totals.total_debits)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Credits</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(summaryData.totals.total_credits)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Closing Balance</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(summaryData.totals.total_closing_balance)}
                </div>
              </div>
            </Card>
          </div>

          {/* Summary Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Opening
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Debits
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Net Movement
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Closing
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Txns
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {summaryData.accounts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                        No accounts with activity found
                      </td>
                    </tr>
                  ) : (
                    summaryData.accounts.map((account) => (
                      <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium">{account.account_code}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {account.account_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAccountTypeBadge(account.account_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {formatCurrency(account.opening_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {formatCurrency(account.total_debits)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {formatCurrency(account.total_credits)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={
                              account.net_movement > 0
                                ? 'text-green-600 dark:text-green-400'
                                : account.net_movement < 0
                                ? 'text-red-600 dark:text-red-400'
                                : ''
                            }
                          >
                            {formatCurrency(account.net_movement)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatCurrency(account.closing_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {account.transaction_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            href={`/accounting/ledger?account=${account.account_id}&startDate=${startDate}&endDate=${endDate}`}
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </Card>
      )}
    </div>
  )
}
