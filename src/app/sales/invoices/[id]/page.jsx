'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Table, Input, Label, Select, Textarea } from '@/components/ui'
import { ArrowLeft, DollarSign, XCircle } from 'lucide-react'

export default function SalesInvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [accountId, setAccountId] = useState('')
  const [bankName, setBankName] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [accounts, setAccounts] = useState([])

  // Mock user ID - TODO: Replace with actual session
  const userId = '507f1f77bcf86cd799439011'

  useEffect(() => {
    fetchInvoice()
    fetchAccounts()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/sales-invoices/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setInvoice(data.data)
        setPaymentAmount(data.data.amount_due.toString())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts?limit=1000')
      const data = await response.json()
      if (response.ok) {
        // Filter for Cash/Bank accounts
        const cashBankAccounts = data.data?.filter(
          (acc) => acc.account_type === 'Asset' &&
          (acc.account_name?.toLowerCase().includes('cash') ||
           acc.account_name?.toLowerCase().includes('bank'))
        ) || []
        setAccounts(cashBankAccounts)
        // Set default account if available
        if (cashBankAccounts.length > 0 && !accountId) {
          setAccountId(cashBankAccounts[0]._id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const handlePost = async () => {
    if (!confirm('Post this invoice? This will create accounting entries.')) return

    try {
      const response = await fetch(`/api/sales-invoices/${params.id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted_by: userId }),
      })

      if (response.ok) {
        alert('Invoice posted successfully!')
        fetchInvoice()
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      alert('Failed to post invoice')
    }
  }

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!accountId) {
      alert('Please select a cash/bank account')
      return
    }

    try {
      const payload = {
        amount,
        payment_method: paymentMethod,
        account_id: accountId,
        created_by: userId,
      }

      // Add optional fields
      if (bankName) payload.bank_name = bankName
      if (chequeNo) payload.cheque_no = chequeNo
      if (transactionRef) payload.transaction_ref = transactionRef
      if (paymentNotes) payload.notes = paymentNotes

      const response = await fetch(`/api/sales-invoices/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Payment recorded successfully! Payment No: ${data.data.payment.payment_no}`)
        // Reset form
        setPaymentAmount('')
        setBankName('')
        setChequeNo('')
        setTransactionRef('')
        setPaymentNotes('')
        setPaymentMethod('Cash')
        fetchInvoice()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to record payment')
      }
    } catch (error) {
      alert('Failed to record payment')
      console.error(error)
    }
  }

  const formatCurrency = (amount) => `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
  const formatDate = (date) => new Date(date).toLocaleDateString('en-PK')

  if (loading) return <div className="p-6">Loading...</div>
  if (!invoice) return <div className="p-6">Invoice not found</div>

  const needsBankDetails = ['Bank Transfer', 'Cheque', 'Online Payment'].includes(paymentMethod)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/sales/invoices" className="p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoice_no}</h1>
            <p className="text-gray-500">{formatDate(invoice.invoice_date)}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {!invoice.posted && (
            <Button onClick={handlePost}>
              <DollarSign className="w-4 h-4 mr-2" />
              Post Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500">Grand Total</div>
          <div className="text-2xl font-bold">{formatCurrency(invoice.grand_total)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500">Amount Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(invoice.amount_paid)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500">Amount Due</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(invoice.amount_due)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-bold">{invoice.status}</div>
        </Card>
      </div>

      {/* Payment Recording Form */}
      {invoice.posted && invoice.amount_due > 0 && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Record Payment</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Payment Amount (PKR) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={invoice.amount_due}
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Max: {formatCurrency(invoice.amount_due)}
                </p>
              </div>

              <div>
                <Label>Payment Method *</Label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Online Payment">Online Payment</option>
                </Select>
              </div>

              <div>
                <Label>Cash/Bank Account *</Label>
                <Select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {needsBankDetails && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., HBL, UBL, MCB"
                  />
                </div>

                {paymentMethod === 'Cheque' && (
                  <div>
                    <Label>Cheque Number</Label>
                    <Input
                      type="text"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="Cheque number"
                    />
                  </div>
                )}

                <div>
                  <Label>Transaction Reference</Label>
                  <Input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Reference number"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add notes about this payment"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleRecordPayment}>
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Customer</h3>
          <div>
            <strong>{invoice.customer_name}</strong> ({invoice.customer_code})
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Invoice Lines</h3>
          <Table>
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-3">{line.item_id?.item_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-right">{line.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(line.unit_price)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(line.line_total)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan="3" className="px-4 py-3 text-right">Grand Total:</td>
                <td className="px-4 py-3 text-right">{formatCurrency(invoice.grand_total)}</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
