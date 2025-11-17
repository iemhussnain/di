'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Table, Input, Label } from '@/components/ui'
import { ArrowLeft, DollarSign, XCircle } from 'lucide-react'

export default function SalesInvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => {
    fetchInvoice()
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

  const handlePost = async () => {
    if (!confirm('Post this invoice? This will create accounting entries.')) return

    try {
      const response = await fetch(`/api/sales-invoices/${params.id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted_by: '507f1f77bcf86cd799439011' }),
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

    try {
      const response = await fetch(`/api/sales-invoices/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        alert('Payment recorded successfully!')
        fetchInvoice()
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      alert('Failed to record payment')
    }
  }

  const formatCurrency = (amount) => `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
  const formatDate = (date) => new Date(date).toLocaleDateString('en-PK')

  if (loading) return <div className="p-6">Loading...</div>
  if (!invoice) return <div className="p-6">Invoice not found</div>

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

      {invoice.posted && invoice.amount_due > 0 && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Record Payment</h3>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={invoice.amount_due}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleRecordPayment}>Record Payment</Button>
              </div>
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
