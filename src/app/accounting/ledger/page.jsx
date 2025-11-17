'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, Button, Input, Label, Alert, Skeleton, Table, Badge } from '@/components/ui'
import { Search, FileText, Download } from 'lucide-react'

export default function LedgerPage() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [ledgerData, setLedgerData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [error, setError] = useState(null)

  // Date range state
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAccounts()

    // Check for URL parameters
    const accountParam = searchParams.get('account')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (accountParam) {
      setSelectedAccount(accountParam)
    }
    if (startDateParam) {
      setStartDate(startDateParam)
    }
    if (endDateParam) {
      setEndDate(endDateParam)
    }
  }, [])

  // Auto-fetch ledger if account is pre-selected
  useEffect(() => {
    if (selectedAccount && accounts.length > 0) {
      fetchLedger()
    }
  }, [selectedAccount, accounts])

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const response = await fetch('/api/accounts?limit=1000&is_active=true&is_header=false')
      const data = await response.json()

      if (response.ok) {
        setAccounts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const fetchLedger = async () => {
    if (!selectedAccount) {
      setError('Please select an account')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const response = await fetch(`/api/ledger/${selectedAccount}?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ledger')
      }

      setLedgerData(data.data)
    } catch (err) {
      setError(err.message)
      setLedgerData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLedger = (e) => {
    e.preventDefault()
    fetchLedger()
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

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!ledgerData) return

    // Create CSV content
    const headers = ['Date', 'Entry No', 'Description', 'Debit', 'Credit', 'Balance']
    const rows = ledgerData.ledger_lines.map((line) => [
      formatDate(line.date),
      line.entry_no,
      `"${line.description}"`,
      line.debit,
      line.credit,
      line.balance,
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      `Opening Balance,,,,,${ledgerData.opening_balance}`,
      `Closing Balance,,,,,${ledgerData.closing_balance}`,
    ].join('\n')

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger_${ledgerData.account.account_code}_${startDate}_${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Account Ledger</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View detailed transaction history for any account
          </p>
        </div>
      </div>

      {/* Selection Form */}
      <Card>
        <div className="p-6">
          <form onSubmit={handleGenerateLedger} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="account">
                  Account <span className="text-red-500">*</span>
                </Label>
                <select
                  id="account"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                  disabled={loadingAccounts}
                  required
                >
                  <option value="">Select Account...</option>
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>

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
                {ledgerData && (
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
                {loading ? 'Loading...' : 'Generate Ledger'}
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

      {/* Ledger Display */}
      {ledgerData && (
        <>
          {/* Account Information */}
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    {ledgerData.account.account_code} - {ledgerData.account.account_name}
                  </h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge>{ledgerData.account.account_type}</Badge>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Normal Balance: {ledgerData.account.normal_balance}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Period</div>
                  <div className="font-medium">
                    {formatDate(startDate)} to {formatDate(endDate)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Opening Balance</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(ledgerData.opening_balance)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Closing Balance</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(ledgerData.closing_balance)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">Net Movement</div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(ledgerData.closing_balance - ledgerData.opening_balance)}
                </div>
              </div>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entry No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Opening Balance Row */}
                  <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                    <td className="px-6 py-4 text-sm" colSpan="3">
                      Opening Balance
                    </td>
                    <td className="px-6 py-4 text-sm text-right">-</td>
                    <td className="px-6 py-4 text-sm text-right">-</td>
                    <td className="px-6 py-4 text-sm text-right font-bold">
                      {formatCurrency(ledgerData.opening_balance)}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {ledgerData.ledger_lines.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledger_lines.map((line, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(line.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {line.entry_no}
                        </td>
                        <td className="px-6 py-4 text-sm">{line.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatCurrency(line.balance)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Closing Balance Row */}
                  <tr className="bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                    <td className="px-6 py-4 text-sm" colSpan="3">
                      Closing Balance
                    </td>
                    <td className="px-6 py-4 text-sm text-right">-</td>
                    <td className="px-6 py-4 text-sm text-right">-</td>
                    <td className="px-6 py-4 text-sm text-right font-bold">
                      {formatCurrency(ledgerData.closing_balance)}
                    </td>
                  </tr>
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
