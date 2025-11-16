/**
 * Categories List Page
 * Display all product categories with search, filter, and actions
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button,
  Input,
  Select,
  Table,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui'
import DashboardLayout from '@/components/layout/dashboard-layout'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus, Search, FolderTree } from 'lucide-react'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    parent_id: '',
    is_active: 'true',
  })

  useEffect(() => {
    fetchCategories()
  }, [pagination.page, filters])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.parent_id && { parent_id: filters.parent_id }),
        ...(filters.is_active && { is_active: filters.is_active }),
      })

      const response = await fetch(`/api/categories?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setCategories(data.data || [])
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('An error occurred while fetching categories')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCategories()
  }

  const handleDelete = async (categoryId, categoryName) => {
    if (!confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Category deleted successfully')
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('An error occurred while deleting category')
    }
  }

  const getLevelBadge = (level) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    ]
    return colors[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Categories</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your product category hierarchy
            </p>
          </div>
          <Link href="/inventory/categories/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <Input
                    name="search"
                    placeholder="Search by category name..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    autoComplete="off"
                  />
                </div>

                {/* Parent Filter */}
                <div>
                  <Select
                    name="parent_id"
                    value={filters.parent_id}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Levels</option>
                    <option value="null">Root Categories Only</option>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Select name="is_active" value={filters.is_active} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Categories ({pagination.total})
              {loading && <span className="text-sm font-normal ml-2">Loading...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 && !loading ? (
              <div className="text-center py-12">
                <FolderTree className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No categories found</p>
                <Link href="/inventory/categories/new">
                  <Button className="mt-4">Create First Category</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Parent Category</th>
                        <th>Level</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category._id}>
                          <td className="font-semibold text-gray-900 dark:text-gray-100">
                            {category.category_name}
                          </td>
                          <td className="text-sm text-gray-600 dark:text-gray-400">
                            {category.parent_id ? category.parent_id.category_name : '-'}
                          </td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadge(
                                category.level
                              )}`}
                            >
                              Level {category.level}
                            </span>
                          </td>
                          <td className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {category.description || '-'}
                          </td>
                          <td>
                            {category.is_active ? (
                              <span className="text-green-600 dark:text-green-400">Active</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">Inactive</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  router.push(`/inventory/categories/${category._id}/edit`)
                                }
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(category._id, category.category_name)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
