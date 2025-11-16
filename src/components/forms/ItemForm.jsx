/**
 * Item Form Component
 * Reusable form for creating and editing items/products
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import toast from 'react-hot-toast'

const UNITS_OF_MEASURE = ['Pcs', 'Kg', 'Liter', 'Meter', 'Box', 'Dozen', 'Carton', 'Pack']

export default function ItemForm({ item = null, isEdit = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    item_code: item?.item_code || '',
    item_name: item?.item_name || '',
    description: item?.description || '',
    category_id: item?.category_id?._id || '',
    unit_of_measure: item?.unit_of_measure || 'Pcs',

    // Initial stock (only for new items)
    registered_qty: item?.registered_qty || 0,
    unregistered_qty: item?.unregistered_qty || 0,

    // Costs
    cost_registered: item?.cost_registered || 0,
    cost_unregistered: item?.cost_unregistered || 0,

    // Pricing
    selling_price: item?.selling_price || 0,

    // Stock control
    reorder_level: item?.reorder_level || 0,
    reorder_qty: item?.reorder_qty || 0,

    // FBR
    hs_code: item?.hs_code || '',
    tax_rate: item?.tax_rate || 18,

    // Image
    image_url: item?.image_url || '',
  })

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?is_active=true&limit=1000')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/items/${item._id}` : '/api/items'
      const method = isEdit ? 'PUT' : 'POST'

      // Prepare data - exclude stock quantities if editing
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
      }

      // Remove stock quantities from edit payload (must be updated via stock movement)
      if (isEdit) {
        delete submitData.registered_qty
        delete submitData.unregistered_qty
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
        toast.success(data.message || `Item ${isEdit ? 'updated' : 'created'} successfully`)
        router.push('/inventory/items')
        router.refresh()
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} item`)
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
        <CardTitle>{isEdit ? 'Edit Item' : 'Create New Item'}</CardTitle>
        <CardDescription>
          {isEdit
            ? 'Update item details. Stock quantities must be adjusted through stock movement transactions.'
            : 'Add a new item to your inventory. You can set initial stock quantities here.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>

            {/* Item Code & Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_code" required>
                  Item Code
                </Label>
                <Input
                  id="item_code"
                  name="item_code"
                  value={formData.item_code}
                  onChange={handleChange}
                  placeholder="e.g., PROD-001"
                  required
                  maxLength={20}
                  className="uppercase"
                  autoComplete="off"
                  disabled={isEdit}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Max 20 characters, uppercase letters, numbers, hyphens only
                  {isEdit && ' (cannot be changed)'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_name" required>
                  Item Name
                </Label>
                <Input
                  id="item_name"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="e.g., Raw Material A"
                  required
                  maxLength={200}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Max 200 characters</p>
              </div>
            </div>

            {/* Category & Unit of Measure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.category_name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_of_measure" required>
                  Unit of Measure
                </Label>
                <Select
                  id="unit_of_measure"
                  name="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={handleChange}
                  required
                >
                  {UNITS_OF_MEASURE.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={1000}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Enter item description..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Max 1000 characters</p>
            </div>
          </div>

          {/* Stock & Costing Section */}
          {!isEdit && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Initial Stock & Costing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set initial stock quantities and costs. Future stock changes must be done through stock movement transactions.
              </p>

              {/* Registered Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registered_qty">Registered Quantity</Label>
                  <Input
                    id="registered_qty"
                    name="registered_qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.registered_qty}
                    onChange={handleChange}
                    placeholder="0"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_registered">Cost per Unit (Registered)</Label>
                  <Input
                    id="cost_registered"
                    name="cost_registered"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_registered}
                    onChange={handleChange}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Unregistered Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unregistered_qty">Unregistered Quantity</Label>
                  <Input
                    id="unregistered_qty"
                    name="unregistered_qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unregistered_qty}
                    onChange={handleChange}
                    placeholder="0"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_unregistered">Cost per Unit (Unregistered)</Label>
                  <Input
                    id="cost_unregistered"
                    name="cost_unregistered"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_unregistered}
                    onChange={handleChange}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing & Stock Control Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing & Stock Control</h3>

            {/* Selling Price */}
            {isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_registered">Cost per Unit (Registered)</Label>
                  <Input
                    id="cost_registered"
                    name="cost_registered"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_registered}
                    onChange={handleChange}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_unregistered">Cost per Unit (Unregistered)</Label>
                  <Input
                    id="cost_unregistered"
                    name="cost_unregistered"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_unregistered}
                    onChange={handleChange}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price</Label>
                <Input
                  id="selling_price"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input
                  id="reorder_level"
                  name="reorder_level"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  placeholder="0"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Alert when stock falls below this level</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_qty">Reorder Quantity</Label>
                <Input
                  id="reorder_qty"
                  name="reorder_qty"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reorder_qty}
                  onChange={handleChange}
                  placeholder="0"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Suggested reorder quantity</p>
              </div>
            </div>
          </div>

          {/* FBR & Tax Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">FBR & Tax Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hs_code">HS Code</Label>
                <Input
                  id="hs_code"
                  name="hs_code"
                  value={formData.hs_code}
                  onChange={handleChange}
                  placeholder="e.g., 8471.30.00"
                  maxLength={20}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Harmonized System Code for customs/tax purposes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  placeholder="18"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Default: 18% (Pakistan GST)</p>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Item Image</h3>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Optional: Provide a URL to an image for this item</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
