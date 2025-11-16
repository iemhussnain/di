/**
 * Category Form Component
 * Reusable form for creating and editing product categories
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function CategoryForm({ category = null, isEdit = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parentCategories, setParentCategories] = useState([])
  const [formData, setFormData] = useState({
    category_name: category?.category_name || '',
    description: category?.description || '',
    parent_id: category?.parent_id?._id || '',
  })

  // Fetch parent categories on mount
  useEffect(() => {
    fetchParentCategories()
  }, [])

  const fetchParentCategories = async () => {
    try {
      const response = await fetch('/api/categories?is_active=true&limit=1000')
      const data = await response.json()

      if (data.success) {
        // Filter out current category if editing (can't be its own parent)
        const categories = category
          ? data.data.filter((cat) => cat._id !== category._id)
          : data.data
        setParentCategories(categories || [])
      }
    } catch (error) {
      console.error('Error fetching parent categories:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/categories/${category._id}` : '/api/categories'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || `Category ${isEdit ? 'updated' : 'created'} successfully`)
        router.push('/inventory/categories')
        router.refresh()
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} category`)
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
        <CardTitle>{isEdit ? 'Edit Category' : 'Create New Category'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="category_name" required>
              Category Name
            </Label>
            <Input
              id="category_name"
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              placeholder="e.g., Electronics, Raw Materials"
              required
              maxLength={100}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Min 2 characters, max 100 characters
            </p>
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Category (Optional)</Label>
            <Select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
            >
              <option value="">-- No Parent (Root Category) --</option>
              {parentCategories.map((parent) => (
                <option key={parent._id} value={parent._id}>
                  {parent.category_name}
                  {parent.parent_id && ` (Sub-category of ${parent.parent_id.category_name || 'Unknown'})`}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select a parent to create a hierarchical category structure
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter category description..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Max 500 characters</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
