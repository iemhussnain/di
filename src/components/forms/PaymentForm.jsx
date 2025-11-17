/**
 * Payment Form Component
 * Form for creating and editing payments/receipts
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, Label, Select, Textarea, Alert } from '@/components/ui'
import { Save, X } from 'lucide-react'

export default function PaymentForm({ payment = null, mode = 'create' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    payment_date: payment?.payment_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    payment_type: payment?.payment_type || 'Receipt',
    party_type: payment?.party_type || 'Customer',
    party_id: payment?.party_id?._id || payment?.party_id || '',
    amount: payment?.amount || '',
    payment_method: payment?.payment_method || 'Cash',
    bank_name: payment?.bank_name || '',
    cheque_no: payment?.cheque_no || '',
    transaction_ref: payment?.transaction_ref || '',
    invoice_type: payment?.invoice_type || '',
    invoice_id: payment?.invoice_id?._id || payment?.invoice_id || '',
    account_id: payment?.account_id?._id || payment?.account_id || '',
    notes: payment?.notes || '',
    internal_notes: payment?.internal_notes || '',
  })

  // Dropdown data
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [accounts, setAccounts] = useState([])
  const [invoices, setInvoices] = useState([])

  // Mock user ID - TODO: Replace with actual session
  const userId = '507f1f77bcf86cd799439011'

  useEffect(() => {
    fetchCustomers()
    fetchVendors()
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (formData.party_id && formData.party_type) {
      fetchInvoices()
    }
  }, [formData.party_id, formData.party_type])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=1000')
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors?limit=1000')
      const data = await response.json()
      if (response.ok) {
        setVendors(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
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
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const endpoint = formData.party_type === 'Customer'
        ? `/api/sales-invoices?customer_id=${formData.party_id}&status=Posted&limit=100`
        : `/api/purchase-invoices?vendor_id=${formData.party_id}&status=Posted&limit=100`

      const response = await fetch(endpoint)
      const data = await response.json()

      if (response.ok) {
        // Filter unpaid or partially paid invoices
        const unpaidInvoices = data.data?.filter(inv => inv.amount_due > 0) || []
        setInvoices(unpaidInvoices)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoices([])
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Reset dependent fields
    if (field === 'party_type') {
      setFormData((prev) => ({
        ...prev,
        party_id: '',
        invoice_id: '',
        invoice_type: value === 'Customer' ? 'SalesInvoice' : 'PurchaseInvoice'
      }))
      setInvoices([])
    }

    if (field === 'party_id') {
      setFormData((prev) => ({ ...prev, invoice_id: '' }))
    }

    if (field === 'payment_method') {
      // Clear bank-specific fields if not applicable
      if (!['Bank Transfer', 'Cheque', 'Online Payment'].includes(value)) {
        setFormData((prev) => ({
          ...prev,
          bank_name: '',
          cheque_no: '',
          transaction_ref: '',
        }))
      }
    }

    if (field === 'payment_type') {
      // Update party type to match payment type
      const newPartyType = value === 'Receipt' ? 'Customer' : 'Vendor'
      setFormData((prev) => ({
        ...prev,
        party_type: newPartyType,
        party_id: '',
        invoice_id: '',
        invoice_type: newPartyType === 'Customer' ? 'SalesInvoice' : 'PurchaseInvoice'
      }))
      setInvoices([])
    }

    if (field === 'invoice_id' && value) {
      // Auto-fill amount from selected invoice
      const selectedInvoice = invoices.find(inv => inv._id === value)
      if (selectedInvoice) {
        setFormData((prev) => ({ ...prev, amount: selectedInvoice.amount_due }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Prepare payload
      const payload = {
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        party_type: formData.party_type,
        party_id: formData.party_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        account_id: formData.account_id,
        created_by: userId,
      }

      // Add optional fields
      if (formData.bank_name) payload.bank_name = formData.bank_name
      if (formData.cheque_no) payload.cheque_no = formData.cheque_no
      if (formData.transaction_ref) payload.transaction_ref = formData.transaction_ref
      if (formData.invoice_id) {
        payload.invoice_id = formData.invoice_id
        payload.invoice_type = formData.invoice_type || (formData.party_type === 'Customer' ? 'SalesInvoice' : 'PurchaseInvoice')
      }
      if (formData.notes) payload.notes = formData.notes
      if (formData.internal_notes) payload.internal_notes = formData.internal_notes

      // API call
      const url = mode === 'edit' ? `/api/payments/${payment._id}` : '/api/payments'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(mode === 'edit' ? 'Payment updated successfully!' : 'Payment created successfully!')
        setTimeout(() => {
          router.push(`/sales/payments/${data.data._id}`)
        }, 1000)
      } else {
        setError(data.error || 'Failed to save payment')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const parties = formData.party_type === 'Customer' ? customers : vendors
  const needsBankDetails = ['Bank Transfer', 'Cheque', 'Online Payment'].includes(formData.payment_method)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <p>{success}</p>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Payment Information</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleChange('payment_date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_type">Payment Type *</Label>
              <Select
                id="payment_type"
                value={formData.payment_type}
                onChange={(e) => handleChange('payment_type', e.target.value)}
                required
              >
                <option value="Receipt">Receipt (from Customer)</option>
                <option value="Payment">Payment (to Vendor)</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Party Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {formData.payment_type === 'Receipt' ? 'Customer' : 'Vendor'} Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="party_id">
                {formData.payment_type === 'Receipt' ? 'Customer' : 'Vendor'} *
              </Label>
              <Select
                id="party_id"
                value={formData.party_id}
                onChange={(e) => handleChange('party_id', e.target.value)}
                required
              >
                <option value="">Select {formData.party_type}</option>
                {parties.map((party) => (
                  <option key={party._id} value={party._id}>
                    {party.customer_code || party.vendor_code} - {party.customer_name || party.vendor_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="invoice_id">Against Invoice (Optional)</Label>
              <Select
                id="invoice_id"
                value={formData.invoice_id}
                onChange={(e) => handleChange('invoice_id', e.target.value)}
                disabled={!formData.party_id}
              >
                <option value="">Select Invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice._id} value={invoice._id}>
                    {invoice.invoice_no} - Due: PKR {invoice.amount_due.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </Select>
              {formData.party_id && invoices.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No unpaid invoices found</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Details */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Payment Method</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                required
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
              <Label htmlFor="account_id">Cash/Bank Account *</Label>
              <Select
                id="account_id"
                value={formData.account_id}
                onChange={(e) => handleChange('account_id', e.target.value)}
                required
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
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="e.g., HBL, UBL, MCB"
                />
              </div>

              {formData.payment_method === 'Cheque' && (
                <div>
                  <Label htmlFor="cheque_no">Cheque Number</Label>
                  <Input
                    id="cheque_no"
                    type="text"
                    value={formData.cheque_no}
                    onChange={(e) => handleChange('cheque_no', e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="transaction_ref">Transaction Reference</Label>
                <Input
                  id="transaction_ref"
                  type="text"
                  value={formData.transaction_ref}
                  onChange={(e) => handleChange('transaction_ref', e.target.value)}
                  placeholder="Reference number"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notes visible to customer/vendor"
              />
            </div>

            <div>
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                rows={3}
                value={formData.internal_notes}
                onChange={(e) => handleChange('internal_notes', e.target.value)}
                placeholder="Internal notes (not visible to customer/vendor)"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Payment' : 'Create Payment'}
        </Button>
      </div>
    </form>
  )
}
