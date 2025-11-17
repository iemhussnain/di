'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Input, Badge, Alert, Skeleton, Table } from '@/components/ui'
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, RotateCcw } from 'lucide-react'

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [entryTypeFilter, setEntryTypeFilter] = useState('all')
  const [postedFilter, setPostedFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  // Mock user ID - in production this would come from auth context
  const userId = '507f1f77bcf86cd799439011'

  useEffect(() => {
    fetchEntries()
  }, [pagination.page, entryTypeFilter, postedFilter])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(entryTypeFilter !== 'all' && { entry_type: entryTypeFilter }),
        ...(postedFilter !== 'all' && { posted: postedFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      })

      const response = await fetch(`/api/journal-entries?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch journal entries')
      }

      setEntries(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchEntries()
  }

  const handlePost = async (id) => {
    if (!confirm('Are you sure you want to post this journal entry? This action will update account balances.')) {
      return
    }

    try {
      const response = await fetch(`/api/journal-entries/${id}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posted_by: userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post journal entry')
      }

      alert('Journal entry posted successfully!')
      fetchEntries()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleReverse = async (id) => {
    if (!confirm('Are you sure you want to reverse this journal entry? This will create a new reversing entry.')) {
      return
    }

    try {
      const response = await fetch(`/api/journal-entries/${id}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ created_by: userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reverse journal entry')
      }

      alert('Reversing entry created and posted successfully!')
      fetchEntries()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete journal entry')
      }

      fetchEntries()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
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

  const getEntryTypeBadge = (type) => {
    const variants = {
      Sales: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Purchase: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Payment: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      Receipt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Adjustment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Payroll: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Manual: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }

    return <Badge className={variants[type] || variants.Manual}>{type}</Badge>
  }

  const getPostedBadge = (posted) => {
    return posted ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Posted
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Draft
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage accounting journal entries
          </p>
        </div>
        <Link href="/accounting/journal/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Journal Entry
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <select
                value={entryTypeFilter}
                onChange={(e) => {
                  setEntryTypeFilter(e.target.value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="all">All Types</option>
                <option value="Manual">Manual</option>
                <option value="Sales">Sales</option>
                <option value="Purchase">Purchase</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Payroll">Payroll</option>
              </select>
            </div>

            <div>
              <select
                value={postedFilter}
                onChange={(e) => {
                  setPostedFilter(e.target.value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="all">All Status</option>
                <option value="true">Posted</option>
                <option value="false">Draft</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
            </div>

            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
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

      {/* Journal Entries Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entry No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No journal entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {entry.entry_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getEntryTypeBadge(entry.entry_type)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-w-md truncate">{entry.description}</div>
                      {entry.is_reversal && (
                        <Badge className="mt-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          Reversal Entry
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(entry.total_debit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getPostedBadge(entry.posted)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/accounting/journal/${entry._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {!entry.posted && (
                          <>
                            <Link href={`/accounting/journal/${entry._id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePost(entry._id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {entry.posted && !entry.is_reversal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReverse(entry._id)}
                            className="text-orange-600"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
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
        {!loading && entries.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
