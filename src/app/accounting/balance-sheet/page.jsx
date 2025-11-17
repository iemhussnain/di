'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Label, Alert, Skeleton, Table, Badge } from '@/components/ui'
import { FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function BalanceSheetPage() {
  const [balanceSheetData, setBalanceSheetData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [includeRatios, setIncludeRatios] = useState(false)

  // Date state
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    generateBalanceSheet()
  }, [])

  const generateBalanceSheet = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        asOfDate,
        includeRatios: includeRatios.toString(),
      })

      const response = await fetch(`/api/balance-sheet?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate balance sheet')
      }

      setBalanceSheetData(data.data)
    } catch (err) {
      setError(err.message)
      setBalanceSheetData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = (e) => {
    e.preventDefault()
    generateBalanceSheet()
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
    if (!balanceSheetData) return

    const rows = []

    // Assets section
    rows.push(['ASSETS', '', ''])
    balanceSheetData.assets.forEach((account) => {
      const indent = '  '.repeat(account.indent_level)
      rows.push([
        `${indent}${account.account_code}`,
        `"${indent}${account.account_name}"`,
        account.total_balance,
      ])
    })
    rows.push(['Total Assets', '', balanceSheetData.total_assets])
    rows.push(['', '', ''])

    // Liabilities section
    rows.push(['LIABILITIES', '', ''])
    balanceSheetData.liabilities.forEach((account) => {
      const indent = '  '.repeat(account.indent_level)
      rows.push([
        `${indent}${account.account_code}`,
        `"${indent}${account.account_name}"`,
        account.total_balance,
      ])
    })
    rows.push(['Total Liabilities', '', balanceSheetData.total_liabilities])
    rows.push(['', '', ''])

    // Equity section
    rows.push(['EQUITY', '', ''])
    balanceSheetData.equity.forEach((account) => {
      const indent = '  '.repeat(account.indent_level)
      rows.push([
        `${indent}${account.account_code}`,
        `"${indent}${account.account_name}"`,
        account.total_balance,
      ])
    })
    rows.push(['Total Equity', '', balanceSheetData.total_equity])
    rows.push(['', '', ''])

    rows.push(['Total Liabilities and Equity', '', balanceSheetData.total_liabilities_and_equity])

    const csv = [
      ['Balance Sheet', '', ''],
      [`As of ${formatDate(balanceSheetData.as_of_date)}`, '', ''],
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
    a.download = `balance_sheet_${asOfDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderAccountSection = (accounts, title, total, bgColor = 'bg-gray-50') => {
    if (!accounts || accounts.length === 0) return null

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
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Statement of financial position showing assets, liabilities, and equity
          </p>
        </div>
      </div>

      {/* Selection Form */}
      <Card>
        <div className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="asOfDate">As of Date</Label>
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeRatios}
                    onChange={(e) => setIncludeRatios(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Include Financial Ratios</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {balanceSheetData && (
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
                {loading ? 'Generating...' : 'Generate Balance Sheet'}
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

      {/* Balance Sheet Display */}
      {balanceSheetData && (
        <>
          {/* Report Header */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Balance Sheet</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    As of {formatDate(balanceSheetData.as_of_date)}
                  </p>
                </div>
                <div>
                  {balanceSheetData.is_balanced ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Balanced
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-4 py-2">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Out of Balance
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
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Assets</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(balanceSheetData.total_assets)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Liabilities
                </div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(balanceSheetData.total_liabilities)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Equity</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(balanceSheetData.total_equity)}
                </div>
              </div>
            </Card>
          </div>

          {/* Financial Ratios */}
          {balanceSheetData.ratios && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Ratios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Current Ratio</div>
                    <div className="text-xl font-bold mt-1">
                      {balanceSheetData.ratios.current_ratio.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Debt-to-Equity Ratio
                    </div>
                    <div className="text-xl font-bold mt-1">
                      {balanceSheetData.ratios.debt_to_equity_ratio.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Equity Ratio</div>
                    <div className="text-xl font-bold mt-1">
                      {(balanceSheetData.ratios.equity_ratio * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Balance Sheet Sections */}
          <Card>
            <div className="p-6">
              {/* Assets */}
              {renderAccountSection(
                balanceSheetData.assets,
                'Assets',
                balanceSheetData.total_assets,
                'bg-blue-50'
              )}

              {/* Liabilities */}
              {renderAccountSection(
                balanceSheetData.liabilities,
                'Liabilities',
                balanceSheetData.total_liabilities,
                'bg-red-50'
              )}

              {/* Equity */}
              {renderAccountSection(
                balanceSheetData.equity,
                'Equity',
                balanceSheetData.total_equity,
                'bg-purple-50'
              )}

              {/* Grand Total */}
              <div className="mt-8 border-t-4 border-gray-400 dark:border-gray-500 pt-4">
                <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="col-span-2 font-bold text-lg">
                    Total Liabilities and Equity
                  </div>
                  <div className="text-right font-bold text-lg">
                    {formatCurrency(balanceSheetData.total_liabilities_and_equity)}
                  </div>
                </div>

                {/* Difference if not balanced */}
                {!balanceSheetData.is_balanced && (
                  <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-red-50 dark:bg-red-900/20 rounded-md mt-2">
                    <div className="col-span-2 font-bold text-red-700 dark:text-red-300">
                      Difference (Out of Balance)
                    </div>
                    <div className="text-right font-bold text-red-700 dark:text-red-300">
                      {formatCurrency(Math.abs(balanceSheetData.difference))}
                    </div>
                  </div>
                )}
              </div>
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
