/**
 * Customer Form Component
 * Reusable form for creating and editing customers
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

const PAYMENT_TERMS = ['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90']
const CUSTOMER_STATUS = ['Active', 'Inactive', 'Blocked']
const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Kashmir',
  'Islamabad Capital Territory',
]

export default function CustomerForm({ customer = null, isEdit = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_code: customer?.customer_code || '',
    customer_name: customer?.customer_name || '',

    // Registration
    is_registered: customer?.is_registered || false,
    ntn: customer?.ntn || '',
    strn: customer?.strn || '',

    // Contact
    cnic: customer?.cnic || '',
    phone: customer?.phone || '',
    email: customer?.email || '',

    // Address
    street: customer?.address?.street || '',
    city: customer?.address?.city || '',
    province: customer?.address?.province || '',
    country: customer?.address?.country || 'Pakistan',
    postal_code: customer?.address?.postal_code || '',

    // Business
    credit_limit: customer?.credit_limit || 0,
    payment_terms: customer?.payment_terms || 'Cash',

    // Balances
    opening_balance: customer?.opening_balance || 0,

    // Status
    status: customer?.status || 'Active',

    // Notes
    notes: customer?.notes || '',
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }))
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      is_registered: checked,
      // Clear NTN/STRN if unchecking
      ...(!checked && { ntn: '', strn: '' }),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/customers/${customer._id}` : '/api/customers'
      const method = isEdit ? 'PUT' : 'POST'

      // Prepare data
      const submitData = {
        ...formData,
        address: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          country: formData.country,
          postal_code: formData.postal_code,
        },
      }

      // Remove address fields from root
      delete submitData.street
      delete submitData.city
      delete submitData.province
      delete submitData.country
      delete submitData.postal_code

      // Don't send customer_code if creating (auto-generated)
      if (!isEdit) {
        delete submitData.customer_code
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || `Customer ${isEdit ? 'updated' : 'created'} successfully`)
        router.push('/sales/customers')
        router.refresh()
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} customer`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('An error occurred while submitting the form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Customer' : 'Create New Customer'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update customer information' : 'Add a new customer to your database'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="customer_code">Customer Code</Label>
                  <Input
                    id="customer_code"
                    name="customer_code"
                    value={formData.customer_code}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cannot be changed</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="customer_name" required>
                  Customer Name
                </Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="e.g., ABC Corporation"
                  required
                  maxLength={200}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" required>
                  Status
                </Label>
                <Select id="status" name="status" value={formData.status} onChange={handleChange} required>
                  {CUSTOMER_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Registration Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_registered"
                checked={formData.is_registered}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_registered" className="cursor-pointer">
                Registered Customer (Has NTN/STRN)
              </Label>
            </div>

            {formData.is_registered && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-500 dark:border-blue-400">
                <div className="space-y-2">
                  <Label htmlFor="ntn">NTN (National Tax Number)</Label>
                  <Input
                    id="ntn"
                    name="ntn"
                    value={formData.ntn}
                    onChange={handleChange}
                    placeholder="1234567"
                    maxLength={7}
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">7 digits</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strn">STRN (Sales Tax Registration Number)</Label>
                  <Input
                    id="strn"
                    name="strn"
                    value={formData.strn}
                    onChange={handleChange}
                    placeholder="12-34-5678-901-23"
                    maxLength={20}
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Format: XX-XX-XXXX-XXX-XX</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" required>
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92-300-1234567"
                  required
                  maxLength={20}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC</Label>
                <Input
                  id="cnic"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  placeholder="12345-1234567-1"
                  maxLength={15}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Address Information</h3>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Main Street"
                maxLength={200}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Karachi"
                  maxLength={100}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select id="province" name="province" value={formData.province} onChange={handleChange}>
                  <option value="">-- Select Province --</option>
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="75500"
                  maxLength={20}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Terms</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  id="payment_terms"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  name="credit_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  placeholder="0.00"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Maximum credit allowed for this customer</p>
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="opening_balance">Opening Balance</Label>
                  <Input
                    id="opening_balance"
                    name="opening_balance"
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={handleChange}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Positive if customer owes us, negative if we owe customer
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Notes</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                placeholder="Enter any additional notes about this customer..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Max 1000 characters</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
