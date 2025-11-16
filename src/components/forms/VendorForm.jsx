'use client'

import { useState } from 'react'
import { Card, Input, Label, Checkbox, Textarea, Button, Badge, Alert } from '@/components/ui'

export default function VendorForm({ vendor = null, onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    vendor_name: vendor?.vendor_name || '',
    is_registered: vendor?.is_registered || false,
    ntn: vendor?.ntn || '',
    strn: vendor?.strn || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    address: {
      street: vendor?.address?.street || '',
      city: vendor?.address?.city || '',
      province: vendor?.address?.province || '',
      country: vendor?.address?.country || 'Pakistan',
      postal_code: vendor?.address?.postal_code || '',
    },
    payment_terms: vendor?.payment_terms || 'Cash',
    opening_balance: vendor?.opening_balance || 0,
    status: vendor?.status || 'Active',
    notes: vendor?.notes || '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      is_registered: checked,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Basic client-side validation
    const newErrors = {}

    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (formData.is_registered && !formData.ntn && !formData.strn) {
      newErrors.ntn = 'Registered vendors must have either NTN or STRN'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor_name">
                Vendor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vendor_name"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                placeholder="Enter vendor name"
                required
              />
              {errors.vendor_name && (
                <p className="text-sm text-red-500 mt-1">{errors.vendor_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tax Registration */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tax Registration</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_registered"
                checked={formData.is_registered}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_registered" className="cursor-pointer">
                Registered Vendor
              </Label>
            </div>
          </div>

          {formData.is_registered && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-500">
              <div>
                <Label htmlFor="ntn">NTN (National Tax Number)</Label>
                <Input
                  id="ntn"
                  name="ntn"
                  value={formData.ntn}
                  onChange={handleChange}
                  placeholder="1234567"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-1">7 digits</p>
              </div>

              <div>
                <Label htmlFor="strn">STRN (Sales Tax Registration Number)</Label>
                <Input
                  id="strn"
                  name="strn"
                  value={formData.strn}
                  onChange={handleChange}
                  placeholder="12-34-5678-901-23"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">Format: XX-XX-XXXX-XXX-XX</p>
              </div>

              {errors.ntn && (
                <div className="col-span-2">
                  <Alert variant="destructive">{errors.ntn}</Alert>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                required
              />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vendor@example.com"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Address */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Address</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="address.street">Street Address</Label>
              <Input
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="address.city">City</Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>

              <div>
                <Label htmlFor="address.province">Province</Label>
                <Input
                  id="address.province"
                  name="address.province"
                  value={formData.address.province}
                  onChange={handleChange}
                  placeholder="Province"
                />
              </div>

              <div>
                <Label htmlFor="address.postal_code">Postal Code</Label>
                <Input
                  id="address.postal_code"
                  name="address.postal_code"
                  value={formData.address.postal_code}
                  onChange={handleChange}
                  placeholder="54000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address.country">Country</Label>
              <Input
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                placeholder="Pakistan"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Terms & Balance */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Payment Terms & Balance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <select
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
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
              <Label htmlFor="opening_balance">Opening Balance (PKR)</Label>
              <Input
                id="opening_balance"
                name="opening_balance"
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={handleChange}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive = We owe vendor, Negative = Vendor owes us
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Additional Notes</h3>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this vendor..."
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : vendor ? 'Update Vendor' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  )
}
