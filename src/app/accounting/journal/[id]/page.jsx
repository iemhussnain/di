'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Skeleton, Table } from '@/components/ui'
import { ArrowLeft, Edit, Trash2, CheckCircle, RotateCcw } from 'lucide-react'

export default function JournalEntryDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock user ID - in production this would come from auth context
  const userId = '507f1f77bcf86cd799439011'

  useEffect(() => {
    if (params.id) {
      fetchEntry()
    }
  }, [params.id])

  const fetchEntry = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/journal-entries/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch journal entry')
      }

      setEntry(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    if (!confirm('Are you sure you want to post this journal entry? This action will update account balances and cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/journal-entries/${params.id}/post`, {
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
      fetchEntry() // Refresh to show updated status
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleReverse = async () => {
    if (!confirm('Are you sure you want to reverse this journal entry? This will create a new reversing entry.')) {
      return
    }

    try {
      const response = await fetch(`/api/journal-entries/${params.id}/reverse`, {
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

      alert('Reversing entry created successfully!')
      // Navigate to the new reversing entry
      router.push(`/accounting/journal/${data.data._id}`)
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/journal-entries/${params.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete journal entry')
      }

      router.push('/accounting/journal')
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
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <p>{error || 'Journal entry not found'}</p>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/accounting/journal"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{entry.entry_no}</h1>
              {getPostedBadge(entry.posted)}
              {getEntryTypeBadge(entry.entry_type)}
              {entry.is_reversal && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Reversal Entry
                </Badge>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{formatDate(entry.entry_date)}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!entry.posted && (
            <>
              <Link href={`/accounting/journal/${entry._id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handlePost}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Post Entry
              </Button>
            </>
          )}
          {entry.posted && !entry.is_reversal && (
            <Button variant="outline" onClick={handleReverse}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reverse Entry
            </Button>
          )}
        </div>
      </div>

      {/* Entry Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Debit</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(entry.total_debit)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Credit</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(entry.total_credit)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Balance Status</div>
            <div className="text-2xl font-bold mt-2">
              {entry.is_balanced ? (
                <span className="text-green-600 dark:text-green-400">Balanced</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">Out of Balance</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Description</h3>
          <p className="text-gray-700 dark:text-gray-300">{entry.description}</p>
        </div>
      </Card>

      {/* Journal Lines */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Journal Lines</h3>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entry.lines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium">
                        {line.account_id?.account_code} - {line.account_id?.account_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {line.description || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-4 text-sm" colSpan="2">
                    Totals
                  </td>
                  <td className="px-4 py-4 text-sm text-right">
                    {formatCurrency(entry.total_debit)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right">
                    {formatCurrency(entry.total_credit)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Audit Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Audit Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Created By</div>
              <div className="font-medium">
                {entry.created_by?.name || entry.created_by?.email || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">{formatDateTime(entry.createdAt)}</div>
            </div>

            {entry.posted && (
              <div>
                <div className="text-sm text-gray-500">Posted By</div>
                <div className="font-medium">
                  {entry.posted_by?.name || entry.posted_by?.email || 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">{formatDateTime(entry.posted_at)}</div>
              </div>
            )}

            {entry.reference_no && (
              <div>
                <div className="text-sm text-gray-500">Reference No</div>
                <div className="font-medium">{entry.reference_no}</div>
              </div>
            )}

            {entry.reversed_entry_id && (
              <div>
                <div className="text-sm text-gray-500">Reversed Entry</div>
                <Link
                  href={`/accounting/journal/${entry.reversed_entry_id._id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {entry.reversed_entry_id.entry_no}
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Notes */}
      {entry.notes && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.notes}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
