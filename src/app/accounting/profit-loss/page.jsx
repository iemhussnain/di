'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Label, Alert, Skeleton, Table, Badge } from '@/components/ui'
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react'

export default function ProfitLossPage() {
  const [profitLossData, setProfitLossData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Date range state
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    generateProfitLoss()
  }, [])

  const generateProfitLoss = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const response = await fetch(`/api/profit-loss?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate profit & loss statement')
      }

      setProfitLossData(data.data)
    } catch (err) {
      setError(err.message)
      setProfitLossData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = (e) => {
    e.preventDefault()
    generateProfitLoss()
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
      month: 'long',
      day: 'numeric',
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!profitLossData) return

    const rows = []

    // Revenue section
    rows.push(['REVENUE', '', ''])
    profitLossData.revenue.forEach((account) => {
      const indent = '  '.repeat(account.indent_level)
      rows.push([
        `${indent}${account.account_code}`,
        `"${indent}${account.account_name}"`,
        account.total_balance,
      ])
    })
    rows.push(['Total Revenue', '', profitLossData.total_revenue])
    rows.push(['', '', ''])

    // Expenses section
    rows.push(['EXPENSES', '', ''])
    profitLossData.expenses.forEach((account) => {
      const indent = '  '.repeat(account.indent_level)
      rows.push([
        `${indent}${account.account_code}`,
        `"${indent}${account.account_name}"`,
        account.total_balance,
      ])
    })
    rows.push(['Total Expenses', '', profitLossData.total_expenses])
    rows.push(['', '', ''])

    rows.push(['Net Profit/(Loss)', '', profitLossData.net_profit])

    const csv = [
      ['Profit & Loss Statement', '', ''],
      [
        `Period: ${formatDate(profitLossData.start_date)} to ${formatDate(profitLossData.end_date)}`,
        '',
        '',
      ],
      ['', '', ''],
      ['Account Code', 'Account Name', 'Amount'],
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    downloadCSV(csv)
  }

  const downloadCSV = (csv) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profit_loss_${startDate}_${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderAccountSection = (accounts, title, total, bgColor = 'bg-gray-50') => {
    if (!accounts || accounts.length === 0) {
      return (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white uppercase">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 italic px-6 py-4">
            No {title.toLowerCase()} accounts found
          </p>
        </div>
      )
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white uppercase">
          {title}
        </h3>
        <Table>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  account.is_header ? 'font-semibold bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <td className="px-6 py-3 whitespace-nowrap text-sm">
                  <span style={{ paddingLeft: `${account.indent_level * 20}px` }}>
                    {account.account_code}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <span style={{ paddingLeft: `${account.indent_level * 20}px` }}>
                    {account.account_name}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                  {account.total_balance !== 0 ? formatCurrency(account.total_balance) : '-'}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className={`${bgColor} dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600`}>
              <td className="px-6 py-4 text-sm" colSpan="2">
                Total {title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {formatCurrency(total)}
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Income statement showing revenue, expenses, and net profit
          </p>
        </div>
      </div>

      {/* Selection Form */}
      <Card>
        <div className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {profitLossData && (
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
                {loading ? 'Generating...' : 'Generate Statement'}
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

      {/* Profit & Loss Display */}
      {profitLossData && (
        <>
          {/* Report Header */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Profit & Loss Statement</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Period: {formatDate(profitLossData.start_date)} to{' '}
                    {formatDate(profitLossData.end_date)}
                  </p>
                </div>
                <div>
                  {profitLossData.is_profitable ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Profitable
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-4 py-2">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Loss
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
                <div className="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
                  {formatCurrency(profitLossData.total_revenue)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</div>
                <div className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
                  {formatCurrency(profitLossData.total_expenses)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Net Profit/(Loss)
                </div>
                <div
                  className={`text-2xl font-bold mt-2 ${
                    profitLossData.is_profitable
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(profitLossData.net_profit)}
                </div>
              </div>
            </Card>
          </div>

          {/* Profit & Loss Sections */}
          <Card>
            <div className="p-6">
              {/* Revenue */}
              {renderAccountSection(
                profitLossData.revenue,
                'Revenue',
                profitLossData.total_revenue,
                'bg-green-50'
              )}

              {/* Expenses */}
              {renderAccountSection(
                profitLossData.expenses,
                'Expenses',
                profitLossData.total_expenses,
                'bg-red-50'
              )}

              {/* Net Profit/Loss */}
              <div className="mt-8 border-t-4 border-gray-400 dark:border-gray-500 pt-4">
                <div
                  className={`grid grid-cols-3 gap-4 px-6 py-4 rounded-md ${
                    profitLossData.is_profitable
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div
                    className={`col-span-2 font-bold text-lg ${
                      profitLossData.is_profitable
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    Net Profit/(Loss)
                  </div>
                  <div
                    className={`text-right font-bold text-lg ${
                      profitLossData.is_profitable
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {formatCurrency(profitLossData.net_profit)}
                  </div>
                </div>
              </div>

              {/* Profit Margin */}
              {profitLossData.total_revenue > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4 px-6 py-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <div className="col-span-2 font-semibold text-blue-700 dark:text-blue-300">
                    Profit Margin
                  </div>
                  <div className="text-right font-semibold text-blue-700 dark:text-blue-300">
                    {((profitLossData.net_profit / profitLossData.total_revenue) * 100).toFixed(
                      2
                    )}
                    %
                  </div>
                </div>
              )}
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
