/**
 * Payment Details Page
 * View payment/receipt details
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Skeleton } from '@/components/ui'
import { ArrowLeft, CheckCircle, XCircle, FileText, Edit, Trash2 } from 'lucide-react'

export default function PaymentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock user ID
  const userId = '507f1f77bcf86cd799439011'

  useEffect(() => {
    fetchPayment()
  }, [params.id])

  const fetchPayment = async () => {
    try {
      const response = await fetch(`/api/payments/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setPayment(data.data)
      } else {
        setError(data.error || 'Failed to fetch payment')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    if (!confirm('Post this payment? This will create accounting entries and cannot be undone.')) return

    try {
      const response = await fetch(`/api/payments/${params.id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted_by: userId }),
      })

      if (response.ok) {
        alert('Payment posted successfully!')
        fetchPayment()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to post payment')
      }
    } catch (error) {
      alert('Failed to post payment')
    }
  }

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    try {
      const response = await fetch(`/api/payments/${params.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_by: userId, cancellation_reason: reason }),
      })

      if (response.ok) {
        alert('Payment cancelled successfully!')
        fetchPayment()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel payment')
      }
    } catch (error) {
      alert('Failed to cancel payment')
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      Posted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Reconciled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return <Badge className={variants[status] || ''}>{status}</Badge>
  }

  const getTypeBadge = (type) => {
    const variants = {
      Receipt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return <Badge className={variants[type] || ''}>{type}</Badge>
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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <p>{error || 'Payment not found'}</p>
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
            href="/sales/payments"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{payment.payment_no}</h1>
              {getStatusBadge(payment.status)}
              {getTypeBadge(payment.payment_type)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{formatDate(payment.payment_date)}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {payment.status === 'Draft' && !payment.posted && (
            <>
              <Button variant="outline" onClick={handlePost}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Post Payment
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}

          {payment.journal_entry_id && (
            <Link href={`/accounting/journal/${payment.journal_entry_id}`}>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View Journal Entry
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payment Amount</div>
            <div className="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
              {formatCurrency(payment.amount)}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payment Method</div>
            <div className="text-xl font-semibold mt-2">{payment.payment_method}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payment Type</div>
            <div className="text-xl font-semibold mt-2">{payment.payment_type}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Party Type</div>
            <div className="text-xl font-semibold mt-2">{payment.party_type}</div>
          </div>
        </Card>
      </div>

      {/* Party Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">{payment.party_type} Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {payment.party_type} Name
              </div>
              <div className="font-medium">{payment.party_name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {payment.party_type} Code
              </div>
              <div className="font-medium">{payment.party_code}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Details */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Payment Date</div>
              <div className="font-medium">{formatDate(payment.payment_date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Payment Method</div>
              <div className="font-medium">{payment.payment_method}</div>
            </div>

            {payment.bank_name && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Bank Name</div>
                <div className="font-medium">{payment.bank_name}</div>
              </div>
            )}

            {payment.cheque_no && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Cheque Number</div>
                <div className="font-medium">{payment.cheque_no}</div>
              </div>
            )}

            {payment.transaction_ref && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Transaction Reference</div>
                <div className="font-medium">{payment.transaction_ref}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cash/Bank Account</div>
              <div className="font-medium">
                {payment.account_id?.account_code} - {payment.account_id?.account_name}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoice Information */}
      {payment.invoice_id && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Invoice Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Invoice Number</div>
                <div className="font-medium">
                  <Link
                    href={`/sales/invoices/${payment.invoice_id._id || payment.invoice_id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {payment.invoice_no || 'View Invoice'}
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Invoice Type</div>
                <div className="font-medium">{payment.invoice_type || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notes */}
      {(payment.notes || payment.internal_notes) && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            {payment.notes && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Notes</div>
                <p className="whitespace-pre-wrap mt-1">{payment.notes}</p>
              </div>
            )}
            {payment.internal_notes && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Internal Notes</div>
                <p className="whitespace-pre-wrap mt-1">{payment.internal_notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Audit Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Created At</div>
              <div>{formatDate(payment.createdAt)}</div>
            </div>
            {payment.posted_at && (
              <div>
                <div className="text-gray-500 dark:text-gray-400">Posted At</div>
                <div>{formatDate(payment.posted_at)}</div>
              </div>
            )}
            {payment.cancelled_at && (
              <div>
                <div className="text-gray-500 dark:text-gray-400">Cancelled At</div>
                <div>{formatDate(payment.cancelled_at)}</div>
              </div>
            )}
            {payment.cancellation_reason && (
              <div className="col-span-2">
                <div className="text-gray-500 dark:text-gray-400">Cancellation Reason</div>
                <div>{payment.cancellation_reason}</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Journal Entry Reference */}
      {payment.journal_entry_id && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Accounting</h3>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Journal Entry</div>
              <Link
                href={`/accounting/journal/${payment.journal_entry_id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View Journal Entry
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
