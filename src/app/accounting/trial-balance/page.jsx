'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Label, Alert, Skeleton, Table, Badge } from '@/components/ui'
import { FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function TrialBalancePage() {
  const [trialBalanceData, setTrialBalanceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [groupByType, setGroupByType] = useState(false)

  // Date state
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    generateTrialBalance()
  }, [])

  const generateTrialBalance = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        asOfDate,
        grouped: groupByType.toString(),
      })

      const response = await fetch(`/api/trial-balance?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trial balance')
      }

      setTrialBalanceData(data.data)
    } catch (err) {
      setError(err.message)
      setTrialBalanceData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = (e) => {
    e.preventDefault()
    generateTrialBalance()
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
    if (!trialBalanceData) return

    if (groupByType) {
      // Export grouped data
      const rows = []
      const grouped = trialBalanceData.grouped_accounts

      for (const type in grouped) {
        if (grouped[type].length > 0) {
          rows.push([type, '', '', '']) // Type header
          grouped[type].forEach((account) => {
            rows.push([
              account.account_code,
              `"${account.account_name}"`,
              account.debit,
              account.credit,
            ])
          })
          // Subtotal
          rows.push([
            `${type} Subtotal`,
            '',
            trialBalanceData.subtotals[type].debit,
            trialBalanceData.subtotals[type].credit,
          ])
          rows.push(['', '', '', '']) // Empty row
        }
      }

      const csv = [
        ['Account Code', 'Account Name', 'Debit', 'Credit'],
        ...rows.map((row) => row.join(',')),
        '',
        `Total,,,${trialBalanceData.total_debit},${trialBalanceData.total_credit}`,
        `Difference,,,${trialBalanceData.difference}`,
      ].join('\n')

      downloadCSV(csv, 'grouped')
    } else {
      // Export flat data
      const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit']
      const rows = trialBalanceData.trial_balance.map((entry) => [
        entry.account_code,
        `"${entry.account_name}"`,
        entry.account_type,
        entry.debit,
        entry.credit,
      ])

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
        '',
        `Total,,,${trialBalanceData.total_debit},${trialBalanceData.total_credit}`,
        `Difference,,,${trialBalanceData.difference}`,
      ].join('\n')

      downloadCSV(csv, 'flat')
    }
  }

  const downloadCSV = (csv, type) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trial_balance_${type}_${asOfDate}.csv`
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

  const renderGroupedTrialBalance = () => {
    const { grouped_accounts, subtotals } = trialBalanceData
    const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']

    return (
      <>
        {accountTypes.map((type) => {
          const accounts = grouped_accounts[type]
          if (!accounts || accounts.length === 0) return null

          return (
            <div key={type} className="mb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  {getAccountTypeBadge(type)}
                  <span className="ml-2">{type} Accounts</span>
                </h3>
              </div>

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
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {accounts.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {entry.account_code}
                      </td>
                      <td className="px-6 py-4 text-sm">{entry.account_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal Row */}
                  <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                    <td className="px-6 py-4 text-sm" colSpan="2">
                      {type} Subtotal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(subtotals[type].debit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(subtotals[type].credit)}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )
        })}
      </>
    )
  }

  const renderFlatTrialBalance = () => {
    return (
      <Table>
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Account Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Account Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Debit
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Credit
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {trialBalanceData.trial_balance.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                No accounts with balances found
              </td>
            </tr>
          ) : (
            trialBalanceData.trial_balance.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {entry.account_code}
                </td>
                <td className="px-6 py-4 text-sm">{entry.account_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getAccountTypeBadge(entry.account_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Verify that total debits equal total credits
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
                    checked={groupByType}
                    onChange={(e) => setGroupByType(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Group by Account Type</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {trialBalanceData && (
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
                {loading ? 'Generating...' : 'Generate Trial Balance'}
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

      {/* Trial Balance Display */}
      {trialBalanceData && (
        <>
          {/* Report Header */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Trial Balance</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    As of {formatDate(trialBalanceData.as_of_date)}
                  </p>
                </div>
                <div>
                  {trialBalanceData.is_balanced ? (
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

          {/* Totals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Debits</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(trialBalanceData.total_debit)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Credits</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(trialBalanceData.total_credit)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Difference</div>
                <div
                  className={`text-2xl font-bold mt-2 ${
                    trialBalanceData.is_balanced
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(Math.abs(trialBalanceData.difference))}
                </div>
              </div>
            </Card>
          </div>

          {/* Trial Balance Table */}
          <Card>
            <div className="overflow-x-auto p-6">
              {groupByType ? renderGroupedTrialBalance() : renderFlatTrialBalance()}

              {/* Grand Total Row */}
              <div className="mt-6 border-t-2 border-gray-300 dark:border-gray-600 pt-4">
                <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="col-span-3 font-bold text-lg">Grand Total</div>
                  <div className="text-right font-bold text-lg">
                    {formatCurrency(trialBalanceData.total_debit)}
                  </div>
                  <div className="text-right font-bold text-lg">
                    {formatCurrency(trialBalanceData.total_credit)}
                  </div>
                </div>
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
