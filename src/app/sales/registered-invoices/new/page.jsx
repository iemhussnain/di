'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewRegisteredInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: '',
    notes: '',
  })
  const [invoiceItems, setInvoiceItems] = useState([
    {
      item_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      tax_percentage: 18, // Default GST
    },
  ])

  useEffect(() => {
    fetchRegisteredCustomers()
    fetchItems()
  }, [])

  const fetchRegisteredCustomers = async () => {
    try {
      // Only fetch customers with NTN or STRN (registered)
      const res = await fetch('/api/customers/registered')
      const data = await res.json()
      if (data.success) {
        setCustomers(data.data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c._id === customerId)
    setSelectedCustomer(customer)
    setFormData({
      ...formData,
      customer_id: customerId,
    })
  }

  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        item_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        tax_percentage: 18,
      },
    ])
  }

  const removeItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const updated = [...invoiceItems]
    updated[index][field] = value

    if (field === 'item_id') {
      const selectedItem = items.find(item => item._id === value)
      if (selectedItem) {
        updated[index].description = selectedItem.description || selectedItem.name
        updated[index].unit_price = selectedItem.sale_price || 0
      }
    }

    if (['quantity', 'unit_price', 'discount_percentage', 'tax_percentage'].includes(field)) {
      const qty = parseFloat(updated[index].quantity) || 0
      const price = parseFloat(updated[index].unit_price) || 0
      const discountPct = parseFloat(updated[index].discount_percentage) || 0
      const taxPct = parseFloat(updated[index].tax_percentage) || 0

      const subtotal = qty * price
      const discountAmount = (subtotal * discountPct) / 100
      const taxableAmount = subtotal - discountAmount
      const taxAmount = (taxableAmount * taxPct) / 100
      const lineTotal = taxableAmount + taxAmount

      updated[index].discount_amount = discountAmount
      updated[index].tax_amount = taxAmount
      updated[index].line_total = lineTotal
    }

    setInvoiceItems(updated)
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0
    let total = 0

    invoiceItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      const discountPct = parseFloat(item.discount_percentage) || 0
      const taxPct = parseFloat(item.tax_percentage) || 0

      const itemSubtotal = qty * price
      const discountAmount = (itemSubtotal * discountPct) / 100
      const taxableAmount = itemSubtotal - discountAmount
      const taxAmount = (taxableAmount * taxPct) / 100

      subtotal += itemSubtotal
      totalDiscount += discountAmount
      totalTax += taxAmount
      total += taxableAmount + taxAmount
    })

    return { subtotal, totalDiscount, totalTax, total }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCustomer?.ntn && !selectedCustomer?.strn) {
      alert('Customer must have NTN or STRN for FBR registered invoice!')
      return
    }

    setLoading(true)

    try {
      const totals = calculateTotals()

      const lines = invoiceItems.map(item => ({
        item_id: item.item_id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_percentage: parseFloat(item.discount_percentage) || 0,
        discount_amount: item.discount_amount || 0,
        tax_percentage: parseFloat(item.tax_percentage) || 0,
        tax_amount: item.tax_amount || 0,
        line_total: item.line_total || 0,
      }))

      const payload = {
        customer_id: formData.customer_id,
        customer_name: selectedCustomer?.name,
        customer_code: selectedCustomer?.customer_code,
        customer_ntn: selectedCustomer?.ntn || '',
        customer_strn: selectedCustomer?.strn || '',
        is_registered: true, // Force registered
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        payment_terms: formData.payment_terms,
        lines: lines,
        subtotal: totals.subtotal,
        discount_amount: totals.totalDiscount,
        tax_amount: totals.totalTax,
        total_amount: totals.total,
        notes: formData.notes,
        status: 'Draft',
      }

      const res = await fetch('/api/sales-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        alert('Registered Sales Invoice created successfully!')
        router.push(`/sales/registered-invoices/${data.data._id}`)
      } else {
        alert(data.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            New Registered Sales Invoice (FBR)
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create FBR compliant invoice for registered customers
          </p>
        </div>
        <Link
          href="/sales/registered-invoices"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </Link>
      </div>

      {customers.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            ⚠️ No registered customers found. Please add customers with NTN/STRN first.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Invoice Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registered Customer (FBR) *
              </label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Registered Customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} ({customer.customer_code}) - {customer.ntn ? `NTN: ${customer.ntn}` : `STRN: ${customer.strn}`}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
                      ✓ FBR REGISTERED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCustomer.ntn && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">NTN:</span>{' '}
                        <span className="font-medium">{selectedCustomer.ntn}</span>
                      </div>
                    )}
                    {selectedCustomer.strn && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">STRN:</span>{' '}
                        <span className="font-medium">{selectedCustomer.strn}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>{' '}
                        <span className="font-medium">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                        <span className="font-medium">{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms
              </label>
              <select
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Terms</option>
                <option value="Cash">Cash</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Net 90">Net 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Items - Same as before */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invoice Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Disc %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">GST %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoiceItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <select
                        required
                        value={item.item_id}
                        onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select</option>
                        {items.map(itm => (
                          <option key={itm._id} value={itm._id}>{itm.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="w-24 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount_percentage}
                        onChange={(e) => updateItem(index, 'discount_percentage', e.target.value)}
                        className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.tax_percentage}
                        onChange={(e) => updateItem(index, 'tax_percentage', e.target.value)}
                        className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      Rs. {(item.line_total || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rs. {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <span className="font-medium text-red-600">
                    - Rs. {totals.totalDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">GST/Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rs. {totals.totalTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total Amount:</span>
                  <span className="text-blue-600">
                    Rs. {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Information
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes / Terms & Conditions
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Any additional notes, terms & conditions..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/sales/registered-invoices"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || invoiceItems.length === 0 || !formData.customer_id}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Registered Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
