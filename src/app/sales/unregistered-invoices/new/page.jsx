'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewUnregisteredInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    reference: '',
    notes: ''
  })

  const [invoiceItems, setInvoiceItems] = useState([
    {
      product_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      discount_percentage: 0
    }
  ])

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      alert('Failed to load customers')
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c._id === customerId)
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      payment_terms: customer?.payment_terms || 'Net 30'
    }))

    // Auto-calculate due date based on payment terms
    if (customer?.payment_terms && formData.invoice_date) {
      const invoiceDate = new Date(formData.invoice_date)
      const days = parseInt(customer.payment_terms.replace(/\D/g, '')) || 30
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + days)
      setFormData(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0]
      }))
    }
  }

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p._id === productId)
    if (product) {
      const newItems = [...invoiceItems]
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        description: product.name,
        unit_price: product.selling_price || 0,
        tax_rate: product.tax_rate || 0
      }
      setInvoiceItems(newItems)
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setInvoiceItems(newItems)
  }

  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        product_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        discount_percentage: 0
      }
    ])
  }

  const removeItem = (index) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
    }
  }

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price
    const discount = (subtotal * item.discount_percentage) / 100
    const afterDiscount = subtotal - discount
    const tax = (afterDiscount * item.tax_rate) / 100
    return afterDiscount + tax
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0

    invoiceItems.forEach(item => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = (itemSubtotal * item.discount_percentage) / 100
      const afterDiscount = itemSubtotal - itemDiscount
      const itemTax = (afterDiscount * item.tax_rate) / 100

      subtotal += itemSubtotal
      totalDiscount += itemDiscount
      totalTax += itemTax
    })

    const total = subtotal - totalDiscount + totalTax

    return { subtotal, totalDiscount, totalTax, total }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.customer_id) {
      alert('Please select a customer')
      return
    }

    if (invoiceItems.length === 0 || !invoiceItems[0].product_id) {
      alert('Please add at least one item')
      return
    }

    const totals = calculateTotals()

    const payload = {
      ...formData,
      items: invoiceItems.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
        discount_percentage: parseFloat(item.discount_percentage),
        total_amount: calculateItemTotal(item)
      })),
      subtotal_amount: totals.subtotal,
      discount_amount: totals.totalDiscount,
      tax_amount: totals.totalTax,
      total_amount: totals.total,
      is_registered: false, // Force unregistered
      status: 'Draft'
    }

    try {
      setLoading(true)
      const res = await fetch('/api/sales-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create invoice')
      }

      const data = await res.json()
      alert('Invoice created successfully!')
      router.push(`/sales/unregistered-invoices/${data.invoice._id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            New Unregistered Invoice
          </h1>
          <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
            Simple Invoice
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Create an invoice for any customer without FBR registration requirements
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Invoice Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>Email: {selectedCustomer.email || 'N/A'}</div>
                  <div>Phone: {selectedCustomer.phone || 'N/A'}</div>
                </div>
              )}
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                placeholder="PO-2024-001"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes or instructions..."
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invoice Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              + Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Unit Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Discount %
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Tax %
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Total
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoiceItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white text-sm"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white text-sm"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-20 border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white text-sm"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="w-24 border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white text-sm"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.discount_percentage}
                        onChange={(e) => handleItemChange(index, 'discount_percentage', e.target.value)}
                        className="w-16 border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white text-sm"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.tax_rate}
                        onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                        className="w-16 border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white text-sm"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      Rs. {calculateItemTotal(item).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
        </div>

        {/* Totals Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="max-w-md ml-auto">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rs. {totals.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  - Rs. {totals.totalDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rs. {totals.totalTax.toLocaleString()}
                </span>
              </div>
              <div className="border-t dark:border-gray-600 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                  Rs. {totals.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/sales/unregistered-invoices"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
