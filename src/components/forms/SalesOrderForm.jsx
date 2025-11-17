'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Label, Alert } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'

export default function SalesOrderForm({ initialData = null, onSubmit, onCancel }) {
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mock user ID - in production this would come from auth context
  const userId = '507f1f77bcf86cd799439011'

  const [formData, setFormData] = useState({
    order_date: initialData?.order_date
      ? new Date(initialData.order_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    customer_id: initialData?.customer_id?._id || initialData?.customer_id || '',
    expected_delivery_date: initialData?.expected_delivery_date
      ? new Date(initialData.expected_delivery_date).toISOString().split('T')[0]
      : '',
    shipping_address: initialData?.shipping_address || {
      street: '',
      city: '',
      province: '',
      country: 'Pakistan',
      postal_code: '',
    },
    payment_terms: initialData?.payment_terms || 'Cash',
    reference_no: initialData?.reference_no || '',
    notes: initialData?.notes || '',
    internal_notes: initialData?.internal_notes || '',
    lines: initialData?.lines || [
      {
        item_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        discount_amount: 0,
        tax_percentage: 18,
        tax_amount: 0,
        line_total: 0,
      },
    ],
    created_by: initialData?.created_by || userId,
  })

  useEffect(() => {
    fetchCustomers()
    fetchItems()
  }, [])

  useEffect(() => {
    // Auto-populate customer address when customer is selected
    if (formData.customer_id && customers.length > 0) {
      const customer = customers.find((c) => c._id === formData.customer_id)
      if (customer && customer.address && !initialData) {
        setFormData((prev) => ({
          ...prev,
          shipping_address: customer.address,
          payment_terms: customer.payment_terms || 'Cash',
        }))
      }
    }
  }, [formData.customer_id, customers])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=1000&status=Active')
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items?limit=1000&is_active=true')
      const data = await response.json()
      if (response.ok) {
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      shipping_address: {
        ...prev.shipping_address,
        [name]: value,
      },
    }))
  }

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines]
    newLines[index][field] = value

    // Auto-populate item details
    if (field === 'item_id') {
      const item = items.find((i) => i._id === value)
      if (item) {
        newLines[index].description = item.description || ''
        newLines[index].unit_price = item.selling_price || 0
        newLines[index].tax_percentage = item.tax_rate || 18
      }
    }

    // Calculate line totals
    const line = newLines[index]
    const lineSubtotal = line.quantity * line.unit_price

    // Calculate discount
    if (field === 'discount_percentage') {
      line.discount_amount = (lineSubtotal * line.discount_percentage) / 100
    } else if (field === 'discount_amount') {
      line.discount_percentage = lineSubtotal > 0 ? (line.discount_amount / lineSubtotal) * 100 : 0
    }

    // Calculate tax
    const amountAfterDiscount = lineSubtotal - line.discount_amount
    line.tax_amount = (amountAfterDiscount * line.tax_percentage) / 100

    // Calculate line total
    line.line_total = amountAfterDiscount + line.tax_amount

    setFormData((prev) => ({ ...prev, lines: newLines }))
  }

  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          item_id: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_percentage: 0,
          discount_amount: 0,
          tax_percentage: 18,
          tax_amount: 0,
          line_total: 0,
        },
      ],
    }))
  }

  const handleRemoveLine = (index) => {
    if (formData.lines.length === 1) {
      alert('Sales order must have at least one line item')
      return
    }
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0)
    const totalDiscount = formData.lines.reduce((sum, line) => sum + parseFloat(line.discount_amount || 0), 0)
    const totalTax = formData.lines.reduce((sum, line) => sum + parseFloat(line.tax_amount || 0), 0)
    const grandTotal = subtotal - totalDiscount + totalTax

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()
  const selectedCustomer = customers.find((c) => c._id === formData.customer_id)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {/* Customer & Date Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Order Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="order_date">
                Order Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="order_date"
                name="order_date"
                type="date"
                value={formData.order_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="customer_id">
                Customer <span className="text-red-500">*</span>
              </Label>
              <select
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                required
              >
                <option value="">Select Customer...</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.customer_code} - {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="md:col-span-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold">Credit Limit:</span> PKR{' '}
                    {selectedCustomer.credit_limit?.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold">Outstanding:</span> PKR{' '}
                    {selectedCustomer.outstanding_balance?.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Terms:</span> {selectedCustomer.payment_terms}
                  </div>
                  <div>
                    <span className="font-semibold">Phone:</span> {selectedCustomer.phone}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <Input
                id="expected_delivery_date"
                name="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <select
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="Cash">Cash</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
              </select>
            </div>

            <div>
              <Label htmlFor="reference_no">Reference No</Label>
              <Input
                id="reference_no"
                name="reference_no"
                value={formData.reference_no}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Shipping Address */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Shipping Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                name="street"
                value={formData.shipping_address.street}
                onChange={handleAddressChange}
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.shipping_address.city}
                onChange={handleAddressChange}
              />
            </div>

            <div>
              <Label htmlFor="province">Province</Label>
              <Input
                id="province"
                name="province"
                value={formData.shipping_address.province}
                onChange={handleAddressChange}
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.shipping_address.postal_code}
                onChange={handleAddressChange}
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={formData.shipping_address.country}
                onChange={handleAddressChange}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Order Lines</h3>
            <Button type="button" onClick={handleAddLine} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Line
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Item
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Qty
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Price
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Disc %
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tax %
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {formData.lines.map((line, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-3">
                      <select
                        value={line.item_id}
                        onChange={(e) => handleLineChange(index, 'item_id', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                        required
                      >
                        <option value="">Select...</option>
                        {items.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.item_code} - {item.item_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <Input
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right w-20"
                        required
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => handleLineChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right w-24"
                        required
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.discount_percentage}
                        onChange={(e) =>
                          handleLineChange(index, 'discount_percentage', parseFloat(e.target.value) || 0)
                        }
                        className="text-sm text-right w-20"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.tax_percentage}
                        onChange={(e) => handleLineChange(index, 'tax_percentage', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right w-20"
                      />
                    </td>
                    <td className="px-2 py-3 text-right text-sm font-medium">
                      {line.line_total.toFixed(2)}
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLine(index)}
                        disabled={formData.lines.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>PKR {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Discount:</span>
                <span>PKR {totals.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tax:</span>
                <span>PKR {totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>PKR {totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Notes</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Customer Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              />
            </div>

            <div>
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                value={formData.internal_notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || formData.lines.length === 0}>
          {loading ? 'Saving...' : initialData ? 'Update Order' : 'Create Order'}
        </Button>
      </div>
    </form>
  )
}
